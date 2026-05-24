-- =============================================================================
-- Migration 006: Perfume Reference Library
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Perfume Library (reference database of commercial perfumes)
-- ---------------------------------------------------------------------------
CREATE TABLE perfume_library (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
    -- NULL organization_id = system-wide / global record
    name                VARCHAR(255) NOT NULL,
    brand               VARCHAR(255) NOT NULL,
    release_year        SMALLINT,
    concentration_type  concentration_type_enum,
    perfumer            VARCHAR(255),
    gender_target       VARCHAR(20) CHECK (gender_target IN ('masculine','feminine','unisex')),
    olfactory_family    odor_family_enum,
    country_of_origin   VARCHAR(100),
    description         TEXT,
    perfumer_notes      TEXT,

    -- Published notes pyramid (from brand/Fragrantica/Basenotes)
    top_notes           TEXT[],
    middle_notes        TEXT[],
    base_notes          TEXT[],
    accords             TEXT[],     -- e.g. ['woody', 'amber', 'spicy']

    -- Performance (community consensus)
    projection_score    NUMERIC(4,2),   -- 1-10
    longevity_hours     NUMERIC(5,1),
    sillage_score       NUMERIC(4,2),

    -- Classification
    is_designer         BOOLEAN NOT NULL DEFAULT FALSE,
    is_niche            BOOLEAN NOT NULL DEFAULT FALSE,
    is_arabic           BOOLEAN NOT NULL DEFAULT FALSE,
    is_attar            BOOLEAN NOT NULL DEFAULT FALSE,

    -- Pricing reference (MSRP in USD)
    msrp_usd_100ml      NUMERIC(10,2),

    -- Qdrant reference for semantic similarity search
    qdrant_vector_id    VARCHAR(100),

    source              VARCHAR(100),   -- 'system', 'fragrantica', 'user_entry'
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Perfume Library — Constituent Molecules
-- Known or estimated raw materials in a reference perfume (for clone mapping)
-- ---------------------------------------------------------------------------
CREATE TABLE perfume_library_ingredients (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfume_library_id      UUID NOT NULL REFERENCES perfume_library(id) ON DELETE CASCADE,
    raw_material_id         UUID REFERENCES raw_materials(id) ON DELETE SET NULL,
    material_name           VARCHAR(255) NOT NULL,   -- keep name even if material deleted
    cas_number              VARCHAR(20),
    estimated_pct_min       NUMERIC(6,4),
    estimated_pct_max       NUMERIC(6,4),
    confidence_level        VARCHAR(20) CHECK (confidence_level IN ('confirmed','estimated','speculated')),
    source                  VARCHAR(100),   -- 'gcms_analysis', 'perfumer_claim', 'community_consensus'
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Perfume Comparisons (stored results of similarity analysis)
-- ---------------------------------------------------------------------------
CREATE TABLE perfume_comparisons (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    perfume_a_id            UUID REFERENCES perfume_library(id) ON DELETE CASCADE,
    perfume_b_formula_id    UUID REFERENCES formulas(id) ON DELETE CASCADE,
    similarity_score        NUMERIC(5,2),   -- 0-100
    projection_similarity   NUMERIC(5,2),
    longevity_similarity    NUMERIC(5,2),
    accord_similarity       NUMERIC(5,2),
    comparison_notes        TEXT,
    compared_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    compared_by             UUID REFERENCES users(id)
);
