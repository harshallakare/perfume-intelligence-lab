-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'pro',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cas_number" TEXT,
    "material_type" TEXT NOT NULL,
    "odor_family" TEXT,
    "odor_description" TEXT,
    "odor_intensity" INTEGER,
    "volatility_class" TEXT,
    "purity_percentage" REAL,
    "primary_supplier_id" TEXT,
    "supplier_name" TEXT,
    "is_natural" BOOLEAN NOT NULL DEFAULT false,
    "is_allergen" BOOLEAN NOT NULL DEFAULT false,
    "is_restricted" BOOLEAN NOT NULL DEFAULT false,
    "ifra_restricted" BOOLEAN NOT NULL DEFAULT false,
    "unit_of_measure" TEXT NOT NULL DEFAULT 'g',
    "current_stock" REAL NOT NULL DEFAULT 0,
    "minimum_stock" REAL NOT NULL DEFAULT 0,
    "cost_per_unit" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "storage_conditions" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "raw_materials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "formulas" (
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
    "locked_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "formulas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "formula_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formula_id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'middle_note',
    "percentage" REAL NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "perfumer_notes" TEXT,
    CONSTRAINT "formula_ingredients_formula_id_fkey" FOREIGN KEY ("formula_id") REFERENCES "formulas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "formula_ingredients_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "formula_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "planned_qty_ml" REAL NOT NULL,
    "actual_qty_ml" REAL,
    "scheduled_start" DATETIME,
    "completed_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "production_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "production_orders_formula_id_fkey" FOREIGN KEY ("formula_id") REFERENCES "formulas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "raw_materials_organization_id_name_key" ON "raw_materials"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "formulas_organization_id_name_key" ON "formulas"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "formula_ingredients_formula_id_raw_material_id_key" ON "formula_ingredients"("formula_id", "raw_material_id");
