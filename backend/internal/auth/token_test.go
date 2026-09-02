package auth

import (
	"errors"
	"testing"
	"time"
)

func TestTokenManagerVerify(t *testing.T) {
	t.Parallel()

	manager := NewTokenManager("test-secret-with-at-least-32-bytes", time.Minute)
	token, _, err := manager.Issue("user-id", "admin")
	if err != nil {
		t.Fatalf("Issue() error = %v", err)
	}

	principal, err := manager.Verify(token)
	if err != nil {
		t.Fatalf("Verify() error = %v", err)
	}
	if principal.UserID != "user-id" || principal.Role != "admin" {
		t.Fatalf("Verify() = %+v", principal)
	}

	other := NewTokenManager("different-secret-with-32-bytes!!", time.Minute)
	if _, err := other.Verify(token); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("Verify() wrong secret error = %v, want ErrInvalidToken", err)
	}
}
