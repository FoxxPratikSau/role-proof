// Package database owns PostgreSQL connection and schema migration lifecycle.
package database

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/foxxpratiksau/roleproof/backend/migrations"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
)

// Migrate applies every pending embedded schema migration.
func Migrate(databaseURL string) error {
	return runMigrations(databaseURL, func(runner *migrate.Migrate) error {
		return runner.Up()
	})
}

// MigrateDown rolls back a positive number of schema versions.
func MigrateDown(databaseURL string, steps int) error {
	if steps <= 0 {
		return errors.New("database: migration steps must be positive")
	}
	return runMigrations(databaseURL, func(runner *migrate.Migrate) error {
		return runner.Steps(-steps)
	})
}

func runMigrations(
	databaseURL string,
	apply func(runner *migrate.Migrate) error,
) error {
	source, err := iofs.New(migrations.Files, "schema")
	if err != nil {
		return fmt.Errorf("database: opening migration source: %w", err)
	}

	runner, err := migrate.NewWithSourceInstance("iofs", source, databaseURL)
	if err != nil {
		return fmt.Errorf("database: creating migration runner: %w", err)
	}

	migrationErr := apply(runner)
	sourceErr, databaseErr := runner.Close()
	closeErr := errors.Join(sourceErr, databaseErr)

	if migrationErr != nil && !errors.Is(migrationErr, migrate.ErrNoChange) {
		return errors.Join(fmt.Errorf("database: applying migrations: %w", migrationErr), closeErr)
	}
	if closeErr != nil {
		return fmt.Errorf("database: closing migration runner: %w", closeErr)
	}
	return nil
}

// Open establishes and verifies a bounded PostgreSQL connection pool.
func Open(
	ctx context.Context,
	databaseURL string,
	maxConns int32,
	maxLifetime time.Duration,
) (*pgxpool.Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("database: parsing connection string: %w", err)
	}

	poolConfig.MaxConns = maxConns
	poolConfig.MinConns = 1
	poolConfig.MaxConnLifetime = maxLifetime
	poolConfig.MaxConnIdleTime = time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("database: creating pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("database: pinging postgres: %w", err)
	}
	return pool, nil
}
