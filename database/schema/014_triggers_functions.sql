-- =============================================================================
-- Migration 014: Triggers & Database Functions
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Auto-update updated_at on all relevant tables
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'organizations', 'users', 'suppliers', 'raw_materials',
        'inventory_batches', 'packaging_materials', 'accords',
        'formulas', 'ai_provider_configs', 'production_orders',
        'production_batches', 'pricing_rules', 'clone_requests',
        'molecule_profiles'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
            t, t
        );
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Stock level sync: keep raw_materials.current_stock in sync with transactions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_material_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE raw_materials
    SET current_stock = current_stock + NEW.quantity_delta
    WHERE id = NEW.raw_material_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inventory_txn_stock_sync
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION sync_material_stock();

-- ---------------------------------------------------------------------------
-- Inventory batch quantity sync on transaction
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_batch_quantity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.batch_id IS NOT NULL THEN
        UPDATE inventory_batches
        SET quantity_remaining = quantity_remaining + NEW.quantity_delta
        WHERE id = NEW.batch_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inventory_txn_batch_sync
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION sync_batch_quantity();

-- ---------------------------------------------------------------------------
-- Audit log trigger (generic — applies to key tables)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Try to extract organization_id from the row
    BEGIN
        IF TG_OP = 'DELETE' THEN
            v_org_id := OLD.organization_id;
        ELSE
            v_org_id := NEW.organization_id;
        END IF;
    EXCEPTION WHEN undefined_column THEN
        v_org_id := NULL;
    END;

    INSERT INTO audit_logs (organization_id, action, resource_type, resource_id, old_values, new_values)
    VALUES (
        v_org_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit trigger to sensitive tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'formulas', 'formula_versions', 'production_orders',
        'production_batches', 'raw_materials', 'pricing_rules',
        'ai_provider_configs', 'ifra_restrictions'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_audit
             AFTER INSERT OR UPDATE OR DELETE ON %s
             FOR EACH ROW EXECUTE FUNCTION audit_log_changes();',
            t, t
        );
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Formula version snapshot: auto-create version on formula update
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION snapshot_formula_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_next_version INTEGER;
    v_snapshot JSONB;
BEGIN
    -- Only snapshot on meaningful field changes, not status-only updates
    IF OLD.updated_at = NEW.updated_at THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_next_version
    FROM formula_versions
    WHERE formula_id = NEW.id;

    -- Snapshot current formula + its ingredients
    SELECT jsonb_build_object(
        'formula', to_jsonb(NEW),
        'ingredients', COALESCE((
            SELECT jsonb_agg(to_jsonb(fi))
            FROM formula_ingredients fi
            WHERE fi.formula_id = NEW.id
        ), '[]'::jsonb)
    ) INTO v_snapshot;

    INSERT INTO formula_versions (formula_id, version_number, snapshot, created_by)
    VALUES (NEW.id, v_next_version, v_snapshot, NEW.created_by);

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_formula_snapshot
    AFTER UPDATE ON formulas
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION snapshot_formula_version();

-- ---------------------------------------------------------------------------
-- Prevent modification of locked formulas
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_formula_lock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.locked_at IS NOT NULL AND OLD.status = 'locked' THEN
        RAISE EXCEPTION 'Formula "%" is locked and cannot be modified. Create a new version.', OLD.name;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_formula_lock_guard
    BEFORE UPDATE ON formulas
    FOR EACH ROW
    WHEN (OLD.locked_at IS NOT NULL AND OLD.status = 'locked')
    EXECUTE FUNCTION enforce_formula_lock();

-- ---------------------------------------------------------------------------
-- Prevent stock from going negative
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_stock_negative()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_current_stock NUMERIC;
BEGIN
    SELECT current_stock INTO v_current_stock
    FROM raw_materials
    WHERE id = NEW.raw_material_id;

    IF v_current_stock + NEW.quantity_delta < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for material %. Available: %, Requested deduction: %',
            NEW.raw_material_id,
            v_current_stock,
            ABS(NEW.quantity_delta);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inventory_stock_guard
    BEFORE INSERT ON inventory_transactions
    FOR EACH ROW
    WHEN (NEW.quantity_delta < 0)
    EXECUTE FUNCTION check_stock_negative();

-- ---------------------------------------------------------------------------
-- Ensure only one default AI config per org
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_single_default_ai_config()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE ai_provider_configs
        SET is_default = FALSE
        WHERE organization_id = NEW.organization_id
          AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ai_config_single_default
    BEFORE INSERT OR UPDATE ON ai_provider_configs
    FOR EACH ROW
    WHEN (NEW.is_default = TRUE)
    EXECUTE FUNCTION enforce_single_default_ai_config();

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- Calculate total formula cost for a given formula + batch size
CREATE OR REPLACE FUNCTION calculate_formula_cost(
    p_formula_id UUID,
    p_batch_ml NUMERIC
)
RETURNS TABLE (
    material_id UUID,
    material_name VARCHAR,
    amount_grams NUMERIC,
    unit_cost NUMERIC,
    line_cost NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        fi.raw_material_id,
        rm.name,
        (fi.effective_pct / 100.0) * p_batch_ml    AS amount_grams,
        rm.cost_per_unit                            AS unit_cost,
        (fi.effective_pct / 100.0) * p_batch_ml * rm.cost_per_unit AS line_cost
    FROM formula_ingredients fi
    JOIN raw_materials rm ON rm.id = fi.raw_material_id
    WHERE fi.formula_id = p_formula_id;
END;
$$;

-- Check if formula passes IFRA for a given category
CREATE OR REPLACE FUNCTION check_ifra_compliance(
    p_formula_id UUID,
    p_category ifra_category_enum,
    p_amendment_id UUID DEFAULT NULL
)
RETURNS TABLE (
    material_id UUID,
    material_name VARCHAR,
    usage_pct NUMERIC,
    allowed_pct NUMERIC,
    is_compliant BOOLEAN,
    restriction_type VARCHAR
) LANGUAGE plpgsql AS $$
DECLARE
    v_amendment_id UUID;
BEGIN
    -- Use the current amendment if not specified
    IF p_amendment_id IS NULL THEN
        SELECT id INTO v_amendment_id FROM ifra_amendments WHERE is_current = TRUE LIMIT 1;
    ELSE
        v_amendment_id := p_amendment_id;
    END IF;

    RETURN QUERY
    SELECT
        fi.raw_material_id,
        rm.name,
        fi.effective_pct,
        ir.max_limit_pct,
        CASE
            WHEN ir.restriction_type = 'prohibited' THEN FALSE
            WHEN ir.max_limit_pct IS NOT NULL THEN fi.effective_pct <= ir.max_limit_pct
            ELSE TRUE
        END AS is_compliant,
        ir.restriction_type
    FROM formula_ingredients fi
    JOIN raw_materials rm ON rm.id = fi.raw_material_id
    LEFT JOIN ifra_restrictions ir ON ir.raw_material_id = fi.raw_material_id
        AND ir.ifra_amendment_id = v_amendment_id
        AND ir.category = p_category
    WHERE fi.formula_id = p_formula_id;
END;
$$;
