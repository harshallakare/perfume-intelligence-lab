"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DollarSign, FlaskConical, TrendingUp, Package,
  Settings, Calculator, BarChart2, ChevronDown,
  Edit2, Check, X, Plus, Trash2, Loader2,
} from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { concentrationLabel } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IngredientCost {
  name: string;
  section: "top" | "heart" | "base" | "modifier";
  pct: number;
  costPerKg: number;
}

interface FormulaData {
  id: string;
  name: string;
  type: string;
  oilPct: number;
  ingredients: IngredientCost[];
}

interface ApiFormula {
  id: string;
  name: string;
  concentration_type: string;
  status: string;
  total_fragrance_pct: number;
}

interface ApiIngredient {
  id: string;
  name: string;
  section: string;
  percentage: number;
  cost_per_unit?: number; // cost per gram from DB
}

interface PricingRule {
  tier: string;
  label: string;
  multiplier: number;
  color: string;
}

interface OverheadRate {
  id: string;
  name: string;
  type: string;
  value: number;
  unit: string;
}

// ─── Section mapping: API sections → costing sections ────────────────────────

function apiSectionToCosting(s: string): "top" | "heart" | "base" | "modifier" {
  if (s === "top_note") return "top";
  if (s === "middle_note") return "heart";
  if (s === "base_note") return "base";
  return "modifier"; // modifier, trace_molecule
}

const ALCOHOL_COST_PER_L = 2.2;   // SDA 40B, USD/litre
const FIXATIVE_COST_PER_KG = 28;  // blended fixative avg

const INIT_PRICING: PricingRule[] = [
  { tier: "wholesale", label: "Wholesale",  multiplier: 2.5,  color: "#60a5fa" },
  { tier: "retail",    label: "Retail",     multiplier: 5.0,  color: "#c9a84c" },
  { tier: "luxury",    label: "Luxury",     multiplier: 10.0, color: "#a78bfa" },
];

const INIT_OVERHEADS: OverheadRate[] = [
  { id: "oh1", name: "Blending Labour",    type: "per_unit",    value: 0.80, unit: "$/unit"   },
  { id: "oh2", name: "Bottling & Filling", type: "per_unit",    value: 0.45, unit: "$/unit"   },
  { id: "oh3", name: "Quality Control",   type: "per_unit",    value: 0.25, unit: "$/unit"   },
  { id: "oh4", name: "Utilities",         type: "per_litre",   value: 1.20, unit: "$/litre"  },
  { id: "oh5", name: "Facility Overhead", type: "per_litre",   value: 2.50, unit: "$/litre"  },
];

const PACKAGING_PRESETS = [
  { label: "Simple (bottle + cap)",      value: 1.20 },
  { label: "Standard (bottle + box)",    value: 2.80 },
  { label: "Premium (luxury box + bag)", value: 6.50 },
  { label: "Bespoke luxury",             value: 14.0 },
];

const SECTION_COLOR: Record<string, string> = {
  top: "#60a5fa", heart: "#f472b6", base: "#c9a84c", modifier: "#a78bfa",
};

// ─── Calculation Engine ───────────────────────────────────────────────────────

function calcCosts(
  formula: FormulaData,
  batchMl: number,
  packagingCost: number,
  overheads: OverheadRate[],
  pricing: PricingRule[]
) {
  const oilMl   = (formula.oilPct / 100) * batchMl;
  const fixMl   = (3 / 100) * batchMl;
  const alcMl   = batchMl - oilMl - fixMl;

  // Per-ingredient cost of oil blend
  const oilBlendCostPerKg = formula.ingredients.reduce(
    (sum, ing) => sum + (ing.pct / 100) * ing.costPerKg, 0
  );
  const oilCostTotal   = (oilMl / 1000) * oilBlendCostPerKg;  // ml → kg
  const alcCostTotal   = (alcMl / 1000) * ALCOHOL_COST_PER_L * 1000; // convert
  const fixCostTotal   = (fixMl / 1000) * FIXATIVE_COST_PER_KG;

  // Overhead cost for this batch
  const perUnitOverhead = overheads
    .filter((o) => o.type === "per_unit" && o.value > 0)
    .reduce((s, o) => s + o.value, 0);
  const perLitreOverhead = overheads
    .filter((o) => o.type === "per_litre" && o.value > 0)
    .reduce((s, o) => s + o.value, 0);
  const overheadTotal = perUnitOverhead + (batchMl / 1000) * perLitreOverhead;

  const rawMaterialsCost = oilCostTotal + alcCostTotal + fixCostTotal;
  const totalCostPerUnit = rawMaterialsCost + packagingCost + overheadTotal;
  const totalCostPerMl   = totalCostPerUnit / batchMl;

  // Per-ingredient breakdown
  const ingredientBreakdown = formula.ingredients
    .map((ing) => {
      const amountG     = (ing.pct / 100) * oilMl;          // grams of this material
      const costForBatch = (amountG / 1000) * ing.costPerKg;
      return {
        name:         ing.name,
        section:      ing.section,
        pct:          ing.pct,
        amountG:      parseFloat(amountG.toFixed(3)),
        costPerKg:    ing.costPerKg,
        totalCost:    parseFloat(costForBatch.toFixed(4)),
        costShare:    parseFloat(((costForBatch / rawMaterialsCost) * 100).toFixed(1)),
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);

  const costStructure = [
    { label: "Fragrance Oil",   value: oilCostTotal,    color: "#c9a84c"  },
    { label: "Alcohol",         value: alcCostTotal,    color: "#60a5fa"  },
    { label: "Fixatives",       value: fixCostTotal,    color: "#a78bfa"  },
    { label: "Packaging",       value: packagingCost,   color: "#f472b6"  },
    { label: "Labour & OH",     value: overheadTotal,   color: "#34d399"  },
  ];

  const tiers = pricing.map((p) => ({
    ...p,
    sellingPrice: parseFloat((totalCostPerUnit * p.multiplier).toFixed(2)),
    marginPct:    parseFloat(((1 - 1 / p.multiplier) * 100).toFixed(1)),
    grossProfit:  parseFloat((totalCostPerUnit * (p.multiplier - 1)).toFixed(2)),
  }));

  return {
    oilMl:           parseFloat(oilMl.toFixed(2)),
    alcMl:           parseFloat(alcMl.toFixed(2)),
    fixMl:           parseFloat(fixMl.toFixed(2)),
    oilCostTotal:    parseFloat(oilCostTotal.toFixed(4)),
    alcCostTotal:    parseFloat(alcCostTotal.toFixed(4)),
    fixCostTotal:    parseFloat(fixCostTotal.toFixed(4)),
    overheadTotal:   parseFloat(overheadTotal.toFixed(4)),
    rawMaterialsCost: parseFloat(rawMaterialsCost.toFixed(4)),
    totalCostPerUnit: parseFloat(totalCostPerUnit.toFixed(4)),
    totalCostPerMl:   parseFloat(totalCostPerMl.toFixed(6)),
    oilBlendCostPerKg: parseFloat(oilBlendCostPerKg.toFixed(2)),
    ingredientBreakdown,
    costStructure,
    tiers,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="glass-card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", fontFamily: "Georgia, serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function EditableNumber({ value, onChange, prefix = "", suffix = "", step = 0.1, min = 0 }: {
  value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number; min?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          autoFocus
          type="number"
          step={step}
          min={min}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { onChange(parseFloat(draft) || value); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onChange(parseFloat(draft) || value); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          style={{ width: 72, padding: "3px 6px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 5, color: "#c9a84c", fontSize: 13, fontWeight: 700, outline: "none" }}
        />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{suffix}</span>
      </div>
    );
  }
  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c" }}>{prefix}{value}{suffix}</span>
      <Edit2 size={10} style={{ color: "rgba(255,255,255,0.3)" }} />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CostingContent() {
  const { sym } = useSettings();
  const [activeTab,     setActiveTab]     = useState<"calculator" | "pricing" | "overhead">("calculator");
  const [selectedId,    setSelectedId]    = useState<string>("");
  const [batchMl,       setBatchMl]       = useState(100);
  const [packagingIdx,  setPackagingIdx]  = useState(1);
  const [pricing,       setPricing]       = useState<PricingRule[]>(INIT_PRICING);
  const [overheads,     setOverheads]     = useState<OverheadRate[]>(INIT_OVERHEADS);
  const [editingOh,     setEditingOh]     = useState<string | null>(null);

  // API data
  const [apiFormulas,   setApiFormulas]   = useState<ApiFormula[]>([]);
  const [formulas,      setFormulas]      = useState<FormulaData[]>([]);
  const [loadingList,   setLoadingList]   = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load formula list
  useEffect(() => {
    fetch("/api/formulas")
      .then((r) => r.json())
      .then((data: ApiFormula[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setApiFormulas(data);
        setSelectedId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingList(false));
  }, []);

  // Load ingredients whenever selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    setLoadingDetail(true);
    fetch(`/api/formulas/${selectedId}`)
      .then((r) => r.json())
      .then((data: ApiFormula & { ingredients: ApiIngredient[]; total_fragrance_pct: number }) => {
        const mapped: FormulaData = {
          id: data.id,
          name: data.name,
          type: concentrationLabel(data.concentration_type),
          oilPct: data.total_fragrance_pct ?? 20,
          ingredients: (data.ingredients ?? []).map((i) => ({
            name: i.name,
            section: apiSectionToCosting(i.section),
            pct: i.percentage,
            costPerKg: (i.cost_per_unit ?? 0) * 1000, // cost_per_unit is per gram → convert to per kg
          })),
        };
        setFormulas((prev) => {
          const next = prev.filter((f) => f.id !== mapped.id);
          return [...next, mapped];
        });
      })
      .catch(console.error)
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  const formula = formulas.find((f) => f.id === selectedId);
  const packagingCost = PACKAGING_PRESETS[packagingIdx].value;

  const EMPTY_FORMULA: FormulaData = { id: "", name: "", type: "", oilPct: 20, ingredients: [] };
  const calc = useMemo(
    () => calcCosts(formula ?? EMPTY_FORMULA, batchMl, packagingCost, overheads, pricing),
    [formula, batchMl, packagingCost, overheads, pricing]
  );

  const maxIngCost = calc.ingredientBreakdown.length > 0
    ? Math.max(...calc.ingredientBreakdown.map((i) => i.totalCost))
    : 1;

  const updateMultiplier = (tier: string, value: number) =>
    setPricing((p) => p.map((r) => (r.tier === tier ? { ...r, multiplier: value } : r)));

  const updateOverhead = (id: string, field: keyof OverheadRate, value: string | number) =>
    setOverheads((o) => o.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const removeOverhead = (id: string) =>
    setOverheads((o) => o.filter((r) => r.id !== id));

  const addOverhead = () =>
    setOverheads((o) => [...o, {
      id: `oh${Date.now()}`,
      name: "New Rate",
      type: "per_unit",
      value: 0,
      unit: "/unit",
    }]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", overflow: "hidden" }}>

      {/* ── Top bar ── */}
      <div style={{
        padding: "14px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
        flexWrap: "wrap",
      }}>
        {/* Formula selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FlaskConical size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
          {loadingList ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite", color: "#c9a84c" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Loading formulas…</span>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <select
                className="select-base"
                style={{ width: 240, paddingRight: 32 }}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={apiFormulas.length === 0}
              >
                {apiFormulas.length === 0
                  ? <option value="">No formulas yet</option>
                  : apiFormulas.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({concentrationLabel(f.concentration_type).toUpperCase()})
                      </option>
                    ))
                }
              </select>
              {loadingDetail && (
                <Loader2 size={12} style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", animation: "spin 1s linear infinite", color: "#c9a84c", pointerEvents: "none" }} />
              )}
            </div>
          )}
        </div>

        {/* Batch size */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Batch size</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[10, 30, 50, 100, 250, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => setBatchMl(ml)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: `1px solid ${batchMl === ml ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.08)"}`,
                  background: batchMl === ml ? "rgba(201,168,76,0.12)" : "transparent",
                  color: batchMl === ml ? "#c9a84c" : "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {ml}ml
              </button>
            ))}
          </div>
        </div>

        {/* Packaging */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
          <select
            className="select-base"
            style={{ width: 200 }}
            value={packagingIdx}
            onChange={(e) => setPackagingIdx(Number(e.target.value))}
          >
            {PACKAGING_PRESETS.map((p, i) => (
              <option key={i} value={i}>{p.label} ({sym}{p.value})</option>
            ))}
          </select>
        </div>

        {/* Tab switcher */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: 3 }}>
          {([
            { id: "calculator", label: "Calculator",    icon: Calculator  },
            { id: "pricing",    label: "Pricing Rules", icon: TrendingUp  },
            { id: "overhead",   label: "Overhead",      icon: Settings    },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                border: "none",
                background: activeTab === id ? "rgba(201,168,76,0.15)" : "transparent",
                color: activeTab === id ? "#c9a84c" : "rgba(255,255,255,0.45)",
                fontSize: 12,
                fontWeight: activeTab === id ? 700 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s",
              }}
            >
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

        {/* ══════════ CALCULATOR TAB ══════════ */}
        {activeTab === "calculator" && (
          <>
            {/* Empty state */}
            {!formula && !loadingDetail && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                {apiFormulas.length === 0
                  ? "No formulas in database yet. Create a formula in the Formula Builder first."
                  : "Select a formula above to calculate costs."}
              </div>
            )}
            {loadingDetail && (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "#c9a84c", opacity: 0.6 }} />
              </div>
            )}
            {formula && !loadingDetail && (
            <>
            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              <KpiCard
                label="Total Cost / Unit"
                value={`${sym}${calc.totalCostPerUnit.toFixed(2)}`}
                sub={`for ${batchMl} ml batch`}
                color="#c9a84c"
                icon={DollarSign}
              />
              <KpiCard
                label="Cost / ml"
                value={`${sym}${calc.totalCostPerMl.toFixed(4)}`}
                sub={`raw + OH + packaging`}
                color="#60a5fa"
                icon={FlaskConical}
              />
              <KpiCard
                label="Retail Price"
                value={`${sym}${calc.tiers.find((t) => t.tier === "retail")?.sellingPrice.toFixed(2) ?? "—"}`}
                sub={`${calc.tiers.find((t) => t.tier === "retail")?.marginPct ?? 0}% margin`}
                color="#a78bfa"
                icon={TrendingUp}
              />
              <KpiCard
                label="Oil Blend Cost"
                value={`${sym}${calc.oilBlendCostPerKg.toFixed(2)}/kg`}
                sub={`${formula?.oilPct ?? 0}% oil in final`}
                color="#34d399"
                icon={BarChart2}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>

              {/* Left: ingredient breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Cost structure bar */}
                <div className="glass-card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                    Cost Structure
                  </div>
                  <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", gap: 2, marginBottom: 14 }}>
                    {calc.costStructure.map((seg) => {
                      const pct = (seg.value / calc.totalCostPerUnit) * 100;
                      return (
                        <div
                          key={seg.label}
                          title={`${seg.label}: ${sym}${seg.value.toFixed(2)}`}
                          style={{
                            width: `${pct}%`,
                            background: seg.color + "cc",
                            borderLeft: `3px solid ${seg.color}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: pct > 5 ? undefined : 0,
                            transition: "width 0.4s ease",
                          }}
                        >
                          {pct > 10 && <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{pct.toFixed(0)}%</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                    {calc.costStructure.map((seg) => (
                      <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color }} />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{seg.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>{sym}{seg.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ingredient cost table */}
                <div className="glass-card" style={{ overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>Ingredient Cost Breakdown</span>
                    <span className="badge badge-muted">{calc.ingredientBreakdown.length} materials</span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Section</th>
                          <th style={{ textAlign: "right" }}>In Oil %</th>
                          <th style={{ textAlign: "right" }}>Amount (g)</th>
                          <th style={{ textAlign: "right" }}>{sym}/kg</th>
                          <th style={{ textAlign: "right" }}>Cost</th>
                          <th style={{ textAlign: "right", width: 120 }}>Cost Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calc.ingredientBreakdown.map((ing) => (
                          <tr key={ing.name}>
                            <td style={{ fontWeight: 600, color: "#ffffff" }}>{ing.name}</td>
                            <td>
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                                background: SECTION_COLOR[ing.section] + "22",
                                color: SECTION_COLOR[ing.section],
                                border: `1px solid ${SECTION_COLOR[ing.section]}44`,
                                textTransform: "capitalize",
                              }}>
                                {ing.section}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", color: "#c9a84c", fontWeight: 600 }}>{ing.pct}%</td>
                            <td style={{ textAlign: "right", color: "rgba(255,255,255,0.6)" }}>{ing.amountG}g</td>
                            <td style={{ textAlign: "right", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{sym}{ing.costPerKg}</td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "#ffffff" }}>{sym}{ing.totalCost.toFixed(4)}</td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", width: 60 }}>
                                  <div style={{
                                    width: `${(ing.totalCost / maxIngCost) * 100}%`,
                                    height: "100%",
                                    background: SECTION_COLOR[ing.section],
                                    borderRadius: 99,
                                  }} />
                                </div>
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", width: 36 }}>{ing.costShare}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {/* Totals */}
                        <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)" }}>
                          <td colSpan={5} style={{ fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em" }}>
                            Raw Materials Total
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 800, color: "#c9a84c", fontSize: 14 }}>
                            ${calc.rawMaterialsCost.toFixed(4)}
                          </td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right: pricing tiers + dilution breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Dilution breakdown */}
                <div className="glass-card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                    {batchMl}ml Dilution
                  </div>
                  {[
                    { label: "Fragrance Oil",    ml: calc.oilMl,  cost: calc.oilCostTotal,  color: "#c9a84c" },
                    { label: "Perfumer's Alcohol", ml: calc.alcMl, cost: calc.alcCostTotal,  color: "#60a5fa" },
                    { label: "Fixatives",         ml: calc.fixMl,  cost: calc.fixCostTotal,  color: "#a78bfa" },
                  ].map((row) => (
                    <div key={row.label} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{row.label}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{row.ml} ml</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{sym}{row.cost.toFixed(3)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing tiers */}
                <div className="glass-card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                    Selling Price by Tier
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {calc.tiers.map((tier) => (
                      <div key={tier.tier} style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: `1px solid ${tier.color}30`,
                        background: `${tier.color}08`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: tier.color }}>{tier.label}</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", fontFamily: "Georgia, serif" }}>
                            {sym}{tier.sellingPrice.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                            {tier.multiplier}× cost · {tier.marginPct}% margin
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>
                            +{sym}{tier.grossProfit.toFixed(2)} profit
                          </span>
                        </div>
                        <div className="progress-bar" style={{ marginTop: 8 }}>
                          <div className="progress-fill" style={{ width: `${tier.marginPct}%`, background: tier.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost summary */}
                <div className="glass-card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                    Full Cost Summary
                  </div>
                  {[
                    { label: "Raw materials",       value: calc.rawMaterialsCost, color: "#c9a84c" },
                    { label: "Packaging",           value: packagingCost,          color: "#f472b6" },
                    { label: "Labour & overhead",   value: calc.overheadTotal,     color: "#34d399" },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{sym}{row.value.toFixed(4)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", fontFamily: "Georgia, serif" }}>{sym}{calc.totalCostPerUnit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </>
        )}

        {/* ══════════ PRICING RULES TAB ══════════ */}
        {activeTab === "pricing" && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>Pricing Rules</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                Configure markup multipliers for each pricing tier. The selling price is calculated as <strong style={{ color: "#c9a84c" }}>Total Cost × Multiplier</strong>.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {pricing.map((rule) => (
                <div key={rule.tier} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: rule.color }} />
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>{rule.label} Tier</span>
                    </div>
                    <EditableNumber
                      value={rule.multiplier}
                      onChange={(v) => updateMultiplier(rule.tier, v)}
                      suffix="×"
                      step={0.5}
                      min={1}
                    />
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={rule.tier === "luxury" ? 20 : rule.tier === "retail" ? 10 : 6}
                    step={0.5}
                    value={rule.multiplier}
                    onChange={(e) => updateMultiplier(rule.tier, parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: rule.color, marginBottom: 12 }}
                  />

                  {formulas.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                      {formulas.slice(0, 6).map((f) => {
                        const c = calcCosts(f, 100, PACKAGING_PRESETS[1].value, overheads, pricing);
                        const tier = c.tiers.find((t) => t.tier === rule.tier)!;
                        return (
                          <div key={f.id} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: rule.color }}>{sym}{tier.sellingPrice.toFixed(2)}</div>
                            <div style={{ fontSize: 10, color: "#22c55e" }}>{tier.marginPct}% margin</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ OVERHEAD TAB ══════════ */}
        {activeTab === "overhead" && (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>Labour & Overhead Rates</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  Configure per-unit and per-litre overhead rates applied to every cost calculation.
                </p>
              </div>
              <button className="btn-secondary" onClick={addOverhead}>
                <Plus size={13} /> Add Rate
              </button>
            </div>

            <div className="glass-card" style={{ overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 0 }}>
                {["Rate Name", "Type", "Value", ""].map((h, i) => (
                  <div key={i} style={{ flex: i === 0 ? 2 : i === 3 ? 0 : 1, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>

              {overheads.map((oh) => (
                <div
                  key={oh.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    padding: "12px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Name */}
                  <div style={{ flex: 2 }}>
                    {editingOh === oh.id ? (
                      <input
                        autoFocus
                        className="input-base"
                        style={{ padding: "4px 8px", fontSize: 13 }}
                        value={oh.name}
                        onChange={(e) => updateOverhead(oh.id, "name", e.target.value)}
                        onBlur={() => setEditingOh(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingOh(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingOh(oh.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>{oh.name}</span>
                        <Edit2 size={10} style={{ color: "rgba(255,255,255,0.25)" }} />
                      </button>
                    )}
                  </div>

                  {/* Type */}
                  <div style={{ flex: 1 }}>
                    <select
                      value={oh.type}
                      onChange={(e) => {
                        const unit = e.target.value === "per_unit" ? `${sym}/unit` : `${sym}/litre`;
                        updateOverhead(oh.id, "type", e.target.value);
                        updateOverhead(oh.id, "unit", unit);
                      }}
                      style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", outline: "none" }}
                    >
                      <option value="per_unit">Per unit</option>
                      <option value="per_litre">Per litre</option>
                    </select>
                  </div>

                  {/* Value */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{sym}</span>
                      <input
                        type="number"
                        min={0}
                        step={0.05}
                        value={oh.value}
                        onChange={(e) => updateOverhead(oh.id, "value", parseFloat(e.target.value) || 0)}
                        style={{ width: 72, padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#c9a84c", fontSize: 13, fontWeight: 700, outline: "none", textAlign: "right" }}
                      />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{oh.type === "per_unit" ? "/unit" : "/litre"}</span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeOverhead(oh.id)}
                    className="btn-ghost"
                    style={{ padding: 5, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Total overhead summary */}
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                Overhead Preview — 100ml batch
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {overheads.map((oh) => {
                  const cost = oh.type === "per_unit" ? oh.value : (100 / 1000) * oh.value;
                  return (
                    <div key={oh.id} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{oh.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>{sym}{cost.toFixed(2)}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total overhead</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#c9a84c" }}>
                    {sym}{(
                      overheads.reduce((s, oh) => s + (oh.type === "per_unit" ? oh.value : (100 / 1000) * oh.value), 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
