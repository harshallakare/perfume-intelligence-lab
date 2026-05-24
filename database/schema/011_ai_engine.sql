-- =============================================================================
-- Migration 011: AI Formula Engine
-- =============================================================================

-- ---------------------------------------------------------------------------
-- AI Provider Configurations (per organization)
-- ---------------------------------------------------------------------------
CREATE TABLE ai_provider_configs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider            ai_provider_enum NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    display_name        VARCHAR(100),
    api_key_encrypted   TEXT,               -- encrypted with org-specific key
    api_base_url        TEXT,               -- for Ollama / local LLM / Azure
    model_id            VARCHAR(100),       -- e.g. 'gpt-4o', 'claude-opus-4-7', 'llama3.1:70b'
    temperature         NUMERIC(3,2) DEFAULT 0.3,
    max_tokens          INTEGER DEFAULT 4096,
    extra_params        JSONB DEFAULT '{}', -- provider-specific params
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, provider, model_id)
);

-- ---------------------------------------------------------------------------
-- AI Generation Sessions
-- Each time a user invokes AI (formula gen, substitution, accord analysis)
-- ---------------------------------------------------------------------------
CREATE TABLE ai_generation_sessions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES users(id),
    ai_config_id            UUID REFERENCES ai_provider_configs(id) ON DELETE SET NULL,
    session_type            VARCHAR(50) NOT NULL,  -- 'formula_generation', 'substitute_suggestion', 'accord_analysis', 'clone_assist'

    -- Inputs
    user_prompt             TEXT NOT NULL,
    system_context          TEXT,     -- injected context (inventory, IFRA, preferences)
    rag_sources             JSONB,    -- [{type, id, similarity_score}] documents used in RAG

    -- Outputs
    raw_llm_response        TEXT,
    parsed_formula          JSONB,    -- structured formula if session produced one
    formula_id              UUID REFERENCES formulas(id) ON DELETE SET NULL,

    -- Inputs captured
    desired_notes           TEXT[],
    mood                    VARCHAR(100),
    season                  VARCHAR(50),
    climate                 VARCHAR(50),
    gender_target           VARCHAR(20),
    luxury_level            SMALLINT CHECK (luxury_level BETWEEN 1 AND 5),
    projection_target       SMALLINT CHECK (projection_target BETWEEN 1 AND 10),
    longevity_target        SMALLINT CHECK (longevity_target BETWEEN 1 AND 10),
    budget_per_kg_usd       NUMERIC(10,2),

    -- Metrics
    token_prompt            INTEGER,
    token_completion        INTEGER,
    token_total             INTEGER,
    latency_ms              INTEGER,
    model_used              VARCHAR(100),

    -- Quality
    user_rating             SMALLINT CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback           TEXT,
    was_formula_saved       BOOLEAN NOT NULL DEFAULT FALSE,

    -- Status
    status                  VARCHAR(30) NOT NULL DEFAULT 'pending',  -- pending, streaming, completed, failed
    error_message           TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at            TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- AI Suggested Substitutes
-- Logged separately for review and improvement
-- ---------------------------------------------------------------------------
CREATE TABLE ai_substitution_suggestions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id              UUID NOT NULL REFERENCES ai_generation_sessions(id) ON DELETE CASCADE,
    original_material_id    UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    suggested_material_id   UUID REFERENCES raw_materials(id) ON DELETE SET NULL,
    suggested_material_name VARCHAR(255) NOT NULL,
    reason                  TEXT,
    usage_ratio             NUMERIC(6,4),   -- amount multiplier vs original
    confidence_score        NUMERIC(5,2),
    was_accepted            BOOLEAN,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- AI Usage Metering (for plan limits and billing)
-- ---------------------------------------------------------------------------
CREATE TABLE ai_usage_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id          UUID REFERENCES ai_generation_sessions(id) ON DELETE SET NULL,
    provider            ai_provider_enum NOT NULL,
    model_id            VARCHAR(100),
    tokens_used         INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd  NUMERIC(10,6),
    billed_at           DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
