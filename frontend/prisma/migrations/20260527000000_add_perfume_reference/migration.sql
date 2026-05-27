-- CreateTable
CREATE TABLE "perfume_references" (
    "id"               TEXT     NOT NULL PRIMARY KEY,
    "name"             TEXT     NOT NULL,
    "brand"            TEXT     NOT NULL,
    "perfumer"         TEXT,
    "year"             INTEGER,
    "concentration"    TEXT,
    "category"         TEXT     NOT NULL DEFAULT 'designer',
    "olfactory_family" TEXT,
    "gender_target"    TEXT,
    "top_notes"        TEXT     NOT NULL DEFAULT '[]',
    "middle_notes"     TEXT     NOT NULL DEFAULT '[]',
    "base_notes"       TEXT     NOT NULL DEFAULT '[]',
    "projection"       REAL,
    "longevity_hrs"    REAL,
    "season"           TEXT,
    "occasion"         TEXT,
    "price_tier"       TEXT,
    "description"      TEXT,
    "community_score"  REAL,
    "created_at"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
