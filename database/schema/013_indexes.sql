-- =============================================================================
-- Migration 013: Performance Indexes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Core Auth
-- ---------------------------------------------------------------------------
CREATE INDEX idx_users_org ON users (organization_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_audit_logs_org_created ON audit_logs (organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs (organization_id, resource_type, resource_id);

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------
CREATE INDEX idx_suppliers_org ON suppliers (organization_id);

CREATE INDEX idx_raw_materials_org ON raw_materials (organization_id);
CREATE INDEX idx_raw_materials_type ON raw_materials (organization_id, material_type);
CREATE INDEX idx_raw_materials_stock ON raw_materials (organization_id, current_stock) WHERE current_stock <= minimum_stock;
CREATE INDEX idx_raw_materials_cas ON raw_materials (cas_number) WHERE cas_number IS NOT NULL;
-- Full-text search on material names
CREATE INDEX idx_raw_materials_name_trgm ON raw_materials USING GIN (name gin_trgm_ops);

CREATE INDEX idx_inventory_batches_material ON inventory_batches (raw_material_id, organization_id);
CREATE INDEX idx_inventory_batches_expiry ON inventory_batches (organization_id, expiry_date) WHERE expiry_date IS NOT NULL AND quantity_remaining > 0;
CREATE INDEX idx_inventory_batches_number ON inventory_batches (organization_id, batch_number);

CREATE INDEX idx_inventory_txn_material ON inventory_transactions (raw_material_id, created_at DESC);
CREATE INDEX idx_inventory_txn_org ON inventory_transactions (organization_id, created_at DESC);
CREATE INDEX idx_inventory_txn_ref ON inventory_transactions (reference_type, reference_id) WHERE reference_id IS NOT NULL;

CREATE INDEX idx_packaging_org ON packaging_materials (organization_id);

-- ---------------------------------------------------------------------------
-- Molecule Intelligence
-- ---------------------------------------------------------------------------
CREATE INDEX idx_molecule_profiles_material ON molecule_profiles (raw_material_id);
CREATE INDEX idx_accords_org ON accords (organization_id);
CREATE INDEX idx_accord_ingredients_accord ON accord_ingredients (accord_id);
CREATE INDEX idx_molecule_synergies_a ON molecule_synergies (material_a_id);
CREATE INDEX idx_molecule_synergies_b ON molecule_synergies (material_b_id);
CREATE INDEX idx_molecule_conflicts_a ON molecule_conflicts (material_a_id);
CREATE INDEX idx_molecule_conflicts_b ON molecule_conflicts (material_b_id);

-- ---------------------------------------------------------------------------
-- Formulas
-- ---------------------------------------------------------------------------
CREATE INDEX idx_formulas_org ON formulas (organization_id);
CREATE INDEX idx_formulas_status ON formulas (organization_id, status);
CREATE INDEX idx_formulas_concentration ON formulas (organization_id, concentration_type);
CREATE INDEX idx_formulas_name_trgm ON formulas USING GIN (name gin_trgm_ops);
CREATE INDEX idx_formula_versions_formula ON formula_versions (formula_id, version_number DESC);
CREATE INDEX idx_formula_ingredients_formula ON formula_ingredients (formula_id);
CREATE INDEX idx_formula_ingredients_material ON formula_ingredients (raw_material_id);
CREATE INDEX idx_formula_reviews_formula ON formula_reviews (formula_id);

-- ---------------------------------------------------------------------------
-- Perfume Library
-- ---------------------------------------------------------------------------
CREATE INDEX idx_perfume_library_org ON perfume_library (organization_id);
CREATE INDEX idx_perfume_library_brand ON perfume_library (brand);
CREATE INDEX idx_perfume_library_name_trgm ON perfume_library USING GIN (name gin_trgm_ops);
CREATE INDEX idx_perfume_library_brand_trgm ON perfume_library USING GIN (brand gin_trgm_ops);
CREATE INDEX idx_perfume_library_type ON perfume_library (is_designer, is_niche, is_arabic, is_attar);

-- ---------------------------------------------------------------------------
-- Clone Engine
-- ---------------------------------------------------------------------------
CREATE INDEX idx_clone_requests_org ON clone_requests (organization_id);
CREATE INDEX idx_clone_requests_status ON clone_requests (organization_id, status);
CREATE INDEX idx_clone_requests_name_trgm ON clone_requests USING GIN (target_perfume_name gin_trgm_ops);
CREATE INDEX idx_clone_formulas_request ON clone_formulas (clone_request_id, rank);

-- ---------------------------------------------------------------------------
-- IFRA Compliance
-- ---------------------------------------------------------------------------
CREATE INDEX idx_ifra_restrictions_material ON ifra_restrictions (raw_material_id, ifra_amendment_id);
CREATE INDEX idx_ifra_restrictions_cas ON ifra_restrictions (cas_number);
CREATE INDEX idx_compliance_checks_formula ON compliance_checks (formula_id);
CREATE INDEX idx_compliance_checks_org ON compliance_checks (organization_id, checked_at DESC);
CREATE INDEX idx_compliance_items_check ON compliance_check_items (compliance_check_id);

-- ---------------------------------------------------------------------------
-- Production
-- ---------------------------------------------------------------------------
CREATE INDEX idx_production_orders_org ON production_orders (organization_id);
CREATE INDEX idx_production_orders_status ON production_orders (organization_id, status);
CREATE INDEX idx_production_orders_formula ON production_orders (formula_id);
CREATE INDEX idx_production_batches_order ON production_batches (production_order_id);
CREATE INDEX idx_production_batches_org ON production_batches (organization_id, status);
CREATE INDEX idx_production_batches_barcode ON production_batches (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_batch_ingredients_batch ON production_batch_ingredients (production_batch_id);
CREATE INDEX idx_batch_ingredients_material ON production_batch_ingredients (raw_material_id);
CREATE INDEX idx_qc_logs_batch ON qc_logs (production_batch_id);

-- ---------------------------------------------------------------------------
-- Costing
-- ---------------------------------------------------------------------------
CREATE INDEX idx_costing_profiles_formula ON formula_costing_profiles (formula_id);
CREATE INDEX idx_costing_profiles_org ON formula_costing_profiles (organization_id, calculated_at DESC);

-- ---------------------------------------------------------------------------
-- AI Engine
-- ---------------------------------------------------------------------------
CREATE INDEX idx_ai_configs_org ON ai_provider_configs (organization_id, is_active);
CREATE INDEX idx_ai_sessions_org ON ai_generation_sessions (organization_id, created_at DESC);
CREATE INDEX idx_ai_sessions_user ON ai_generation_sessions (user_id, created_at DESC);
CREATE INDEX idx_ai_sessions_type ON ai_generation_sessions (organization_id, session_type);
CREATE INDEX idx_ai_usage_org ON ai_usage_logs (organization_id, billed_at DESC);
