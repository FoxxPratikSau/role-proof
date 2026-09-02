package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/foxxpratiksau/roleproof/backend/internal/auth"
	"github.com/foxxpratiksau/roleproof/backend/internal/config"
	"github.com/foxxpratiksau/roleproof/backend/internal/database"
	"github.com/foxxpratiksau/roleproof/backend/internal/httpapi"
	"github.com/foxxpratiksau/roleproof/backend/internal/postgres"
	resumedomain "github.com/foxxpratiksau/roleproof/backend/internal/resume"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	ctx, stop := signal.NotifyContext(
		context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
	)
	defer stop()

	if err := run(ctx, logger); err != nil {
		logger.Error("api stopped", "error", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, logger *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	if err := database.Migrate(cfg.DatabaseURL); err != nil {
		return err
	}

	databaseCtx, cancelDatabase := context.WithTimeout(ctx, cfg.DatabaseTimeout)
	defer cancelDatabase()
	pool, err := database.Open(
		databaseCtx,
		cfg.DatabaseURL,
		cfg.DatabaseMaxConns,
		30*time.Minute,
	)
	if err != nil {
		return err
	}
	defer pool.Close()

	tokens := auth.NewTokenManager(cfg.JWTSecret, cfg.AccessTokenTTL)
	userStore := postgres.NewUserStore(pool)
	authService := auth.NewService(userStore, tokens, cfg.BcryptCost)
	resumeStore := postgres.NewResumeStore(pool)
	resumeService := resumedomain.NewService(resumeStore, resumeStore)
	api := httpapi.New(httpapi.Dependencies{
		Auth:          authService,
		Tokens:        tokens,
		Resumes:       resumeService,
		Database:      pool,
		Logger:        logger,
		AllowedOrigin: cfg.AllowedOrigin,
	})
	server := &http.Server{
		Addr:              cfg.Address,
		Handler:           api,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       time.Minute,
		MaxHeaderBytes:    1 << 20,
	}

	serverErr := make(chan error, 1)
	go func() {
		logger.Info("api listening", "address", cfg.Address)
		serverErr <- server.ListenAndServe()
	}()

	select {
	case err := <-serverErr:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return fmt.Errorf("api: serving http: %w", err)
	case <-ctx.Done():
		logger.Info("api shutdown started")
	}

	shutdownCtx, cancelShutdown := context.WithTimeout(
		context.WithoutCancel(ctx),
		cfg.ShutdownTimeout,
	)
	defer cancelShutdown()
	if err := server.Shutdown(shutdownCtx); err != nil {
		if closeErr := server.Close(); closeErr != nil {
			return errors.Join(
				fmt.Errorf("api: graceful shutdown: %w", err),
				fmt.Errorf("api: forced shutdown: %w", closeErr),
			)
		}
		return fmt.Errorf("api: graceful shutdown: %w", err)
	}

	if err := <-serverErr; err != nil && !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("api: stopping http server: %w", err)
	}
	logger.Info("api shutdown completed")
	return nil
}
