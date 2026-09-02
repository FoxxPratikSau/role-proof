// Package config loads and validates process configuration from the environment.
package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultAddress         = ":8080"
	defaultAllowedOrigin   = "http://localhost:3000"
	defaultAccessTokenTTL  = 15 * time.Minute
	defaultShutdownTimeout = 10 * time.Second
	defaultDatabaseTimeout = 10 * time.Second
	defaultBcryptCost      = 12
	minimumJWTSecretLength = 32
)

// Config contains all runtime settings required by the API.
type Config struct {
	Address          string
	AllowedOrigin    string
	DatabaseURL      string
	JWTSecret        string
	AccessTokenTTL   time.Duration
	ShutdownTimeout  time.Duration
	DatabaseTimeout  time.Duration
	BcryptCost       int
	DatabaseMaxConns int32
}

// Load reads configuration from environment variables and rejects unsafe values.
func Load() (Config, error) {
	cfg := Config{
		Address:          valueOrDefault("API_ADDRESS", defaultAddress),
		AllowedOrigin:    valueOrDefault("ALLOWED_ORIGIN", defaultAllowedOrigin),
		DatabaseURL:      strings.TrimSpace(os.Getenv("DATABASE_URL")),
		JWTSecret:        os.Getenv("JWT_SECRET"),
		AccessTokenTTL:   defaultAccessTokenTTL,
		ShutdownTimeout:  defaultShutdownTimeout,
		DatabaseTimeout:  defaultDatabaseTimeout,
		BcryptCost:       defaultBcryptCost,
		DatabaseMaxConns: 10,
	}

	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("config: database_url is required")
	}
	if len(cfg.JWTSecret) < minimumJWTSecretLength {
		return Config{}, fmt.Errorf(
			"config: jwt_secret must contain at least %d bytes",
			minimumJWTSecretLength,
		)
	}

	var err error
	cfg.AccessTokenTTL, err = durationFromEnv("ACCESS_TOKEN_TTL", cfg.AccessTokenTTL)
	if err != nil {
		return Config{}, err
	}
	cfg.ShutdownTimeout, err = durationFromEnv("SHUTDOWN_TIMEOUT", cfg.ShutdownTimeout)
	if err != nil {
		return Config{}, err
	}
	cfg.DatabaseTimeout, err = durationFromEnv("DATABASE_TIMEOUT", cfg.DatabaseTimeout)
	if err != nil {
		return Config{}, err
	}
	cfg.DatabaseMaxConns, err = int32FromEnv("DATABASE_MAX_CONNS", cfg.DatabaseMaxConns)
	if err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func valueOrDefault(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func durationFromEnv(key string, fallback time.Duration) (time.Duration, error) {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback, nil
	}

	value, err := time.ParseDuration(raw)
	if err != nil {
		return 0, fmt.Errorf("config: parsing %s: %w", strings.ToLower(key), err)
	}
	if value <= 0 {
		return 0, fmt.Errorf("config: %s must be positive", strings.ToLower(key))
	}
	return value, nil
}

func int32FromEnv(key string, fallback int32) (int32, error) {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback, nil
	}

	value, err := strconv.ParseInt(raw, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("config: parsing %s: %w", strings.ToLower(key), err)
	}
	if value <= 0 {
		return 0, fmt.Errorf("config: %s must be positive", strings.ToLower(key))
	}
	return int32(value), nil
}
