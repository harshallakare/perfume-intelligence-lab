-- =============================================================================
-- Migration 001: Extensions & Custom Types
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- trigram search on material names
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- accent-insensitive search

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE user_role_enum AS ENUM (
    'admin',
    'perfumer',
    'production_manager',
    'inventory_manager',
    'sales'
);

CREATE TYPE material_type_enum AS ENUM (
    'aroma_chemical',
    'essential_oil',
    'absolute',
    'natural_extract',
    'fixative',
    'alcohol',
    'dpg',
    'ipm',
    'tec',
    'musk',
    'aldehyde',
    'perfume_base',
    'solvent',
    'other'
);

CREATE TYPE concentration_type_enum AS ENUM (
    'edt',
    'edp',
    'parfum',
    'extrait',
    'attar',
    'cologne',
    'body_spray',
    'oil_blend'
);

CREATE TYPE formula_section_enum AS ENUM (
    'top_note',
    'middle_note',
    'base_note',
    'modifier',
    'trace_molecule'
);

CREATE TYPE production_status_enum AS ENUM (
    'draft',
    'scheduled',
    'in_progress',
    'macerating',
    'quality_check',
    'completed',
    'rejected',
    'cancelled'
);

CREATE TYPE transaction_type_enum AS ENUM (
    'purchase',
    'production_debit',
    'adjustment_add',
    'adjustment_remove',
    'waste',
    'return',
    'transfer_in',
    'transfer_out',
    'expiry_disposal'
);

CREATE TYPE odor_family_enum AS ENUM (
    'floral',
    'oriental',
    'woody',
    'fresh',
    'citrus',
    'aquatic',
    'gourmand',
    'fougere',
    'chypre',
    'leather',
    'tobacco',
    'musk',
    'animalic',
    'green',
    'herbal',
    'spicy',
    'amber',
    'powdery',
    'aldehyic',
    'fruity'
);

CREATE TYPE ifra_category_enum AS ENUM (
    'cat_1',   -- hydroalcoholic products applied to armpits
    'cat_2',   -- deodorant/antiperspirant products
    'cat_3',   -- eye products / mucous membranes
    'cat_4',   -- body lotions, oils, leave-on products
    'cat_5a',  -- body creams, oils used on large areas
    'cat_5b',  -- face creams
    'cat_5c',  -- hand creams
    'cat_5d',  -- baby/children products
    'cat_6',   -- mouthwash / oral care
    'cat_7a',  -- rinse-off hair products
    'cat_7b',  -- leave-on hair products
    'cat_8',   -- products with significant skin contact (intimate hygiene)
    'cat_9',   -- rinse-off products (soaps, shower)
    'cat_10a', -- household products with possible skin contact
    'cat_10b', -- household products (no skin contact)
    'cat_11a', -- perfumes for fine fragrance
    'cat_11b', -- eau de toilette
    'cat_12',  -- incense / candles
    'cat_13',  -- animal care products
    'cat_14'   -- fabric treatments / laundry
);

CREATE TYPE ai_provider_enum AS ENUM (
    'openai',
    'anthropic',
    'gemini',
    'ollama',
    'deepseek',
    'local_llm',
    'azure_openai'
);

CREATE TYPE clone_status_enum AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

CREATE TYPE qc_result_enum AS ENUM (
    'pass',
    'fail',
    'conditional_pass',
    'pending'
);

CREATE TYPE pricing_tier_enum AS ENUM (
    'cost',
    'wholesale',
    'retail',
    'luxury'
);

CREATE TYPE formula_status_enum AS ENUM (
    'draft',
    'under_review',
    'approved',
    'locked',
    'deprecated'
);

CREATE TYPE accord_category_enum AS ENUM (
    'amber',
    'leather',
    'tobacco',
    'marine',
    'rose',
    'oud',
    'blue',
    'musk',
    'vanilla',
    'gourmand',
    'citrus',
    'green',
    'woody',
    'floral',
    'spicy',
    'custom'
);
