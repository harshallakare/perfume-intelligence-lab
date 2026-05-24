-- =============================================================================
-- Migration 005: Formula Builder & Version Control
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Formulas
-- ---------------------------------------------------------------------------
CREATE TABLE formulas (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                    VARCHAR(255) NOT NULL,
    internal_code           VARCHAR(100),   -- internal reference code
    concentration_type      concentration_type_enum NOT NULL DEFAULT 'edp',
    status                  formula_status_enum NOT NULL DEFAULT 'draft',

    -- Fragrance character
    olfactory_family        odor_family_enum,
    gender_target           VARCHAR(20) CHECK (gender_target IN ('masculine','feminine','unisex')),
    season_target           VARCHAR(20) CHECK (season_target IN ('spring','summer','autumn','winter','all')),
    occasion_target         VARCHAR(50),

    -- Performance targets
    projection_target       SMALLINT CHECK (projection_target BETWEEN 1 AND 10),
    longevity_target        SMALLINT CHECK (longevity_target BETWEEN 1 AND 10),
    sillage_target          SMALLINT CHECK (sillage_target BETWEEN 1 AND 10),

    -- Composition overview (summed from ingredients)
    total_fragrance_pct     NUMERIC(7,4),   -- sum of all ingredient percentages
    alcohol_pct             NUMERIC(7,4),
    fixative_pct            NUMERIC(7,4),
    solvent_pct             NUMERIC(7,4),

    -- Inspiration / clone reference
    inspiration_perfume     VARCHAR(255),
    inspiration_brand       VARCHAR(255),
    clone_request_id        UUID,   -- FK added later after clone_requests table

    -- Description
    description             TEXT,
    perfumer_notes          TEXT,
    aging_notes             TEXT,
    recommended_maceration_days INTEGER,

    -- Qdrant embedding reference
    qdrant_vector_id        VARCHAR(100),

    -- Locking
    locked_at               TIMESTAMPTZ,
    locked_by               UUID REFERENCES users(id),

    created_by              UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

-- ---------------------------------------------------------------------------
-- Formula Versions (snapshot on each save)
-- ---------------------------------------------------------------------------
CREATE TABLE formula_versions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_id          UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    version_number      INTEGER NOT NULL,
    version_label       VARCHAR(100),   -- e.g. "v1.2 - added more ISO E Super"
    snapshot            JSONB NOT NULL,  -- full denormalized snapshot of formula at this version
    change_summary      TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (formula_id, version_number)
);

-- ---------------------------------------------------------------------------
-- Formula Ingredients (the actual formula composition)
-- ---------------------------------------------------------------------------
CREATE TABLE formula_ingredients (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_id          UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    raw_material_id     UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    section             formula_section_enum NOT NULL DEFAULT 'middle_note',
    percentage          NUMERIC(8,5) NOT NULL CHECK (percentage > 0),   -- % in fragrance concentrate
    amount_grams        NUMERIC(10,4),   -- calculated for a reference batch size
    dilution_pct        NUMERIC(6,3) NOT NULL DEFAULT 100,  -- if material is pre-diluted
    effective_pct       NUMERIC(8,5) GENERATED ALWAYS AS (percentage * dilution_pct / 100) STORED,
    is_optional         BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    perfumer_notes      TEXT,
    UNIQUE (formula_id, raw_material_id)
);

-- ---------------------------------------------------------------------------
-- Formula Accords (accords embedded in formula)
-- ---------------------------------------------------------------------------
CREATE TABLE formula_accords (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_id          UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    accord_id           UUID NOT NULL REFERENCES accords(id) ON DELETE RESTRICT,
    usage_percentage    NUMERIC(7,4) NOT NULL CHECK (usage_percentage > 0),
    notes               TEXT,
    UNIQUE (formula_id, accord_id)
);

-- ---------------------------------------------------------------------------
-- Formula Batch Calculations
-- Stores calculated amounts for specific batch sizes without duplicating formula
-- ---------------------------------------------------------------------------
CREATE TABLE formula_batch_calculations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_id          UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    batch_size_ml       NUMERIC(10,2) NOT NULL,
    alcohol_ml          NUMERIC(10,3),
    fixative_ml         NUMERIC(10,3),
    concentrate_ml      NUMERIC(10,3),
    ingredient_amounts  JSONB NOT NULL,   -- [{material_id, grams, ml}]
    total_cost          NUMERIC(12,4),
    cost_per_ml         NUMERIC(10,6),
    calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calculated_by       UUID REFERENCES users(id)
);

-- ---------------------------------------------------------------------------
-- Formula Tags
-- ---------------------------------------------------------------------------
CREATE TABLE formula_tags (
    formula_id          UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    tag                 VARCHAR(100) NOT NULL,
    PRIMARY KEY (formula_id, tag)
);

-- ---------------------------------------------------------------------------
-- Formula Reviews / Ratings (internal quality tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE formula_reviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_id          UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    reviewer_id         UUID NOT NULL REFERENCES users(id),
    overall_score       SMALLINT CHECK (overall_score BETWEEN 1 AND 10),
    projection_score    SMALLINT CHECK (projection_score BETWEEN 1 AND 10),
    longevity_score     SMALLINT CHECK (longevity_score BETWEEN 1 AND 10),
    sillage_score       SMALLINT CHECK (sillage_score BETWEEN 1 AND 10),
    balance_score       SMALLINT CHECK (balance_score BETWEEN 1 AND 10),
    review_notes        TEXT,
    reviewed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
