export type MaterialType =
  | "aroma_chemical" | "essential_oil" | "absolute" | "natural_extract"
  | "fixative" | "alcohol" | "dpg" | "ipm" | "tec"
  | "musk" | "aldehyde" | "perfume_base" | "solvent" | "other";

export type OdorFamily =
  | "floral" | "oriental" | "woody" | "fresh" | "citrus" | "aquatic"
  | "gourmand" | "fougere" | "chypre" | "leather" | "tobacco" | "musk"
  | "animalic" | "green" | "herbal" | "spicy" | "amber" | "powdery"
  | "aldehyic" | "fruity";

export type ConcentrationType =
  | "edt" | "edp" | "parfum" | "extrait" | "attar" | "cologne" | "body_spray" | "oil_blend";

export type FormulaSection =
  | "top_note" | "middle_note" | "base_note" | "modifier" | "trace_molecule";

export type FormulaStatus = "draft" | "under_review" | "approved" | "locked" | "deprecated";

export type StockStatus = "healthy" | "low" | "out";

export interface RawMaterial {
  id: string;
  organization_id: string;
  name: string;
  cas_number?: string;
  material_type: MaterialType;
  odor_family?: OdorFamily;
  odor_description?: string;
  odor_intensity?: number;
  volatility_class?: "T" | "M" | "B";
  purity_percentage?: number;
  current_stock: number;
  minimum_stock: number;
  unit_of_measure: string;
  density?: number;
  cost_per_unit: number;
  currency: string;
  is_natural: boolean;
  is_allergen: boolean;
  is_restricted: boolean;
  ifra_restricted: boolean;
  expiry_date?: string;
  storage_conditions?: string;
  primary_supplier_id?: string;
  supplier_name?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export type PackagingType =
  | "bottle" | "cap" | "sprayer" | "pump" | "box" | "label" | "vial" | "roller" | "other";

export interface PackagingItem {
  id: string;
  organization_id: string;
  name: string;
  item_type: PackagingType;
  capacity_ml?: number | null;
  unit_price: number;
  currency: string;
  current_stock: number;
  minimum_stock: number;
  supplier_name?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinishedGood {
  id: string;
  organization_id: string;
  name: string;
  perfume_type: string;
  batch_volume_ml: number;
  bottle_size_ml: number;
  bottles_filled: number;
  bottles_used: number;
  leftover_ml: number;
  oil_ml: number;
  alcohol_ml: number;
  fixative_ml: number;
  unit_cost?: number | null;
  batch_cost?: number | null;
  packaging_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface FormulaIngredient {
  id: string;
  raw_material_id: string;
  material_name: string;
  material_type: MaterialType;
  section: FormulaSection;
  percentage: number;
  dilution_pct: number;
  effective_pct: number;
  amount_grams?: number;
  is_optional: boolean;
  sort_order: number;
  perfumer_notes?: string;
  cost_per_unit?: number;
}

export interface Formula {
  id: string;
  organization_id: string;
  name: string;
  internal_code?: string;
  concentration_type: ConcentrationType;
  status: FormulaStatus;
  olfactory_family?: OdorFamily;
  gender_target?: "masculine" | "feminine" | "unisex";
  season_target?: string;
  total_fragrance_pct?: number;
  projection_target?: number;
  longevity_target?: number;
  sillage_target?: number;
  description?: string;
  inspiration_perfume?: string;
  inspiration_brand?: string;
  ingredients: FormulaIngredient[];
  cost_per_ml?: number;
  is_ifra_compliant?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  country?: string;
  contact_name?: string;
  email?: string;
  is_active: boolean;
}

export interface CloneRequest {
  id: string;
  target_perfume_name: string;
  target_brand?: string;
  desired_similarity_pct: number;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

export interface ProductionOrder {
  id: string;
  order_number: string;
  formula_id: string;
  formula_name: string;
  requested_bottles: number;
  bottle_size_ml: number;
  status: "draft" | "scheduled" | "in_progress" | "macerating" | "quality_check" | "completed" | "rejected" | "cancelled";
  planned_start_date?: string;
  planned_end_date?: string;
  assigned_to?: string;
  created_at: string;
}

export interface DashboardStats {
  total_materials: number;
  low_stock_materials: number;
  active_formulas: number;
  production_in_progress: number;
  pending_compliance: number;
  ai_sessions_today: number;
}

export interface InventoryTransaction {
  id: string;
  raw_material_id: string;
  transaction_type: string;
  quantity_delta: number;
  quantity_after: number;
  reference_type?: string;
  created_at: string;
}
