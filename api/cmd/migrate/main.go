package main

import (
	"database/sql"
	"fmt"
	"log/slog"
	"os"

	"github.com/EvannDev/contribto/db/migrations"
	"github.com/pressly/goose/v3"
	_ "modernc.org/sqlite"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./app.db"
	}

	db, err := openDB(dbPath)
	if err != nil {
		slog.Error("open db", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	goose.SetBaseFS(migrations.FS)
	if err := goose.SetDialect("sqlite3"); err != nil {
		slog.Error("set goose dialect", "err", err)
		os.Exit(1)
	}

	const dir = "."

	switch os.Args[1] {
	case "up":
		err = goose.Up(db, dir)
	case "down":
		err = goose.Down(db, dir)
	case "status":
		err = goose.Status(db, dir)
	case "create":
		if len(os.Args) < 3 {
			fmt.Fprintln(os.Stderr, "usage: migrate create <name>")
			os.Exit(1)
		}
		// create writes to disk — run from api/ directory
		err = goose.Create(nil, "db/migrations", os.Args[2], "sql")
	default:
		fmt.Fprintf(os.Stderr, "unknown command: %s\n", os.Args[1])
		printUsage()
		os.Exit(1)
	}

	if err != nil {
		slog.Error("migration error", "cmd", os.Args[1], "err", err)
		os.Exit(1)
	}
}

func openDB(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	db.SetMaxOpenConns(1)

	pragmas := []string{
		"PRAGMA journal_mode = WAL;",
		"PRAGMA synchronous = NORMAL;",
		"PRAGMA busy_timeout = 5000;",
		"PRAGMA foreign_keys = ON;",
	}
	for _, p := range pragmas {
		if _, err := db.Exec(p); err != nil {
			db.Close()
			return nil, fmt.Errorf("apply pragma %q: %w", p, err)
		}
	}
	return db, nil
}

func printUsage() {
	fmt.Fprintln(os.Stderr, "usage: migrate <command> [args]")
	fmt.Fprintln(os.Stderr, "commands: up, down, status, create <name>")
}
