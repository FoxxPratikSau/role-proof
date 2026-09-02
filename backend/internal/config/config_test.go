package config

import "testing"

const testJWTSecret = "test-secret-with-at-least-32-bytes"

func setRequiredEnvironment(t *testing.T) {
	t.Helper()
	t.Setenv("DATABASE_URL", "postgres://roleproof:test@localhost:5432/roleproof")
	t.Setenv("JWT_SECRET", testJWTSecret)
}

func TestLoadDatabaseMaxConns(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("DATABASE_MAX_CONNS", "24")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.DatabaseMaxConns != 24 {
		t.Fatalf("DatabaseMaxConns = %d, want 24", cfg.DatabaseMaxConns)
	}
}

func TestLoadRejectsInvalidDatabaseMaxConns(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("DATABASE_MAX_CONNS", "0")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want invalid DATABASE_MAX_CONNS error")
	}
}
