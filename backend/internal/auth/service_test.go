package auth

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/foxxpratiksau/roleproof/backend/internal/user"
	"golang.org/x/crypto/bcrypt"
)

type memoryUserStore struct {
	users map[string]user.User
}

func newMemoryUserStore() *memoryUserStore {
	return &memoryUserStore{users: map[string]user.User{}}
}

func (s *memoryUserStore) Create(_ context.Context, value user.User) (user.User, error) {
	if _, exists := s.users[value.Email]; exists {
		return user.User{}, user.ErrEmailExists
	}
	value.CreatedAt = time.Now().UTC()
	value.UpdatedAt = value.CreatedAt
	s.users[value.Email] = value
	return value, nil
}

func (s *memoryUserStore) FindByID(_ context.Context, userID string) (user.User, error) {
	for _, value := range s.users {
		if value.ID == userID {
			return value, nil
		}
	}
	return user.User{}, user.ErrNotFound
}

func (s *memoryUserStore) FindByEmail(_ context.Context, email string) (user.User, error) {
	value, exists := s.users[email]
	if !exists {
		return user.User{}, user.ErrNotFound
	}
	return value, nil
}

func TestServiceRegister(t *testing.T) {
	t.Parallel()

	store := newMemoryUserStore()
	service := NewService(
		store,
		NewTokenManager("test-secret-with-at-least-32-bytes", time.Minute),
		bcrypt.MinCost,
	)

	created, err := service.Register(t.Context(), "  Test User  ", "TEST@example.com ", "password123")
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}
	if created.Name != "Test User" {
		t.Errorf("Register() name = %q, want %q", created.Name, "Test User")
	}
	if created.Email != "test@example.com" {
		t.Errorf("Register() email = %q, want %q", created.Email, "test@example.com")
	}
	if created.PasswordHash == "password123" || created.PasswordHash == "" {
		t.Error("Register() stored an empty or plaintext password")
	}

	_, err = service.Register(t.Context(), "Other", "test@example.com", "password123")
	if !errors.Is(err, user.ErrEmailExists) {
		t.Fatalf("Register() duplicate error = %v, want ErrEmailExists", err)
	}
}

func TestServiceLogin(t *testing.T) {
	t.Parallel()

	store := newMemoryUserStore()
	tokens := NewTokenManager("test-secret-with-at-least-32-bytes", time.Minute)
	service := NewService(store, tokens, bcrypt.MinCost)
	created, err := service.Register(t.Context(), "Test User", "test@example.com", "password123")
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	tests := []struct {
		name        string
		email       string
		password    string
		wantErr     error
		wantSubject string
	}{
		{
			name:        "valid credentials",
			email:       "TEST@example.com",
			password:    "password123",
			wantSubject: created.ID,
		},
		{
			name:     "wrong password",
			email:    "test@example.com",
			password: "incorrect-password",
			wantErr:  ErrInvalidCredentials,
		},
		{
			name:     "unknown email",
			email:    "missing@example.com",
			password: "password123",
			wantErr:  ErrInvalidCredentials,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, token, expiresIn, err := service.Login(
				t.Context(),
				test.email,
				test.password,
			)
			if !errors.Is(err, test.wantErr) {
				t.Fatalf("Login() error = %v, want %v", err, test.wantErr)
			}
			if test.wantErr != nil {
				return
			}
			if token == "" || expiresIn != 60 {
				t.Fatalf("Login() token = %q, expiresIn = %d", token, expiresIn)
			}
			principal, err := tokens.Verify(token)
			if err != nil {
				t.Fatalf("Verify() error = %v", err)
			}
			if principal.UserID != test.wantSubject || principal.Role != "user" {
				t.Fatalf("Verify() principal = %+v", principal)
			}
		})
	}
}

func TestServiceCurrentUser(t *testing.T) {
	t.Parallel()

	store := newMemoryUserStore()
	service := NewService(
		store,
		NewTokenManager("test-secret-with-at-least-32-bytes", time.Minute),
		bcrypt.MinCost,
	)
	created, err := service.Register(t.Context(), "Test User", "test@example.com", "password123")
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	found, err := service.CurrentUser(t.Context(), created.ID)
	if err != nil {
		t.Fatalf("CurrentUser() error = %v", err)
	}
	if found.ID != created.ID || found.Email != created.Email {
		t.Fatalf("CurrentUser() = %+v, want user %q", found, created.ID)
	}

	if _, err := service.CurrentUser(t.Context(), "missing-user"); !errors.Is(err, user.ErrNotFound) {
		t.Fatalf("CurrentUser() missing error = %v, want ErrNotFound", err)
	}
}
