// Package user defines the persisted user model and repository errors.
package user

import (
	"errors"
	"time"
)

var (
	// ErrNotFound indicates that no matching user exists.
	ErrNotFound = errors.New("user: not found")
	// ErrEmailExists indicates that an email address is already registered.
	ErrEmailExists = errors.New("user: email exists")
)

// User is an authenticated RoleProof account.
type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
