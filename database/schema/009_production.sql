-- =============================================================================
-- Migration 009: Production Management
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Production Orders
-- ---------------------------------------------------------------------------
CREATE TABLE production_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_number        VARCHAR(50) NOT NULL,
    formula_id          UUID NOT NULL REFERENCES formulas(id) ON DELETE RESTRICT,
    formula_version_id  UUID NOT NULL REFERENCES formula_versions(id) ON DELETE RESTRICT,

    -- Requested quantities
    requested_bottles   INTEGER NOT NULL,
    bottle_size_ml      NUMERIC(8,2) NOT NULL,
    total_volume_ml     NUMERIC(12,2) GENERATED ALWAYS AS (requested_bottles * bottle_size_ml) STORED,

    -- Packaging
    packaging_material_id UUID REFERENCES packaging_materials(id) ON DELETE SET NULL,

    -- Scheduling
    status              production_status_enum NOT NULL DEFAULT 'draft',
    priority            SMALLINT NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    planned_start_date  DATE,
    planned_end_date    DATE,
    actual_start_date   DATE,
    actual_end_date     DATE,

    -- Maceration
    maceration_days_required INTEGER,
    maceration_started_at    TIMESTAMPTZ,
    maceration_ends_at       TIMESTAMPTZ,

    -- Assignment
    assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
    requested_by        UUID REFERENCES users(id),

    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, order_number)
);

-- ---------------------------------------------------------------------------
-- Production Batches (actual manufacturing runs)
-- An order may have multiple batches (e.g. split runs, reruns after QC failure)
-- ---------------------------------------------------------------------------
CREATE TABLE production_batches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE RESTRICT,
    batch_number        VARCHAR(50) NOT NULL,
    batch_size_ml       NUMERIC(12,2) NOT NULL,

    -- Status
    status              production_status_enum NOT NULL DEFAULT 'scheduled',

    -- Timing
    mixing_started_at   TIMESTAMPTZ,
    mixing_completed_at TIMESTAMPTZ,
    maceration_started_at TIMESTAMPTZ,
    maceration_ends_at  TIMESTAMPTZ,
    bottling_started_at TIMESTAMPTZ,
    bottling_completed_at TIMESTAMPTZ,

    -- Output
    bottles_produced    INTEGER,
    yield_ml            NUMERIC(10,2),   -- actual yield (may differ from plan due to waste)
    waste_ml            NUMERIC(10,2),

    -- QR / Barcode
    barcode             VARCHAR(100) UNIQUE,
    qr_code_data        TEXT,

    -- Locking
    formula_locked_at   TIMESTAMPTZ,   -- formula is immutably referenced once batch starts

    performed_by        UUID REFERENCES users(id),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, batch_number)
);

-- ---------------------------------------------------------------------------
-- Production Batch Ingredient Consumption
-- Records what was actually deducted from inventory for this batch
-- ---------------------------------------------------------------------------
CREATE TABLE production_batch_ingredients (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_batch_id     UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    raw_material_id         UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    inventory_batch_id      UUID REFERENCES inventory_batches(id) ON DELETE SET NULL,
    planned_amount          NUMERIC(12,4) NOT NULL,
    actual_amount           NUMERIC(12,4),
    unit_of_measure         VARCHAR(20) NOT NULL DEFAULT 'g',
    unit_cost               NUMERIC(10,4),
    total_cost              NUMERIC(12,4),
    notes                   TEXT,
    UNIQUE (production_batch_id, raw_material_id, inventory_batch_id)
);

-- ---------------------------------------------------------------------------
-- Maceration Records (detailed tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE maceration_records (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_batch_id     UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    temperature_c           NUMERIC(5,1),
    humidity_pct            NUMERIC(5,1),
    container_type          VARCHAR(100),
    container_id            VARCHAR(100),
    started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    target_end_at           TIMESTAMPTZ,
    actual_end_at           TIMESTAMPTZ,
    shake_log               JSONB,    -- [{timestamp, performed_by, notes}]
    smell_assessment_log    JSONB,    -- [{timestamp, assessor, notes, score}]
    notes                   TEXT
);

-- ---------------------------------------------------------------------------
-- Quality Control Logs
-- ---------------------------------------------------------------------------
CREATE TABLE qc_logs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_batch_id     UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    checkpoint_name         VARCHAR(100) NOT NULL,   -- 'pre-mix', 'post-mix', 'post-maceration', 'final'
    result                  qc_result_enum NOT NULL DEFAULT 'pending',

    -- Sensory evaluation
    odor_assessment         TEXT,
    color_assessment        TEXT,
    clarity_assessment      TEXT,
    viscosity_assessment    TEXT,

    -- Lab measurements
    specific_gravity        NUMERIC(6,4),
    refractive_index        NUMERIC(7,5),
    alcohol_pct_measured    NUMERIC(5,2),
    ph_measured             NUMERIC(4,2),

    -- Compliance snapshot
    ifra_compliance_status  BOOLEAN,

    -- Approval
    checked_by              UUID NOT NULL REFERENCES users(id),
    checked_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by             UUID REFERENCES users(id),
    approved_at             TIMESTAMPTZ,
    rejection_reason        TEXT,
    corrective_action       TEXT,
    notes                   TEXT,
    attachments             JSONB   -- [{filename, url, type}]
);

-- ---------------------------------------------------------------------------
-- Production Order — Packaging Consumption
-- ---------------------------------------------------------------------------
CREATE TABLE production_packaging_consumption (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_batch_id     UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    packaging_material_id   UUID NOT NULL REFERENCES packaging_materials(id) ON DELETE RESTRICT,
    quantity_used           INTEGER NOT NULL,
    quantity_wasted         INTEGER NOT NULL DEFAULT 0,
    notes                   TEXT,
    UNIQUE (production_batch_id, packaging_material_id)
);
