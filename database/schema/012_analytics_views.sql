-- =============================================================================
-- Migration 012: Analytics & Materialized Views
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Material Usage Stats (refreshed daily)
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_material_usage_stats AS
SELECT
    rm.organization_id,
    rm.id AS raw_material_id,
    rm.name AS material_name,
    rm.material_type,
    COUNT(DISTINCT fi.formula_id)                       AS formula_count,
    SUM(fi.percentage)                                  AS total_percentage_sum,
    AVG(fi.percentage)                                  AS avg_usage_percentage,
    COUNT(DISTINCT pb.id)                               AS production_batch_count,
    SUM(pbi.actual_amount)                              AS total_grams_consumed,
    SUM(pbi.total_cost)                                 AS total_cost_consumed
FROM raw_materials rm
LEFT JOIN formula_ingredients fi ON fi.raw_material_id = rm.id
LEFT JOIN production_batch_ingredients pbi ON pbi.raw_material_id = rm.id
LEFT JOIN production_batches pb ON pb.id = pbi.production_batch_id
GROUP BY rm.organization_id, rm.id, rm.name, rm.material_type
WITH NO DATA;

CREATE UNIQUE INDEX ON mv_material_usage_stats (organization_id, raw_material_id);

-- ---------------------------------------------------------------------------
-- Formula Performance Summary (refreshed after each review)
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_formula_performance AS
SELECT
    f.organization_id,
    f.id AS formula_id,
    f.name AS formula_name,
    f.concentration_type,
    f.status,
    COUNT(DISTINCT fr.id)                               AS review_count,
    ROUND(AVG(fr.overall_score), 2)                     AS avg_overall_score,
    ROUND(AVG(fr.projection_score), 2)                  AS avg_projection_score,
    ROUND(AVG(fr.longevity_score), 2)                   AS avg_longevity_score,
    COUNT(DISTINCT po.id)                               AS production_order_count,
    SUM(pb.bottles_produced)                            AS total_bottles_produced,
    ROUND(AVG(fcp.total_cost_per_ml), 6)                AS avg_cost_per_ml
FROM formulas f
LEFT JOIN formula_reviews fr ON fr.formula_id = f.id
LEFT JOIN production_orders po ON po.formula_id = f.id
LEFT JOIN production_batches pb ON pb.production_order_id = po.id
LEFT JOIN formula_costing_profiles fcp ON fcp.formula_id = f.id
GROUP BY f.organization_id, f.id, f.name, f.concentration_type, f.status
WITH NO DATA;

CREATE UNIQUE INDEX ON mv_formula_performance (organization_id, formula_id);

-- ---------------------------------------------------------------------------
-- Inventory Health View (real-time, not materialized)
-- ---------------------------------------------------------------------------
CREATE VIEW v_inventory_health AS
SELECT
    rm.organization_id,
    rm.id,
    rm.name,
    rm.material_type,
    rm.current_stock,
    rm.minimum_stock,
    rm.unit_of_measure,
    rm.cost_per_unit,
    rm.current_stock * rm.cost_per_unit             AS stock_value,
    CASE
        WHEN rm.current_stock = 0 THEN 'out_of_stock'
        WHEN rm.current_stock <= rm.minimum_stock THEN 'low_stock'
        WHEN rm.current_stock <= rm.minimum_stock * 1.5 THEN 'approaching_minimum'
        ELSE 'healthy'
    END                                              AS stock_status,
    (SELECT MAX(expiry_date)
     FROM inventory_batches ib
     WHERE ib.raw_material_id = rm.id
       AND ib.quantity_remaining > 0)                AS nearest_expiry,
    (SELECT COUNT(*)
     FROM inventory_batches ib2
     WHERE ib2.raw_material_id = rm.id
       AND ib2.expiry_date < CURRENT_DATE + INTERVAL '90 days'
       AND ib2.quantity_remaining > 0)               AS batches_expiring_90d
FROM raw_materials rm;

-- ---------------------------------------------------------------------------
-- Clone Engine Demand Analysis
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_clone_demand AS
SELECT
    organization_id,
    target_perfume_name,
    target_brand,
    COUNT(*) AS request_count,
    AVG(desired_similarity_pct) AS avg_desired_similarity,
    AVG(budget_per_kg_usd) AS avg_budget_usd,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    MAX(created_at) AS last_requested_at
FROM clone_requests
GROUP BY organization_id, target_perfume_name, target_brand
WITH NO DATA;

CREATE UNIQUE INDEX ON mv_clone_demand (organization_id, target_perfume_name, target_brand);

-- ---------------------------------------------------------------------------
-- Daily refresh function (called by pg_cron or application scheduler)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_material_usage_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_formula_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_clone_demand;
END;
$$;
