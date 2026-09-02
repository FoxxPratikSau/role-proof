//go:build integration

package postgres_test

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/foxxpratiksau/roleproof/backend/internal/database"
	"github.com/foxxpratiksau/roleproof/backend/internal/id"
	"github.com/foxxpratiksau/roleproof/backend/internal/postgres"
	"github.com/foxxpratiksau/roleproof/backend/internal/user"
	"github.com/jackc/pgx/v5/pgxpool"
)

func openIntegrationDatabase(t *testing.T) (context.Context, *pgxpool.Pool) {
	t.Helper()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Fatal("DATABASE_URL is required for integration tests")
	}
	if err := database.Migrate(databaseURL); err != nil {
		t.Fatalf("Migrate() error = %v", err)
	}

	ctx, cancel := context.WithTimeout(t.Context(), 10*time.Second)
	t.Cleanup(cancel)
	pool, err := database.Open(ctx, databaseURL, 2, time.Minute)
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	t.Cleanup(pool.Close)
	return ctx, pool
}

func createIntegrationUser(
	t *testing.T,
	ctx context.Context,
	store *postgres.UserStore,
	email string,
) user.User {
	t.Helper()
	userID, err := id.New()
	if err != nil {
		t.Fatalf("id.New() error = %v", err)
	}
	created, err := store.Create(ctx, user.User{
		ID: userID, Name: "Resume Integration", Email: email,
		PasswordHash: "not-a-real-hash", Role: "user",
	})
	if err != nil {
		t.Fatalf("creating integration user: %v", err)
	}
	return created
}
