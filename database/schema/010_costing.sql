-- =============================================================================
-- Migration 010: Costing Engine
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Formula Costing Profiles
-- Snapshot of cost calculation for a formula at a given batch size
-- ---------------------------------------------------------------------------
CREATE TABLE formula_costing_profiles (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    formula_id              UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    formula_version_id      UUID REFERENCES formula_versions(id) ON DELETE SET NULL,
    batch_size_ml           NUMERIC(10,2) NOT NULL,
    currency                CHAR(3) NOT NULL DEFAULT 'USD',

    -- Raw material costs
    fragrance_cost_total    NUMERIC(12,4),
    fragrance_cost_per_ml   NUMERIC(10,6),
    alcohol_cost_total      NUMERIC(12,4),
    alcohol_cost_per_ml     NUMERIC(10,6),
    fixative_cost_total     NUMERIC(12,4),
    other_materials_cost    NUMERIC(12,4),

    -- Total production cost
    raw_materials_cost      NUMERIC(12,4),
    packaging_cost          NUMERIC(12,4),
    labour_cost_per_unit    NUMERIC(10,4),
    overhead_cost_per_unit  NUMERIC(10,4),
    total_cost_per_unit     NUMERIC(12,4),
    total_cost_per_ml       NUMERIC(10,6),

    -- Ingredient breakdown
    ingredient_costs        JSONB NOT NULL DEFAULT '[]',  -- [{material_id, name, amount_g, unit_cost, total_cost}]

    -- Pricing tiers
    wholesale_price_per_unit NUMERIC(10,4),
    retail_price_per_unit   NUMERIC(10,4),
    luxury_price_per_unit   NUMERIC(10,4),
    wholesale_margin_pct    NUMERIC(6,2),
    retail_margin_pct       NUMERIC(6,2),

    calculated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calculated_by           UUID REFERENCES users(id)
);

-- ---------------------------------------------------------------------------
-- Pricing Rules (per org, for margin calculation)
-- ---------------------------------------------------------------------------
CREATE TABLE pricing_rules (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tier                    pricing_tier_enum NOT NULL,
    multiplier              NUMERIC(6,3) NOT NULL DEFAULT 2.0,   -- cost × multiplier
    fixed_overhead_per_unit NUMERIC(10,4) NOT NULL DEFAULT 0,
    currency                CHAR(3) NOT NULL DEFAULT 'USD',
    notes                   TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, tier)
);

-- ---------------------------------------------------------------------------
-- Labour & Overhead Rates
-- ---------------------------------------------------------------------------
CREATE TABLE overhead_rates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rate_name               VARCHAR(100) NOT NULL,
    rate_type               VARCHAR(50) NOT NULL,   -- 'per_litre', 'per_batch', 'per_hour', 'fixed_monthly'
    rate_value              NUMERIC(10,4) NOT NULL,
    currency                CHAR(3) NOT NULL DEFAULT 'USD',
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, rate_name)
);
