package main

import (
	"flag"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/foxxpratiksau/roleproof/backend/internal/database"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	direction := flag.String("direction", "up", "migration direction: up or down")
	steps := flag.Int("steps", 1, "number of versions to roll back when direction is down")
	flag.Parse()

	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		logger.Error("migration failed", "error", "database_url is required")
		os.Exit(1)
	}

	var err error
	switch *direction {
	case "up":
		err = database.Migrate(databaseURL)
	case "down":
		err = database.MigrateDown(databaseURL, *steps)
	default:
		err = fmt.Errorf("unsupported direction %q", *direction)
	}
	if err != nil {
		logger.Error("migration failed", "error", err)
		os.Exit(1)
	}
	logger.Info("migration completed", "direction", *direction, "steps", *steps)
}
