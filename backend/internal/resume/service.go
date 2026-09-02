package resume

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/foxxpratiksau/roleproof/backend/internal/id"
)

const (
	maxMasterContentBytes = 900 << 10
	maxSpecificationBytes = 64 << 10
)

// MasterStore persists the per-user canonical resume.
type MasterStore interface {
	FindMaster(ctx context.Context, userID string) (Master, error)
	SaveMaster(ctx context.Context, value Master, expectedVersion int32) (Master, error)
	DeleteMaster(ctx context.Context, userID string) error
}

// TemplateStore persists curated and user-owned resume templates.
type TemplateStore interface {
	ListTemplates(ctx context.Context, userID string) ([]Template, error)
	FindTemplate(ctx context.Context, userID, templateID string) (Template, error)
	CreateTemplate(ctx context.Context, value Template) (Template, error)
	DeleteTemplate(ctx context.Context, userID, templateID string) error
}

// Service coordinates resume persistence and tenant-safe template selection.
type Service struct {
	masters   MasterStore
	templates TemplateStore
}

// NewService creates a resume service from explicit persistence dependencies.
func NewService(masters MasterStore, templates TemplateStore) *Service {
	return &Service{masters: masters, templates: templates}
}

// Master returns the current user's canonical resume.
func (s *Service) Master(ctx context.Context, userID string) (Master, error) {
	value, err := s.masters.FindMaster(ctx, userID)
	if err != nil {
		return Master{}, fmt.Errorf("resume: finding master: %w", err)
	}
	return value, nil
}

// SaveMaster creates or version-safely updates the current user's resume.
func (s *Service) SaveMaster(
	ctx context.Context,
	userID string,
	title string,
	content json.RawMessage,
	selectedTemplateID *string,
	expectedVersion int32,
) (Master, error) {
	if expectedVersion < 0 {
		return Master{}, fmt.Errorf("%w: expected version must not be negative", ErrInvalid)
	}
	title = strings.TrimSpace(title)
	if title == "" || len(title) > 120 {
		return Master{}, fmt.Errorf("%w: invalid title", ErrInvalid)
	}
	if err := validateMasterContent(content); err != nil {
		return Master{}, err
	}
	if selectedTemplateID != nil {
		templateID := strings.TrimSpace(*selectedTemplateID)
		if templateID == "" {
			selectedTemplateID = nil
		} else {
			if _, err := s.templates.FindTemplate(ctx, userID, templateID); err != nil {
				if errors.Is(err, ErrTemplateNotFound) {
					return Master{}, ErrTemplateNotFound
				}
				return Master{}, fmt.Errorf("resume: checking selected template: %w", err)
			}
			selectedTemplateID = &templateID
		}
	}

	resumeID, err := id.New()
	if err != nil {
		return Master{}, fmt.Errorf("resume: creating master id: %w", err)
	}
	value, err := s.masters.SaveMaster(ctx, Master{
		ID:                 resumeID,
		UserID:             userID,
		Title:              title,
		Content:            content,
		SelectedTemplateID: selectedTemplateID,
		SchemaVersion:      1,
	}, expectedVersion)
	if err != nil {
		return Master{}, fmt.Errorf("resume: saving master: %w", err)
	}
	return value, nil
}

// DeleteMaster removes the current user's canonical resume.
func (s *Service) DeleteMaster(ctx context.Context, userID string) error {
	if err := s.masters.DeleteMaster(ctx, userID); err != nil {
		return fmt.Errorf("resume: deleting master: %w", err)
	}
	return nil
}

// Templates returns built-in and current-user templates.
func (s *Service) Templates(ctx context.Context, userID string) ([]Template, error) {
	values, err := s.templates.ListTemplates(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("resume: listing templates: %w", err)
	}
	return values, nil
}

// Template returns a template only when it is curated or owned by the user.
func (s *Service) Template(ctx context.Context, userID, templateID string) (Template, error) {
	value, err := s.templates.FindTemplate(ctx, userID, templateID)
	if err != nil {
		return Template{}, fmt.Errorf("resume: finding template: %w", err)
	}
	return value, nil
}

// CreateTemplate saves AI-derived instructions without retaining uploaded document bytes.
func (s *Service) CreateTemplate(
	ctx context.Context,
	userID string,
	name string,
	description string,
	sourceFilename string,
	specification json.RawMessage,
) (Template, error) {
	name = strings.TrimSpace(name)
	description = strings.TrimSpace(description)
	sourceFilename = strings.TrimSpace(sourceFilename)
	if name == "" || len(name) > 120 {
		return Template{}, fmt.Errorf("%w: invalid template name", ErrInvalid)
	}
	if len(description) > 500 {
		return Template{}, fmt.Errorf("%w: template description too long", ErrInvalid)
	}
	if sourceFilename == "" || len(sourceFilename) > 255 {
		return Template{}, fmt.Errorf("%w: invalid source filename", ErrInvalid)
	}
	if err := validateTemplateSpecification(specification); err != nil {
		return Template{}, err
	}

	templateID, err := id.New()
	if err != nil {
		return Template{}, fmt.Errorf("resume: creating template id: %w", err)
	}
	value, err := s.templates.CreateTemplate(ctx, Template{
		ID:             templateID,
		OwnerUserID:    &userID,
		Name:           name,
		Description:    description,
		SourceType:     "uploaded",
		SourceFilename: &sourceFilename,
		Specification:  specification,
	})
	if err != nil {
		return Template{}, fmt.Errorf("resume: creating template: %w", err)
	}
	return value, nil
}

// DeleteTemplate removes only a custom template owned by the current user.
func (s *Service) DeleteTemplate(ctx context.Context, userID, templateID string) error {
	if err := s.templates.DeleteTemplate(ctx, userID, templateID); err != nil {
		return fmt.Errorf("resume: deleting template: %w", err)
	}
	return nil
}

func validateMasterContent(content json.RawMessage) error {
	if len(content) == 0 || len(content) > maxMasterContentBytes {
		return fmt.Errorf("%w: invalid master content size", ErrInvalid)
	}
	var value struct {
		Name       json.RawMessage `json:"name"`
		Email      json.RawMessage `json:"email"`
		Skills     json.RawMessage `json:"skills"`
		Experience json.RawMessage `json:"experience"`
		Education  json.RawMessage `json:"education"`
	}
	if err := json.Unmarshal(content, &value); err != nil {
		return fmt.Errorf("%w: master content must be valid json", ErrInvalid)
	}
	if len(value.Name) == 0 || len(value.Email) == 0 || len(value.Skills) == 0 ||
		len(value.Experience) == 0 || len(value.Education) == 0 {
		return fmt.Errorf("%w: master content is missing required fields", ErrInvalid)
	}
	var name, email string
	var experience, education []json.RawMessage
	if json.Unmarshal(value.Name, &name) != nil || json.Unmarshal(value.Email, &email) != nil ||
		json.Unmarshal(value.Experience, &experience) != nil ||
		json.Unmarshal(value.Education, &education) != nil {
		return fmt.Errorf("%w: master content has invalid field types", ErrInvalid)
	}
	if strings.TrimSpace(name) == "" || strings.TrimSpace(email) == "" {
		return fmt.Errorf("%w: master name and email are required", ErrInvalid)
	}
	return nil
}

func validateTemplateSpecification(specification json.RawMessage) error {
	if len(specification) == 0 || len(specification) > maxSpecificationBytes {
		return fmt.Errorf("%w: invalid template specification size", ErrInvalid)
	}
	var value struct {
		SchemaVersion      int               `json:"schemaVersion"`
		Style              string            `json:"style"`
		Tone               string            `json:"tone"`
		SectionOrder       []string          `json:"sectionOrder"`
		SectionHeadings    map[string]string `json:"sectionHeadings"`
		ContentRules       []string          `json:"contentRules"`
		FormattingRules    []string          `json:"formattingRules"`
		PromptInstructions string            `json:"promptInstructions"`
	}
	if err := json.Unmarshal(specification, &value); err != nil {
		return fmt.Errorf("%w: template specification must be valid json", ErrInvalid)
	}
	if value.SchemaVersion != 1 || strings.TrimSpace(value.Style) == "" ||
		strings.TrimSpace(value.Tone) == "" || len(value.SectionOrder) == 0 ||
		len(value.ContentRules) == 0 || len(value.FormattingRules) == 0 ||
		strings.TrimSpace(value.PromptInstructions) == "" {
		return fmt.Errorf("%w: incomplete template specification", ErrInvalid)
	}
	return nil
}
