-- =============================================================================
-- Migration 008: IFRA Compliance
-- =============================================================================

-- ---------------------------------------------------------------------------
-- IFRA Amendments (version history of IFRA standards)
-- ---------------------------------------------------------------------------
CREATE TABLE ifra_amendments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amendment_number    SMALLINT NOT NULL UNIQUE,   -- 49, 50, 51...
    published_date      DATE NOT NULL,
    effective_date      DATE NOT NULL,
    notes               TEXT,
    is_current          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- IFRA Material Restrictions
-- One row per material × category × amendment
-- ---------------------------------------------------------------------------
CREATE TABLE ifra_restrictions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ifra_amendment_id   UUID NOT NULL REFERENCES ifra_amendments(id) ON DELETE CASCADE,
    raw_material_id     UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
    cas_number          VARCHAR(20),       -- kept separately for lookup even if material not in DB
    material_name       VARCHAR(255) NOT NULL,
    category            ifra_category_enum NOT NULL,
    restriction_type    VARCHAR(30) NOT NULL CHECK (restriction_type IN ('max_limit','prohibited','qra_required','skin_sensitizer')),
    max_limit_pct       NUMERIC(8,5),      -- maximum % in finished product (NULL if prohibited)
    qra_threshold_pct   NUMERIC(8,5),      -- QRA required above this concentration
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ifra_amendment_id, COALESCE(cas_number,''), category)
);

-- ---------------------------------------------------------------------------
-- Compliance Checks (run against a formula)
-- ---------------------------------------------------------------------------
CREATE TABLE compliance_checks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    formula_id          UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    formula_version_id  UUID REFERENCES formula_versions(id) ON DELETE SET NULL,
    ifra_amendment_id   UUID NOT NULL REFERENCES ifra_amendments(id),
    ifra_category       ifra_category_enum NOT NULL,

    -- Overall result
    is_compliant        BOOLEAN,        -- NULL = check pending, TRUE = pass, FALSE = fail
    checked_at          TIMESTAMPTZ,
    checked_by          UUID REFERENCES users(id),  -- NULL = auto-check

    notes               TEXT,
    report_url          TEXT,           -- generated PDF report location
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Compliance Check Items (per-material result within a check)
-- ---------------------------------------------------------------------------
CREATE TABLE compliance_check_items (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compliance_check_id     UUID NOT NULL REFERENCES compliance_checks(id) ON DELETE CASCADE,
    raw_material_id         UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    ifra_restriction_id     UUID REFERENCES ifra_restrictions(id) ON DELETE SET NULL,

    -- Material usage in formula
    formula_usage_pct       NUMERIC(8,5) NOT NULL,
    formula_usage_in_product_pct NUMERIC(8,5) NOT NULL,   -- accounting for dilution

    -- Limit
    allowed_limit_pct       NUMERIC(8,5),
    is_compliant            BOOLEAN NOT NULL,
    excess_pct              NUMERIC(8,5),   -- how much over the limit (NULL if compliant)

    restriction_type        VARCHAR(30),
    recommendation          TEXT,          -- e.g. "Reduce to max 0.5% or apply QRA"
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- EU Allergen Declaration Checks
-- ---------------------------------------------------------------------------
CREATE TABLE allergen_declarations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    formula_id              UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    product_type            VARCHAR(50),    -- 'rinse_off', 'leave_on'
    declared_allergens      JSONB NOT NULL,  -- [{name, cas, concentration_ppm, must_declare}]
    generated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by            UUID REFERENCES users(id)
);
