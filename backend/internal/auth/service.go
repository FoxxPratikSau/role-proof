package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/foxxpratiksau/roleproof/backend/internal/id"
	"github.com/foxxpratiksau/roleproof/backend/internal/user"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("auth: invalid credentials")

// This public dummy hash equalizes unknown-user login timing and cannot authenticate an account.
const dummyPasswordHash = "$2a$12$9z0LVgbFAXloTUBWXocc8uGtICxkJ2P8Orx/3gu5How2RQ4w4r0Bu" //nolint:gosec // Not a credential.

// UserStore is the persistence contract consumed by authentication.
type UserStore interface {
	Create(ctx context.Context, value user.User) (user.User, error)
	FindByID(ctx context.Context, userID string) (user.User, error)
	FindByEmail(ctx context.Context, email string) (user.User, error)
}

// Service registers users and verifies credentials.
type Service struct {
	store      UserStore
	tokens     *TokenManager
	bcryptCost int
}

// NewService creates an authentication service with explicit dependencies.
func NewService(store UserStore, tokens *TokenManager, bcryptCost int) *Service {
	return &Service{store: store, tokens: tokens, bcryptCost: bcryptCost}
}

// Register hashes a password and persists a normalized user account.
func (s *Service) Register(
	ctx context.Context,
	name string,
	email string,
	password string,
) (user.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), s.bcryptCost)
	if err != nil {
		return user.User{}, fmt.Errorf("auth: hashing password: %w", err)
	}

	userID, err := id.New()
	if err != nil {
		return user.User{}, fmt.Errorf("auth: creating user id: %w", err)
	}

	created, err := s.store.Create(ctx, user.User{
		ID:           userID,
		Name:         strings.TrimSpace(name),
		Email:        normalizeEmail(email),
		PasswordHash: string(hash),
		Role:         "user",
	})
	if err != nil {
		return user.User{}, fmt.Errorf("auth: registering user: %w", err)
	}
	return created, nil
}

// Login verifies credentials and returns an access token.
func (s *Service) Login(
	ctx context.Context,
	email string,
	password string,
) (user.User, string, int64, error) {
	found, err := s.store.FindByEmail(ctx, normalizeEmail(email))
	if err != nil {
		if errors.Is(err, user.ErrNotFound) {
			compareErr := bcrypt.CompareHashAndPassword([]byte(dummyPasswordHash), []byte(password))
			if compareErr != nil && !errors.Is(compareErr, bcrypt.ErrMismatchedHashAndPassword) {
				return user.User{}, "", 0, fmt.Errorf("auth: comparing dummy password: %w", compareErr)
			}
			return user.User{}, "", 0, ErrInvalidCredentials
		}
		return user.User{}, "", 0, fmt.Errorf("auth: finding user: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(found.PasswordHash), []byte(password)); err != nil {
		return user.User{}, "", 0, ErrInvalidCredentials
	}

	token, expiresIn, err := s.tokens.Issue(found.ID, found.Role)
	if err != nil {
		return user.User{}, "", 0, err
	}
	return found, token, expiresIn, nil
}

// CurrentUser returns the account represented by a verified access token.
func (s *Service) CurrentUser(ctx context.Context, userID string) (user.User, error) {
	found, err := s.store.FindByID(ctx, userID)
	if err != nil {
		return user.User{}, fmt.Errorf("auth: finding current user: %w", err)
	}
	return found, nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
