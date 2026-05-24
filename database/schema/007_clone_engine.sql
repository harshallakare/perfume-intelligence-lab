-- =============================================================================
-- Migration 007: Clone Engine
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Clone Requests
-- ---------------------------------------------------------------------------
CREATE TABLE clone_requests (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requested_by            UUID NOT NULL REFERENCES users(id),

    -- Target perfume
    target_perfume_name     VARCHAR(255) NOT NULL,
    target_brand            VARCHAR(255),
    target_concentration    concentration_type_enum,
    perfume_library_id      UUID REFERENCES perfume_library(id) ON DELETE SET NULL,

    -- Clone parameters
    desired_similarity_pct  NUMERIC(5,2) NOT NULL DEFAULT 80,
    target_concentration_output concentration_type_enum NOT NULL DEFAULT 'edp',
    budget_per_kg_usd       NUMERIC(10,2),   -- cost constraint
    preferred_materials     UUID[],          -- raw_material_ids to prefer
    excluded_materials      UUID[],          -- raw_material_ids to exclude
    special_instructions    TEXT,

    -- Processing
    status                  clone_status_enum NOT NULL DEFAULT 'pending',
    started_at              TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    error_message           TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Generated Clone Formulas (results of Clone Engine)
-- Multiple ranked options returned per request
-- ---------------------------------------------------------------------------
CREATE TABLE clone_formulas (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clone_request_id        UUID NOT NULL REFERENCES clone_requests(id) ON DELETE CASCADE,
    formula_id              UUID REFERENCES formulas(id) ON DELETE SET NULL,  -- linked formula if saved
    rank                    SMALLINT NOT NULL DEFAULT 1,   -- 1 = best match

    -- Similarity breakdown
    overall_similarity      NUMERIC(5,2),
    olfactory_similarity    NUMERIC(5,2),
    projection_similarity   NUMERIC(5,2),
    longevity_similarity    NUMERIC(5,2),
    accord_similarity       NUMERIC(5,2),
    dry_down_similarity     NUMERIC(5,2),

    -- Performance estimates
    projected_longevity_hrs NUMERIC(5,1),
    projected_projection    SMALLINT CHECK (projected_projection BETWEEN 1 AND 10),
    projected_sillage       SMALLINT CHECK (projected_sillage BETWEEN 1 AND 10),

    -- Economics
    estimated_cost_per_kg   NUMERIC(10,2),
    estimated_cost_per_ml   NUMERIC(10,4),

    -- Formula composition (denormalized snapshot)
    formula_snapshot        JSONB NOT NULL,   -- [{material_id, name, percentage, grams_per_kg}]

    -- Alternative molecules considered
    alternatives_considered JSONB,    -- [{section, original, alternatives: [{id, name, score}]}]

    perfumer_notes          TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- FK: formulas → clone_requests (added here to avoid circular dependency)
-- ---------------------------------------------------------------------------
ALTER TABLE formulas
    ADD CONSTRAINT fk_formulas_clone_request
    FOREIGN KEY (clone_request_id)
    REFERENCES clone_requests(id)
    ON DELETE SET NULL;
