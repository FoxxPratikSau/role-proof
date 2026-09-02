// Package resume defines persisted master resumes and reusable writing templates.
package resume

import (
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrNotFound          = errors.New("resume: not found")
	ErrConflict          = errors.New("resume: version conflict")
	ErrTemplateNotFound  = errors.New("resume: template not found")
	ErrTemplateNameTaken = errors.New("resume: template name taken")
	ErrInvalid           = errors.New("resume: invalid input")
)

// Master is the canonical resume owned by one user.
type Master struct {
	ID                 string          `json:"id"`
	UserID             string          `json:"-"`
	Title              string          `json:"title"`
	Content            json.RawMessage `json:"content"`
	SelectedTemplateID *string         `json:"selected_template_id"`
	SchemaVersion      int16           `json:"schema_version"`
	Version            int32           `json:"version"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}

// Template contains AI writing guidance derived from a curated or uploaded template.
type Template struct {
	ID             string          `json:"id"`
	OwnerUserID    *string         `json:"-"`
	Slug           *string         `json:"slug"`
	Name           string          `json:"name"`
	Description    string          `json:"description"`
	SourceType     string          `json:"source_type"`
	SourceFilename *string         `json:"source_filename"`
	Specification  json.RawMessage `json:"specification"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}
