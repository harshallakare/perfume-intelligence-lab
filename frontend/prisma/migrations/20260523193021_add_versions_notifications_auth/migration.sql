/*
  Warnings:

  - Added the required column `order_number` to the `production_orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "formula_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formula_id" TEXT NOT NULL,
    "version_num" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "change_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "formula_versions_formula_id_fkey" FOREIGN KEY ("formula_id") REFERENCES "formulas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "name" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_formulas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internal_code" TEXT,
    "concentration_type" TEXT NOT NULL DEFAULT 'edp',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "olfactory_family" TEXT,
    "gender_target" TEXT,
    "description" TEXT,
    "perfumer_notes" TEXT,
    "total_fragrance_pct" REAL,
    "cost_per_ml" REAL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_ifra_compliant" BOOLEAN,
    "locked_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "formulas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_formulas" ("concentration_type", "created_at", "description", "gender_target", "id", "internal_code", "locked_at", "name", "olfactory_family", "organization_id", "perfumer_notes", "status", "total_fragrance_pct", "updated_at") SELECT "concentration_type", "created_at", "description", "gender_target", "id", "internal_code", "locked_at", "name", "olfactory_family", "organization_id", "perfumer_notes", "status", "total_fragrance_pct", "updated_at" FROM "formulas";
DROP TABLE "formulas";
ALTER TABLE "new_formulas" RENAME TO "formulas";
CREATE UNIQUE INDEX "formulas_organization_id_name_key" ON "formulas"("organization_id", "name");
CREATE TABLE "new_production_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "formula_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "requested_bottles" INTEGER NOT NULL DEFAULT 0,
    "bottle_size_ml" INTEGER NOT NULL DEFAULT 50,
    "planned_qty_ml" REAL NOT NULL,
    "actual_qty_ml" REAL,
    "scheduled_start" DATETIME,
    "maceration_ends_at" DATETIME,
    "completed_at" DATETIME,
    "assigned_to" TEXT,
    "qc_result" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "production_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "production_orders_formula_id_fkey" FOREIGN KEY ("formula_id") REFERENCES "formulas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_production_orders" ("actual_qty_ml", "batch_number", "completed_at", "created_at", "formula_id", "id", "notes", "organization_id", "planned_qty_ml", "scheduled_start", "status", "updated_at") SELECT "actual_qty_ml", "batch_number", "completed_at", "created_at", "formula_id", "id", "notes", "organization_id", "planned_qty_ml", "scheduled_start", "status", "updated_at" FROM "production_orders";
DROP TABLE "production_orders";
ALTER TABLE "new_production_orders" RENAME TO "production_orders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");
