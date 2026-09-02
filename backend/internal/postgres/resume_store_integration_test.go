//go:build integration

package postgres_test

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/foxxpratiksau/roleproof/backend/internal/id"
	"github.com/foxxpratiksau/roleproof/backend/internal/postgres"
	"github.com/foxxpratiksau/roleproof/backend/internal/resume"
)

func TestResumeStoreIntegration(t *testing.T) {
	ctx, pool := openIntegrationDatabase(t)

	const ownerEmail = "resume-owner-integration@example.com"
	const otherEmail = "resume-other-integration@example.com"
	if _, err := pool.Exec(ctx, "DELETE FROM users WHERE email IN ($1, $2)", ownerEmail, otherEmail); err != nil {
		t.Fatalf("preparing integration fixtures: %v", err)
	}
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanupCancel()
		if _, err := pool.Exec(cleanupCtx, "DELETE FROM users WHERE email IN ($1, $2)", ownerEmail, otherEmail); err != nil {
			t.Errorf("cleaning integration fixtures: %v", err)
		}
	})

	userStore := postgres.NewUserStore(pool)
	owner := createIntegrationUser(t, ctx, userStore, ownerEmail)
	other := createIntegrationUser(t, ctx, userStore, otherEmail)
	store := postgres.NewResumeStore(pool)
	templates, err := store.ListTemplates(ctx, owner.ID)
	if err != nil || len(templates) < 4 {
		t.Fatalf("ListTemplates() count = %d, error = %v", len(templates), err)
	}

	masterID, err := id.New()
	if err != nil {
		t.Fatalf("id.New() error = %v", err)
	}
	content := json.RawMessage(`{"name":"Owner","email":"owner@example.com","skills":[],"experience":[],"education":[]}`)
	created, err := store.SaveMaster(ctx, resume.Master{
		ID: masterID, UserID: owner.ID, Title: "Master", Content: content,
		SelectedTemplateID: &templates[0].ID, SchemaVersion: 1,
	}, 0)
	if err != nil || created.Version != 1 {
		t.Fatalf("SaveMaster() create = %+v, error = %v", created, err)
	}
	if _, err := store.SaveMaster(ctx, created, 0); !errors.Is(err, resume.ErrConflict) {
		t.Fatalf("SaveMaster() stale error = %v, want ErrConflict", err)
	}

	templateID, err := id.New()
	if err != nil {
		t.Fatalf("id.New() error = %v", err)
	}
	ownerID := owner.ID
	filename := "sample.pdf"
	custom, err := store.CreateTemplate(ctx, resume.Template{
		ID: templateID, OwnerUserID: &ownerID, Name: "Integration template",
		SourceType: "uploaded", SourceFilename: &filename,
		Specification: json.RawMessage(`{"schemaVersion":1}`),
	})
	if err != nil {
		t.Fatalf("CreateTemplate() error = %v", err)
	}
	if _, err := store.FindTemplate(ctx, other.ID, custom.ID); !errors.Is(err, resume.ErrTemplateNotFound) {
		t.Fatalf("FindTemplate() cross-tenant error = %v, want ErrTemplateNotFound", err)
	}
	if err := store.DeleteTemplate(ctx, other.ID, custom.ID); !errors.Is(err, resume.ErrTemplateNotFound) {
		t.Fatalf("DeleteTemplate() cross-tenant error = %v, want ErrTemplateNotFound", err)
	}
	if err := store.DeleteTemplate(ctx, owner.ID, custom.ID); err != nil {
		t.Fatalf("DeleteTemplate() error = %v", err)
	}
}
