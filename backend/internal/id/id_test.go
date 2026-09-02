package id

import (
	"regexp"
	"testing"
)

func TestNew(t *testing.T) {
	t.Parallel()

	value, err := New()
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	pattern := regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
	if !pattern.MatchString(value) {
		t.Fatalf("New() = %q, want an rfc 4122 version 4 uuid", value)
	}
}
