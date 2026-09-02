//go:build integration

package postgres_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/foxxpratiksau/roleproof/backend/internal/postgres"
	"github.com/foxxpratiksau/roleproof/backend/internal/user"
)

func TestUserStoreIntegration(t *testing.T) {
	ctx, pool := openIntegrationDatabase(t)

	const email = "integration-user@example.com"
	if _, err := pool.Exec(ctx, "DELETE FROM users WHERE email = $1", email); err != nil {
		t.Fatalf("preparing integration fixture: %v", err)
	}
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanupCancel()
		if _, err := pool.Exec(cleanupCtx, "DELETE FROM users WHERE email = $1", email); err != nil {
			t.Errorf("cleaning integration fixture: %v", err)
		}
	})

	store := postgres.NewUserStore(pool)
	created := createIntegrationUser(t, ctx, store, email)
	if created.CreatedAt.IsZero() || created.UpdatedAt.IsZero() {
		t.Fatalf("Create() timestamps = %v, %v", created.CreatedAt, created.UpdatedAt)
	}

	found, err := store.FindByEmail(ctx, email)
	if err != nil {
		t.Fatalf("FindByEmail() error = %v", err)
	}
	if found.ID != created.ID || found.Email != email {
		t.Fatalf("FindByEmail() = %+v", found)
	}

	foundByID, err := store.FindByID(ctx, created.ID)
	if err != nil {
		t.Fatalf("FindByID() error = %v", err)
	}
	if foundByID.ID != created.ID || foundByID.Email != email {
		t.Fatalf("FindByID() = %+v", foundByID)
	}

	if _, err := store.FindByID(ctx, "00000000-0000-4000-8000-000000000099"); !errors.Is(err, user.ErrNotFound) {
		t.Fatalf("FindByID() missing error = %v, want ErrNotFound", err)
	}

	if _, err := store.Create(ctx, found); !errors.Is(err, user.ErrEmailExists) {
		t.Fatalf("Create() duplicate error = %v, want ErrEmailExists", err)
	}
}
