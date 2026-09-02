package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/foxxpratiksau/roleproof/backend/internal/resume"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ResumeStore persists master resumes and reusable templates.
type ResumeStore struct {
	pool *pgxpool.Pool
}

// NewResumeStore creates a PostgreSQL-backed resume store.
func NewResumeStore(pool *pgxpool.Pool) *ResumeStore {
	return &ResumeStore{pool: pool}
}

// FindMaster returns the singleton master resume for a user.
func (s *ResumeStore) FindMaster(ctx context.Context, userID string) (resume.Master, error) {
	const query = `
		SELECT id, user_id, title, content, selected_template_id, schema_version,
		       version, created_at, updated_at
		FROM master_resumes
		WHERE user_id = $1`

	value, err := scanMaster(s.pool.QueryRow(ctx, query, userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return resume.Master{}, resume.ErrNotFound
	}
	if err != nil {
		return resume.Master{}, fmt.Errorf("postgres: finding master resume: %w", err)
	}
	return value, nil
}

// SaveMaster creates a resume at version zero or updates the expected version.
func (s *ResumeStore) SaveMaster(
	ctx context.Context,
	value resume.Master,
	expectedVersion int32,
) (resume.Master, error) {
	const query = `
		INSERT INTO master_resumes (
			id, user_id, title, content, selected_template_id, schema_version
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id) DO UPDATE
		SET title = EXCLUDED.title,
		    content = EXCLUDED.content,
		    selected_template_id = EXCLUDED.selected_template_id,
		    schema_version = EXCLUDED.schema_version,
		    version = master_resumes.version + 1,
		    updated_at = NOW()
		WHERE master_resumes.version = $7
		RETURNING id, user_id, title, content, selected_template_id, schema_version,
		          version, created_at, updated_at`

	saved, err := scanMaster(s.pool.QueryRow(
		ctx,
		query,
		value.ID,
		value.UserID,
		value.Title,
		value.Content,
		value.SelectedTemplateID,
		value.SchemaVersion,
		expectedVersion,
	))
	if errors.Is(err, pgx.ErrNoRows) {
		return resume.Master{}, resume.ErrConflict
	}
	if err != nil {
		return resume.Master{}, fmt.Errorf("postgres: saving master resume: %w", err)
	}
	return saved, nil
}

// DeleteMaster removes the singleton master resume for a user.
func (s *ResumeStore) DeleteMaster(ctx context.Context, userID string) error {
	command, err := s.pool.Exec(ctx, "DELETE FROM master_resumes WHERE user_id = $1", userID)
	if err != nil {
		return fmt.Errorf("postgres: deleting master resume: %w", err)
	}
	if command.RowsAffected() == 0 {
		return resume.ErrNotFound
	}
	return nil
}

// ListTemplates returns curated templates followed by current-user templates.
func (s *ResumeStore) ListTemplates(ctx context.Context, userID string) ([]resume.Template, error) {
	const query = `
		SELECT id, owner_user_id, slug, name, description, source_type,
		       source_filename, specification, created_at, updated_at
		FROM resume_templates
		WHERE owner_user_id IS NULL OR owner_user_id = $1
		ORDER BY CASE WHEN owner_user_id IS NULL THEN 0 ELSE 1 END,
		         CASE slug
		             WHEN 'ats-minimal' THEN 1
		             WHEN 'modern' THEN 2
		             WHEN 'technical' THEN 3
		             WHEN 'executive' THEN 4
		             ELSE 5
		         END,
		         name`

	rows, err := s.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("postgres: listing resume templates: %w", err)
	}
	defer rows.Close()

	values := make([]resume.Template, 0)
	for rows.Next() {
		value, scanErr := scanTemplate(rows)
		if scanErr != nil {
			return nil, fmt.Errorf("postgres: scanning resume template: %w", scanErr)
		}
		values = append(values, value)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("postgres: iterating resume templates: %w", err)
	}
	return values, nil
}

// FindTemplate returns a curated or tenant-owned template.
func (s *ResumeStore) FindTemplate(
	ctx context.Context,
	userID string,
	templateID string,
) (resume.Template, error) {
	const query = `
		SELECT id, owner_user_id, slug, name, description, source_type,
		       source_filename, specification, created_at, updated_at
		FROM resume_templates
		WHERE id = $1 AND (owner_user_id IS NULL OR owner_user_id = $2)`

	value, err := scanTemplate(s.pool.QueryRow(ctx, query, templateID, userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return resume.Template{}, resume.ErrTemplateNotFound
	}
	if err != nil {
		return resume.Template{}, fmt.Errorf("postgres: finding resume template: %w", err)
	}
	return value, nil
}

// CreateTemplate inserts a custom template owned by one user.
func (s *ResumeStore) CreateTemplate(
	ctx context.Context,
	value resume.Template,
) (resume.Template, error) {
	const query = `
		INSERT INTO resume_templates (
			id, owner_user_id, name, description, source_type,
			source_filename, specification
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, owner_user_id, slug, name, description, source_type,
		          source_filename, specification, created_at, updated_at`

	created, err := scanTemplate(s.pool.QueryRow(
		ctx,
		query,
		value.ID,
		value.OwnerUserID,
		value.Name,
		value.Description,
		value.SourceType,
		value.SourceFilename,
		value.Specification,
	))
	if err == nil {
		return created, nil
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return resume.Template{}, resume.ErrTemplateNameTaken
	}
	return resume.Template{}, fmt.Errorf("postgres: creating resume template: %w", err)
}

// DeleteTemplate removes only a custom template owned by the user.
func (s *ResumeStore) DeleteTemplate(ctx context.Context, userID, templateID string) error {
	command, err := s.pool.Exec(
		ctx,
		"DELETE FROM resume_templates WHERE id = $1 AND owner_user_id = $2",
		templateID,
		userID,
	)
	if err != nil {
		return fmt.Errorf("postgres: deleting resume template: %w", err)
	}
	if command.RowsAffected() == 0 {
		return resume.ErrTemplateNotFound
	}
	return nil
}

func scanMaster(row pgx.Row) (resume.Master, error) {
	var value resume.Master
	err := row.Scan(
		&value.ID,
		&value.UserID,
		&value.Title,
		&value.Content,
		&value.SelectedTemplateID,
		&value.SchemaVersion,
		&value.Version,
		&value.CreatedAt,
		&value.UpdatedAt,
	)
	return value, err
}

func scanTemplate(row pgx.Row) (resume.Template, error) {
	var value resume.Template
	err := row.Scan(
		&value.ID,
		&value.OwnerUserID,
		&value.Slug,
		&value.Name,
		&value.Description,
		&value.SourceType,
		&value.SourceFilename,
		&value.Specification,
		&value.CreatedAt,
		&value.UpdatedAt,
	)
	return value, err
}
