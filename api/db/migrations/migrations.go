package migrations

import "embed"

// FS holds all migration SQL files, compiled into the binary.
//
//go:embed *.sql
var FS embed.FS
