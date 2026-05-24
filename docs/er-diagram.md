# Perfume Intelligence Lab — Entity Relationship Overview

## Entity Groups & Key Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│ TENANT FOUNDATION                                                │
│                                                                  │
│  organizations ──< users ──< user_roles >── roles               │
│       │                │                                         │
│       │                └──< refresh_tokens                       │
│       │                └──< audit_logs                           │
└───────┼─────────────────────────────────────────────────────────┘
        │ (organization_id on all domain tables)
        │
┌───────┼─────────────────────────────────────────────────────────┐
│ INVENTORY                                                        │
│       │                                                          │
│  suppliers ──< raw_materials ──< inventory_batches              │
│                    │         ──< inventory_transactions          │
│                    │         ──< material_allergens              │
│                    │         ──< material_substitutes            │
│                    └──< molecule_profiles                        │
│                              │                                   │
│                    molecule_synergies (m2m raw_materials)        │
│                    molecule_conflicts (m2m raw_materials)        │
│                                                                  │
│  packaging_materials ──< production_packaging_consumption        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ FORMULA BUILDER                                                  │
│                                                                  │
│  formulas ──< formula_ingredients >── raw_materials             │
│           ──< formula_versions                                   │
│           ──< formula_accords >── accords                        │
│           ──< formula_batch_calculations                         │
│           ──< formula_reviews                                    │
│           ──< formula_tags                                       │
│                                                                  │
│  accords ──< accord_ingredients >── raw_materials               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CLONE ENGINE                                                     │
│                                                                  │
│  clone_requests >── perfume_library                             │
│       │         ──< clone_formulas ──> formulas                 │
│       └──────────────────────────────── formulas (reverse FK)  │
│                                                                  │
│  perfume_library ──< perfume_library_ingredients >── raw_mats  │
│  perfume_comparisons >── perfume_library                        │
│                     └──> formulas                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ IFRA COMPLIANCE                                                  │
│                                                                  │
│  ifra_amendments ──< ifra_restrictions >── raw_materials        │
│  compliance_checks >── formulas                                  │
│                    >── formula_versions                          │
│                    >── ifra_amendments                           │
│       │──< compliance_check_items >── raw_materials             │
│                                   >── ifra_restrictions         │
│  allergen_declarations >── formulas                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PRODUCTION                                                       │
│                                                                  │
│  production_orders >── formulas                                  │
│                    >── formula_versions                          │
│                    >── packaging_materials                       │
│       │──< production_batches                                    │
│              │──< production_batch_ingredients >── raw_mats     │
│              │──< maceration_records                            │
│              │──< qc_logs                                        │
│              └──< production_packaging_consumption              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ COSTING                                                          │
│                                                                  │
│  formula_costing_profiles >── formulas                          │
│                            >── formula_versions                 │
│  pricing_rules (per org)                                        │
│  overhead_rates (per org)                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ AI ENGINE                                                        │
│                                                                  │
│  ai_provider_configs (per org, encrypted keys)                  │
│  ai_generation_sessions >── ai_provider_configs                 │
│                          >── formulas                           │
│       │──< ai_substitution_suggestions >── raw_materials        │
│  ai_usage_logs >── ai_generation_sessions                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ANALYTICS (Materialized Views — refreshed daily)                │
│                                                                  │
│  mv_material_usage_stats  (from raw_materials + formulas + prod)│
│  mv_formula_performance   (from formulas + reviews + production)│
│  mv_clone_demand          (from clone_requests)                 │
│  v_inventory_health       (live view — real-time stock status)  │
└─────────────────────────────────────────────────────────────────┘
```

## Table Count Summary

| Module | Tables |
|--------|--------|
| Core Auth | 7 (organizations, users, roles, user_roles, refresh_tokens, email_verifications, password_resets) |
| Audit | 1 partitioned (audit_logs × 12 monthly partitions) |
| Inventory | 6 (suppliers, raw_materials, material_allergens, inventory_batches, inventory_transactions, packaging_materials, material_substitutes) |
| Molecule Intelligence | 4 (molecule_profiles, molecule_synergies, molecule_conflicts, accords, accord_ingredients) |
| Formula Builder | 7 (formulas, formula_versions, formula_ingredients, formula_accords, formula_batch_calculations, formula_tags, formula_reviews) |
| Perfume Library | 3 (perfume_library, perfume_library_ingredients, perfume_comparisons) |
| Clone Engine | 2 (clone_requests, clone_formulas) |
| IFRA Compliance | 5 (ifra_amendments, ifra_restrictions, compliance_checks, compliance_check_items, allergen_declarations) |
| Production | 6 (production_orders, production_batches, production_batch_ingredients, maceration_records, qc_logs, production_packaging_consumption) |
| Costing | 3 (formula_costing_profiles, pricing_rules, overhead_rates) |
| AI Engine | 3 (ai_provider_configs, ai_generation_sessions, ai_substitution_suggestions, ai_usage_logs) |
| Analytics | 3 MVs + 1 view |
| **Total** | **~55 tables/views** |

## Partitioning Strategy

| Table | Partition Key | Strategy |
|-------|--------------|----------|
| audit_logs | created_at | Monthly range partitions |
| inventory_transactions | created_at | Monthly range partitions |

## Indexing Strategy

| Index Type | Applied To |
|-----------|-----------|
| GIN trigram (`pg_trgm`) | material names, formula names, perfume library names & brands, clone request target names |
| B-tree composite | All `(organization_id, status)` pairs, `(organization_id, created_at DESC)` for time-series |
| Partial index | Low-stock materials, non-revoked refresh tokens, non-null fields with sparse data |
| Unique | All business-key uniqueness constraints |
