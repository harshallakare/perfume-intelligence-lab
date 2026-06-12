-- Extend finished_goods into sellable products with pricing + yield tracking
ALTER TABLE "finished_goods" ADD COLUMN "planned_bottles" INTEGER;
ALTER TABLE "finished_goods" ADD COLUMN "bottles_sold" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "finished_goods" ADD COLUMN "material_cost" REAL;
ALTER TABLE "finished_goods" ADD COLUMN "packaging_cost" REAL;
ALTER TABLE "finished_goods" ADD COLUMN "labor_cost" REAL;
ALTER TABLE "finished_goods" ADD COLUMN "sell_price" REAL;
ALTER TABLE "finished_goods" ADD COLUMN "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Customers
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'retail',
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "gstin" TEXT,
    "address" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Orders
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "order_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "channel" TEXT NOT NULL DEFAULT 'direct',
    "order_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "discount_amount" REAL NOT NULL DEFAULT 0,
    "tax_pct" REAL NOT NULL DEFAULT 0,
    "tax_amount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "cogs" REAL NOT NULL DEFAULT 0,
    "amount_paid" REAL NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL DEFAULT 'unpaid',
    "stock_applied" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Order line items
CREATE TABLE "order_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "finished_good_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" REAL NOT NULL DEFAULT 0,
    "unit_cost" REAL NOT NULL DEFAULT 0,
    "line_total" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_lines_finished_good_id_fkey" FOREIGN KEY ("finished_good_id") REFERENCES "finished_goods" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
