// Package postgres implements repositories with explicit PostgreSQL queries.
package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/foxxpratiksau/roleproof/backend/internal/user"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserStore persists and retrieves users.
type UserStore struct {
	pool *pgxpool.Pool
}

// NewUserStore creates a PostgreSQL-backed user store.
func NewUserStore(pool *pgxpool.Pool) *UserStore {
	return &UserStore{pool: pool}
}

// Create inserts a user and returns its server-generated timestamps.
func (s *UserStore) Create(ctx context.Context, value user.User) (user.User, error) {
	const query = `
		INSERT INTO users (id, name, email, password_hash, role)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at, updated_at`

	err := s.pool.QueryRow(
		ctx,
		query,
		value.ID,
		value.Name,
		value.Email,
		value.PasswordHash,
		value.Role,
	).Scan(&value.CreatedAt, &value.UpdatedAt)
	if err == nil {
		return value, nil
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return user.User{}, user.ErrEmailExists
	}
	return user.User{}, fmt.Errorf("postgres: creating user: %w", err)
}

// FindByID returns a user by primary key.
func (s *UserStore) FindByID(ctx context.Context, userID string) (user.User, error) {
	const query = `
		SELECT id, name, email, password_hash, role, created_at, updated_at
		FROM users
		WHERE id = $1`

	value, err := scanUser(s.pool.QueryRow(ctx, query, userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return user.User{}, user.ErrNotFound
	}
	if err != nil {
		return user.User{}, fmt.Errorf("postgres: finding user by id: %w", err)
	}
	return value, nil
}

// FindByEmail returns a user by normalized email address.
func (s *UserStore) FindByEmail(ctx context.Context, email string) (user.User, error) {
	const query = `
		SELECT id, name, email, password_hash, role, created_at, updated_at
		FROM users
		WHERE email = $1`

	value, err := scanUser(s.pool.QueryRow(ctx, query, email))
	if errors.Is(err, pgx.ErrNoRows) {
		return user.User{}, user.ErrNotFound
	}
	if err != nil {
		return user.User{}, fmt.Errorf("postgres: finding user by email: %w", err)
	}
	return value, nil
}

func scanUser(row pgx.Row) (user.User, error) {
	var value user.User
	err := row.Scan(
		&value.ID,
		&value.Name,
		&value.Email,
		&value.PasswordHash,
		&value.Role,
		&value.CreatedAt,
		&value.UpdatedAt,
	)
	return value, err
}
