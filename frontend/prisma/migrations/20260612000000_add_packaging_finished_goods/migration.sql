-- Add density to raw_materials (g per mL — bridges weight & volume pricing)
ALTER TABLE "raw_materials" ADD COLUMN "density" REAL;

-- Non-consumable packaging / supplies inventory
CREATE TABLE "packaging_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "capacity_ml" REAL,
    "unit_price" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER NOT NULL DEFAULT 0,
    "supplier_name" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "packaging_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "packaging_items_organization_id_name_key" ON "packaging_items"("organization_id", "name");

-- Finished goods produced & committed to stock from the Clone Engine
CREATE TABLE "finished_goods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "perfume_type" TEXT NOT NULL,
    "batch_volume_ml" REAL NOT NULL,
    "bottle_size_ml" REAL NOT NULL,
    "bottles_filled" INTEGER NOT NULL,
    "bottles_used" INTEGER NOT NULL DEFAULT 0,
    "leftover_ml" REAL NOT NULL DEFAULT 0,
    "oil_ml" REAL NOT NULL DEFAULT 0,
    "alcohol_ml" REAL NOT NULL DEFAULT 0,
    "fixative_ml" REAL NOT NULL DEFAULT 0,
    "unit_cost" REAL,
    "batch_cost" REAL,
    "packaging_id" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finished_goods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
