#!/usr/bin/env bash
# Run all schema migrations in order against a target database.
# Usage: DATABASE_URL=postgres://user:pass@host/db ./run_migrations.sh

set -euo pipefail

DB_URL="${DATABASE_URL:-postgres://pil_user:pil_password@localhost:5432/pil_db}"
SCHEMA_DIR="$(dirname "$0")/schema"
SEED_DIR="$(dirname "$0")/seeds"

echo "Running migrations against: $DB_URL"

for file in "$SCHEMA_DIR"/*.sql; do
    echo "  → Applying: $(basename "$file")"
    psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file"
done

if [[ "${SEED:-false}" == "true" ]]; then
    echo "Running seeds..."
    for file in "$SEED_DIR"/*.sql; do
        echo "  → Seeding: $(basename "$file")"
        psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file"
    done
fi

echo "Done."
