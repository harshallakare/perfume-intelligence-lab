-- =============================================================================
-- Migration 003: Inventory Management
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------
CREATE TABLE suppliers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50),
    contact_name        VARCHAR(255),
    email               VARCHAR(320),
    phone               VARCHAR(50),
    address             JSONB,
    country             VARCHAR(100),
    currency            CHAR(3) NOT NULL DEFAULT 'USD',
    payment_terms       VARCHAR(100),
    lead_time_days      INTEGER,
    notes               TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

-- ---------------------------------------------------------------------------
-- Raw Materials (Aroma Chemicals, EOs, Absolutes, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE raw_materials (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                    VARCHAR(255) NOT NULL,
    iupac_name              VARCHAR(500),
    cas_number              VARCHAR(20),
    einecs_number           VARCHAR(20),
    material_type           material_type_enum NOT NULL,
    odor_family             odor_family_enum,
    odor_description        TEXT,
    odor_intensity          SMALLINT CHECK (odor_intensity BETWEEN 1 AND 10),

    -- Olfactory properties
    volatility_class        CHAR(1) CHECK (volatility_class IN ('T','M','B')),  -- Top/Mid/Base
    diffusion_strength      SMALLINT CHECK (diffusion_strength BETWEEN 1 AND 10),
    fixative_strength       SMALLINT CHECK (fixative_strength BETWEEN 1 AND 10),
    longevity_hours         NUMERIC(5,1),
    boiling_point_c         NUMERIC(7,2),
    flash_point_c           NUMERIC(7,2),
    log_p                   NUMERIC(5,2),   -- octanol-water partition coefficient

    -- Sourcing
    primary_supplier_id     UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    origin_country          VARCHAR(100),
    extraction_method       VARCHAR(100),   -- steam distillation, solvent, CO2, synthetic

    -- Quality & Safety
    purity_percentage       NUMERIC(5,2),
    refractive_index        NUMERIC(7,5),
    specific_gravity        NUMERIC(6,4),
    is_natural              BOOLEAN NOT NULL DEFAULT FALSE,
    is_allergen             BOOLEAN NOT NULL DEFAULT FALSE,
    is_restricted           BOOLEAN NOT NULL DEFAULT FALSE,
    sds_url                 TEXT,
    ifra_restricted         BOOLEAN NOT NULL DEFAULT FALSE,
    reach_registered        BOOLEAN NOT NULL DEFAULT FALSE,

    -- Stock
    unit_of_measure         VARCHAR(20) NOT NULL DEFAULT 'g',   -- g, kg, ml, L
    current_stock           NUMERIC(12,3) NOT NULL DEFAULT 0,
    minimum_stock           NUMERIC(12,3) NOT NULL DEFAULT 0,
    reorder_quantity        NUMERIC(12,3),
    cost_per_unit           NUMERIC(10,4) NOT NULL DEFAULT 0,   -- in org currency
    currency                CHAR(3) NOT NULL DEFAULT 'USD',

    -- Storage
    storage_conditions      VARCHAR(255),
    storage_temp_min_c      NUMERIC(5,1),
    storage_temp_max_c      NUMERIC(5,1),
    storage_location        VARCHAR(100),

    -- Metadata
    color                   VARCHAR(50),
    appearance              VARCHAR(100),
    solubility              VARCHAR(255),
    notes                   TEXT,
    tags                    TEXT[],
    extra_data              JSONB NOT NULL DEFAULT '{}',

    created_by              UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

-- ---------------------------------------------------------------------------
-- Material Safety & Regulatory Details
-- ---------------------------------------------------------------------------
CREATE TABLE material_allergens (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_material_id     UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    allergen_name       VARCHAR(255) NOT NULL,
    eu_list_number      VARCHAR(50),    -- EU Cosmetics Regulation allergen list
    concentration_ppm   NUMERIC(10,4),  -- typical presence level
    must_declare_at_ppm NUMERIC(10,4),  -- EU declaration threshold
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Inventory Batches (Lot / Batch tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_batches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    raw_material_id     UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    batch_number        VARCHAR(100) NOT NULL,
    lot_number          VARCHAR(100),
    purchase_order_ref  VARCHAR(100),
    quantity_received   NUMERIC(12,3) NOT NULL,
    quantity_remaining  NUMERIC(12,3) NOT NULL,
    unit_of_measure     VARCHAR(20) NOT NULL DEFAULT 'g',
    cost_per_unit       NUMERIC(10,4) NOT NULL,
    currency            CHAR(3) NOT NULL DEFAULT 'USD',
    purity_percentage   NUMERIC(5,2),
    coa_url             TEXT,           -- Certificate of Analysis
    received_date       DATE NOT NULL,
    expiry_date         DATE,
    is_quarantine       BOOLEAN NOT NULL DEFAULT FALSE,
    quarantine_reason   TEXT,
    notes               TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, raw_material_id, batch_number)
);

-- ---------------------------------------------------------------------------
-- Inventory Transactions (Stock Ledger — partitioned by month)
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_transactions (
    id                  UUID NOT NULL DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL,
    raw_material_id     UUID NOT NULL,
    batch_id            UUID,
    transaction_type    transaction_type_enum NOT NULL,
    quantity_delta      NUMERIC(12,3) NOT NULL,   -- positive = add, negative = remove
    quantity_before     NUMERIC(12,3) NOT NULL,
    quantity_after      NUMERIC(12,3) NOT NULL,
    unit_of_measure     VARCHAR(20) NOT NULL,
    unit_cost           NUMERIC(10,4),
    total_cost          NUMERIC(12,4),
    reference_type      VARCHAR(100),   -- 'production_batch', 'purchase_order', 'manual'
    reference_id        UUID,
    notes               TEXT,
    performed_by        UUID,           -- user_id
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE inventory_transactions_2026_01 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE inventory_transactions_2026_02 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE inventory_transactions_2026_03 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE inventory_transactions_2026_04 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE inventory_transactions_2026_05 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE inventory_transactions_2026_06 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE inventory_transactions_2026_07 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE inventory_transactions_2026_08 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE inventory_transactions_2026_09 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE inventory_transactions_2026_10 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE inventory_transactions_2026_11 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE inventory_transactions_2026_12 PARTITION OF inventory_transactions
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- ---------------------------------------------------------------------------
-- Packaging Materials
-- ---------------------------------------------------------------------------
CREATE TABLE packaging_materials (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    sku                 VARCHAR(100),
    category            VARCHAR(100) NOT NULL,   -- 'bottle', 'cap', 'box', 'label', 'atomizer', 'crimp'
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    capacity_ml         NUMERIC(8,2),
    material            VARCHAR(100),    -- glass, plastic, metal, paper
    dimensions_mm       JSONB,           -- {width, height, depth, diameter}
    weight_g            NUMERIC(8,2),
    unit_cost           NUMERIC(10,4) NOT NULL DEFAULT 0,
    currency            CHAR(3) NOT NULL DEFAULT 'USD',
    current_stock       INTEGER NOT NULL DEFAULT 0,
    minimum_stock       INTEGER NOT NULL DEFAULT 0,
    reorder_quantity    INTEGER,
    image_url           TEXT,
    notes               TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

-- ---------------------------------------------------------------------------
-- Material Substitutes (alternative molecule map)
-- ---------------------------------------------------------------------------
CREATE TABLE material_substitutes (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_material_id         UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    substitute_material_id  UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    similarity_score        NUMERIC(5,2) CHECK (similarity_score BETWEEN 0 AND 100),
    usage_ratio             NUMERIC(6,4),   -- substitution ratio (1.0 = same amount)
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (raw_material_id, substitute_material_id)
);
