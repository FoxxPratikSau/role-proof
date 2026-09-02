package migrations

import (
	"io/fs"
	"strings"
	"testing"
)

func TestSchemaMigrationsHaveUpAndDownFiles(t *testing.T) {
	t.Parallel()

	upFiles, err := fs.Glob(Files, "schema/*.up.sql")
	if err != nil {
		t.Fatalf("Glob(up) error = %v", err)
	}
	downFiles, err := fs.Glob(Files, "schema/*.down.sql")
	if err != nil {
		t.Fatalf("Glob(down) error = %v", err)
	}
	if len(upFiles) == 0 || len(upFiles) != len(downFiles) {
		t.Fatalf("migration counts: up = %d, down = %d", len(upFiles), len(downFiles))
	}

	downSet := make(map[string]struct{}, len(downFiles))
	for _, path := range downFiles {
		downSet[strings.TrimSuffix(path, ".down.sql")] = struct{}{}
	}
	for _, path := range upFiles {
		prefix := strings.TrimSuffix(path, ".up.sql")
		if _, exists := downSet[prefix]; !exists {
			t.Errorf("migration %q has no matching down file", path)
		}
	}
}
