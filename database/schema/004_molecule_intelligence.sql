-- =============================================================================
-- Migration 004: Molecule Intelligence & Olfactory Data
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Molecule Profiles (enriched olfactory data beyond raw_materials)
-- Each raw_material can have one profile entry
-- ---------------------------------------------------------------------------
CREATE TABLE molecule_profiles (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_material_id         UUID NOT NULL UNIQUE REFERENCES raw_materials(id) ON DELETE CASCADE,

    -- Olfactory character
    odor_descriptors        TEXT[],     -- ['rose', 'powdery', 'waxy', 'green']
    odor_strength_threshold NUMERIC(8,4),  -- detection threshold in ppm
    odor_character_at_low   TEXT,       -- character changes at trace levels
    odor_character_at_high  TEXT,       -- character changes at high usage

    -- Volatility curve (evaporation % over time)
    volatility_curve        JSONB,      -- [{time_min: 0, pct: 100}, {time_min: 30, pct: 60}, ...]
    half_life_hours         NUMERIC(6,2),

    -- Performance in finished perfume
    typical_usage_pct_min   NUMERIC(5,3),
    typical_usage_pct_max   NUMERIC(5,3),
    max_safe_usage_pct      NUMERIC(5,3),
    substantivity           SMALLINT CHECK (substantivity BETWEEN 1 AND 10),   -- skin affinity
    radiance                SMALLINT CHECK (radiance BETWEEN 1 AND 10),        -- projection
    tenacity                SMALLINT CHECK (tenacity BETWEEN 1 AND 10),        -- longevity

    -- Blending behavior
    blending_notes          TEXT,
    known_interactions      JSONB,   -- [{material_id, effect: 'enhances'|'clashes'|'rounds'}]

    -- Reference perfumes (where this material is known to appear)
    appears_in_perfumes     TEXT[],  -- ['Chanel No. 5', 'Dior Sauvage']

    -- Embedding (stored separately in Qdrant, but we keep the Qdrant ID here)
    qdrant_vector_id        VARCHAR(100),

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Molecule Synergies
-- Bidirectional table: if A synergizes with B, one row covers both directions
-- ---------------------------------------------------------------------------
CREATE TABLE molecule_synergies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_a_id       UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    material_b_id       UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    synergy_type        VARCHAR(50) NOT NULL,   -- 'enhances', 'rounds', 'boosts_longevity', 'boosts_projection'
    strength            SMALLINT CHECK (strength BETWEEN 1 AND 5),  -- 1=mild, 5=strong
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (material_a_id, material_b_id)
);

-- ---------------------------------------------------------------------------
-- Molecule Conflicts (combinations to avoid)
-- ---------------------------------------------------------------------------
CREATE TABLE molecule_conflicts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_a_id       UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    material_b_id       UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    conflict_type       VARCHAR(50) NOT NULL,   -- 'chemical_reaction', 'olfactory_clash', 'discoloration', 'precipitation'
    severity            VARCHAR(20) NOT NULL,   -- 'warning', 'avoid', 'forbidden'
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (material_a_id, material_b_id)
);

-- ---------------------------------------------------------------------------
-- Accords Library
-- Pre-built or user-defined accord blocks
-- ---------------------------------------------------------------------------
CREATE TABLE accords (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    category            accord_category_enum NOT NULL DEFAULT 'custom',
    description         TEXT,
    is_system           BOOLEAN NOT NULL DEFAULT FALSE,   -- system accords shipped with platform
    is_public           BOOLEAN NOT NULL DEFAULT FALSE,   -- shared across org

    -- Accord performance
    projection          SMALLINT CHECK (projection BETWEEN 1 AND 10),
    longevity           SMALLINT CHECK (longevity BETWEEN 1 AND 10),
    odor_profile        TEXT,
    recommended_usage_pct_max NUMERIC(5,2),   -- max % in final formula

    -- Qdrant reference
    qdrant_vector_id    VARCHAR(100),

    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

CREATE TABLE accord_ingredients (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accord_id           UUID NOT NULL REFERENCES accords(id) ON DELETE CASCADE,
    raw_material_id     UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    percentage          NUMERIC(7,4) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    is_optional         BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (accord_id, raw_material_id)
);
