// Package migrations exposes the versioned database schema to the API binary.
package migrations

import "embed"

// Files contains every reversible schema migration.
//
//go:embed schema/*.sql
var Files embed.FS
