package resume

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"
)

type memoryStore struct {
	master    *Master
	templates map[string]Template
}

func (s *memoryStore) FindMaster(_ context.Context, userID string) (Master, error) {
	if s.master == nil || s.master.UserID != userID {
		return Master{}, ErrNotFound
	}
	return *s.master, nil
}

func (s *memoryStore) SaveMaster(_ context.Context, value Master, expectedVersion int32) (Master, error) {
	if s.master != nil && s.master.Version != expectedVersion {
		return Master{}, ErrConflict
	}
	if s.master == nil {
		value.Version = 1
		value.CreatedAt = time.Now()
	} else {
		value.ID = s.master.ID
		value.Version = s.master.Version + 1
		value.CreatedAt = s.master.CreatedAt
	}
	value.UpdatedAt = time.Now()
	s.master = &value
	return value, nil
}

func (s *memoryStore) DeleteMaster(_ context.Context, userID string) error {
	if s.master == nil || s.master.UserID != userID {
		return ErrNotFound
	}
	s.master = nil
	return nil
}

func (s *memoryStore) ListTemplates(_ context.Context, userID string) ([]Template, error) {
	values := make([]Template, 0)
	for _, value := range s.templates {
		if value.OwnerUserID == nil || *value.OwnerUserID == userID {
			values = append(values, value)
		}
	}
	return values, nil
}

func (s *memoryStore) FindTemplate(_ context.Context, userID, templateID string) (Template, error) {
	value, ok := s.templates[templateID]
	if !ok || (value.OwnerUserID != nil && *value.OwnerUserID != userID) {
		return Template{}, ErrTemplateNotFound
	}
	return value, nil
}

func (s *memoryStore) CreateTemplate(_ context.Context, value Template) (Template, error) {
	for _, existing := range s.templates {
		if existing.OwnerUserID != nil && value.OwnerUserID != nil &&
			*existing.OwnerUserID == *value.OwnerUserID && existing.Name == value.Name {
			return Template{}, ErrTemplateNameTaken
		}
	}
	s.templates[value.ID] = value
	return value, nil
}

func (s *memoryStore) DeleteTemplate(_ context.Context, userID, templateID string) error {
	value, ok := s.templates[templateID]
	if !ok || value.OwnerUserID == nil || *value.OwnerUserID != userID {
		return ErrTemplateNotFound
	}
	delete(s.templates, templateID)
	return nil
}

func TestSaveMasterValidatesOwnershipAndVersion(t *testing.T) {
	t.Parallel()
	owner := "00000000-0000-4000-8000-000000000001"
	other := "00000000-0000-4000-8000-000000000002"
	templateID := "10000000-0000-4000-8000-000000000001"
	store := &memoryStore{templates: map[string]Template{
		templateID: {ID: templateID, OwnerUserID: &other},
	}}
	service := NewService(store, store)
	content := json.RawMessage(`{"name":"Test User","email":"test@example.com","skills":[],"experience":[],"education":[]}`)

	if _, err := service.SaveMaster(context.Background(), owner, "Master", content, &templateID, 0); !errors.Is(err, ErrTemplateNotFound) {
		t.Fatalf("SaveMaster() inaccessible template error = %v, want ErrTemplateNotFound", err)
	}

	store.templates[templateID] = Template{ID: templateID}
	saved, err := service.SaveMaster(context.Background(), owner, "Master", content, &templateID, 0)
	if err != nil {
		t.Fatalf("SaveMaster() error = %v", err)
	}
	if saved.Version != 1 || saved.SelectedTemplateID == nil || *saved.SelectedTemplateID != templateID {
		t.Fatalf("SaveMaster() = %+v", saved)
	}
	if _, err := service.SaveMaster(context.Background(), owner, "Master", content, &templateID, 0); !errors.Is(err, ErrConflict) {
		t.Fatalf("SaveMaster() stale version error = %v, want ErrConflict", err)
	}
}

func TestCreateTemplateValidatesSpecification(t *testing.T) {
	t.Parallel()
	store := &memoryStore{templates: make(map[string]Template)}
	service := NewService(store, store)
	valid := json.RawMessage(`{"schemaVersion":1,"style":"minimal","tone":"direct","sectionOrder":["experience"],"sectionHeadings":{},"contentRules":["Use evidence"],"formattingRules":["One column"],"promptInstructions":"Write concisely."}`)

	created, err := service.CreateTemplate(context.Background(), "user-1", "My template", "", "source.pdf", valid)
	if err != nil {
		t.Fatalf("CreateTemplate() error = %v", err)
	}
	if created.SourceType != "uploaded" || created.OwnerUserID == nil || *created.OwnerUserID != "user-1" {
		t.Fatalf("CreateTemplate() = %+v", created)
	}
	if _, err := service.CreateTemplate(context.Background(), "user-1", "Bad", "", "source.pdf", json.RawMessage(`{}`)); !errors.Is(err, ErrInvalid) {
		t.Fatalf("CreateTemplate() invalid spec error = %v, want ErrInvalid", err)
	}
}
