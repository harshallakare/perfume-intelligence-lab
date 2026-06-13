"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FlaskConical, Clock, Star, CheckCircle2, Sparkles,
  Layers, Package, Boxes, Check, Square, CheckSquare, Loader2, AlertTriangle,
} from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { normalizedCost } from "@/lib/utils";
import type { PackagingItem, RawMaterial } from "@/types";

// Convert an oil volume (mL) into the quantity to deduct in a material's own unit.
function oilDeductInUnit(ml: number, unit: string, density?: number | null): number {
  const d = density && density > 0 ? density : 0.9; // typical fragrance-oil density
  const u = (unit || "g").toLowerCase();
  if (u === "ml") return ml;
  if (u === "l")  return ml / 1000;
  if (u === "g")  return ml * d;
  if (u === "kg") return (ml * d) / 1000;
  if (u === "oz") return (ml * d) / 28.3495;
  return ml * d;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PerfumeType = "edt" | "edp" | "parfum" | "elixir" | "attar";
type Goal = "projection" | "longevity" | "smooth_drydown" | "skin_friendly" | "rich_character" | "freshness";

type AccordNote = "top" | "heart" | "base";
interface AccordIngredient { name: string; pct: number; note: AccordNote }
interface MasterAccord {
  id: string;
  name: string;
  origin: string;       // attribution / family
  description: string;
  density: number;      // g/mL for weighing
  ingredients: AccordIngredient[];
}

// ─── Master accords (classic perfumer building blocks) ─────────────────────────
// Percentages are of the fragrance-oil concentrate. Interpretations for studio use.
const MASTER_ACCORDS: MasterAccord[] = [
  {
    id: "grojsman",
    name: "Grojsman Accord",
    origin: "Sophia Grojsman · rosy-ionone signature (Trésor / Paris school)",
    description: "The lush, velvety rose-violet over a radiant musky amber that defines Grojsman's masterpieces. Heavy on ionones, Hedione and damascones.",
    density: 0.96,
    ingredients: [
      { name: "Hedione (Methyl Dihydrojasmonate)", pct: 25, note: "heart" },
      { name: "Methyl Ionone Gamma",               pct: 18, note: "heart" },
      { name: "Iso E Super",                        pct: 14, note: "base"  },
      { name: "Galaxolide (50% IPM)",               pct: 12, note: "base"  },
      { name: "Phenyl Ethyl Alcohol",              pct: 10, note: "heart" },
      { name: "Bergamot EO",                        pct:  7, note: "top"   },
      { name: "Vanillin",                           pct:  5, note: "base"  },
      { name: "Damascone Beta",                     pct:  3, note: "heart" },
      { name: "Linalool",                           pct:  4, note: "top"   },
      { name: "Rose Oxide",                         pct:  2, note: "top"   },
    ],
  },
  {
    id: "chypre",
    name: "Classic Chypre Base",
    origin: "Coty Chypre lineage · bergamot–oakmoss–labdanum",
    description: "The timeless mossy-woody chord — sparkling bergamot over an earthy oakmoss, labdanum and patchouli foundation.",
    density: 0.97,
    ingredients: [
      { name: "Bergamot EO",        pct: 28, note: "top"   },
      { name: "Patchouli EO",       pct: 18, note: "base"  },
      { name: "Labdanum Absolute",  pct: 16, note: "base"  },
      { name: "Oakmoss Absolute",   pct: 12, note: "base"  },
      { name: "Iso E Super",        pct: 10, note: "base"  },
      { name: "Geranium EO",        pct:  8, note: "heart" },
      { name: "Coumarin",           pct:  5, note: "base"  },
      { name: "Vetiver EO",         pct:  3, note: "base"  },
    ],
  },
  {
    id: "aldehyde-floral",
    name: "Aldehydic Floral",
    origin: "No.5 school · sparkling aldehyde–rose–jasmine",
    description: "The soapy, effervescent aldehyde lift over an abstract rose-jasmine bouquet and powdery musk — couture femininity.",
    density: 0.95,
    ingredients: [
      { name: "Aldehyde C-11 Undecylenic", pct:  6, note: "top"   },
      { name: "Aldehyde C-12 MNA",         pct:  4, note: "top"   },
      { name: "Hedione",                   pct: 22, note: "heart" },
      { name: "Phenyl Ethyl Alcohol",      pct: 20, note: "heart" },
      { name: "Methyl Ionone Gamma",       pct: 14, note: "heart" },
      { name: "Galaxolide (50% IPM)",      pct: 14, note: "base"  },
      { name: "Ylang Ylang EO",            pct:  8, note: "heart" },
      { name: "Sandalwood (Mysore)",       pct:  7, note: "base"  },
      { name: "Vanillin",                  pct:  5, note: "base"  },
    ],
  },
  {
    id: "ambrox-wood",
    name: "Modern Ambrox Wood",
    origin: "Contemporary niche · Ambroxan–ISO E radiant woods",
    description: "The clean, skin-amplifying ambergris-cedar chord behind modern fresh-woody blockbusters. Huge projection, transparent.",
    density: 0.94,
    ingredients: [
      { name: "Iso E Super",        pct: 35, note: "base"  },
      { name: "Ambroxan",           pct: 22, note: "base"  },
      { name: "Hedione",            pct: 14, note: "heart" },
      { name: "Cedarwood (Virginia)", pct: 10, note: "base" },
      { name: "Norlimbanol",        pct:  6, note: "base"  },
      { name: "Grapefruit EO",      pct:  7, note: "top"   },
      { name: "Pink Pepper EO",     pct:  6, note: "top"   },
    ],
  },
  {
    id: "oriental-amber",
    name: "Oriental Amber Base",
    origin: "Shalimar lineage · vanilla–benzoin–labdanum",
    description: "Warm, balsamic and resinous — a sweet amber of vanilla, benzoin and labdanum with a powdery tonka glow.",
    density: 0.98,
    ingredients: [
      { name: "Vanillin",            pct: 22, note: "base"  },
      { name: "Labdanum Absolute",   pct: 18, note: "base"  },
      { name: "Benzoin Resinoid",    pct: 16, note: "base"  },
      { name: "Coumarin",            pct: 12, note: "base"  },
      { name: "Ethylene Brassylate", pct: 12, note: "base"  },
      { name: "Bergamot EO",         pct:  8, note: "top"   },
      { name: "Tonka Bean Absolute", pct:  7, note: "base"  },
      { name: "Benzyl Benzoate",     pct:  5, note: "base"  },
    ],
  },
];

const NOTE_META: Record<AccordNote, { color: string; label: string }> = {
  top:   { color: "#60a5fa", label: "Top"   },
  heart: { color: "#f472b6", label: "Heart" },
  base:  { color: "#c9a84c", label: "Base"  },
};

interface TypeConfig {
  label: string;
  shortLabel: string;
  oilPct: number;
  fixativePct: number;
  longevityLabel: string;
  projectionLabel: string;
  bestFor: string;
  description: string;
}

interface FixativeOption {
  name: string;
  mlPer100: number;
  benefit: string;
  goals: Goal[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const TYPE_CONFIGS: Record<PerfumeType, TypeConfig> = {
  edt: {
    label: "Eau de Toilette",
    shortLabel: "EDT",
    oilPct: 8,
    fixativePct: 2,
    longevityLabel: "2–4 hrs",
    projectionLabel: "Light",
    bestFor: "Day / Office",
    description: "Light & fresh — ideal for warm weather and daytime",
  },
  edp: {
    label: "Eau de Parfum",
    shortLabel: "EDP",
    oilPct: 18,
    fixativePct: 3,
    longevityLabel: "4–8 hrs",
    projectionLabel: "Moderate",
    bestFor: "Day & Evening",
    description: "Balanced concentration — versatile all-rounder",
  },
  parfum: {
    label: "Parfum / Extrait",
    shortLabel: "Parfum",
    oilPct: 25,
    fixativePct: 4,
    longevityLabel: "8–12 hrs",
    projectionLabel: "Rich",
    bestFor: "Evening / Special",
    description: "High concentration — intense and long-wearing",
  },
  elixir: {
    label: "Elixir",
    shortLabel: "Elixir",
    oilPct: 35,
    fixativePct: 5,
    longevityLabel: "12 hrs+",
    projectionLabel: "Very Rich",
    bestFor: "Statement / Night",
    description: "Ultra-concentrated — powerful skin-hugging experience",
  },
  attar: {
    label: "Attar / Ittar",
    shortLabel: "Attar",
    oilPct: 100,
    fixativePct: 0,
    longevityLabel: "12–24 hrs",
    projectionLabel: "Intimate",
    bestFor: "All Day (Traditional)",
    description: "Alcohol-free pure oil — traditional & deeply lasting",
  },
};

const PRESET_QUANTITIES = [30, 50, 60, 100, 200];

const GOALS_CONFIG: { id: Goal; label: string; emoji: string; description: string }[] = [
  { id: "projection",     label: "High Projection",    emoji: "📡", description: "Strong sillage, noticed from a distance" },
  { id: "longevity",      label: "Long Longevity",     emoji: "⏳", description: "8 h+ wear on skin" },
  { id: "smooth_drydown", label: "Smooth Dry-down",    emoji: "🌊", description: "Creamy, seamless base transition" },
  { id: "skin_friendly",  label: "Skin-Friendly",      emoji: "🤲", description: "Moisturizing and non-irritating" },
  { id: "rich_character", label: "Rich Character",     emoji: "💎", description: "Deep, complex and opulent feel" },
  { id: "freshness",      label: "Freshness Boost",    emoji: "🍃", description: "Brighter, airier top notes" },
];

const ALL_FIXATIVES: FixativeOption[] = [
  { name: "Ambroxan",                  mlPer100: 1.5, benefit: "Skin-amplifying longevity & projection boost",    goals: ["projection", "longevity"] },
  { name: "Hedione HC",                mlPer100: 2.0, benefit: "Jasmine diffusion lift & radiance enhancer",       goals: ["projection", "freshness"] },
  { name: "ISO E Super",               mlPer100: 3.0, benefit: "Woody-cedar sillage amplifier",                   goals: ["projection", "rich_character"] },
  { name: "Ethylene Brassylate",       mlPer100: 1.0, benefit: "Musk longevity & clean dry-down anchor",          goals: ["longevity", "smooth_drydown"] },
  { name: "DPG (Dipropylene Glycol)",  mlPer100: 3.0, benefit: "Smooth carrier — softens & extends dry-down",     goals: ["smooth_drydown", "skin_friendly"] },
  { name: "Benzyl Benzoate",           mlPer100: 1.5, benefit: "Traditional fixative — depth, warmth & longevity", goals: ["longevity", "rich_character"] },
  { name: "IPM (Isopropyl Myristate)", mlPer100: 2.0, benefit: "Skin-conditioning carrier, improves feel",        goals: ["skin_friendly", "smooth_drydown"] },
  { name: "Habanolide",                mlPer100: 1.0, benefit: "White musk bloom — gentle longevity layer",       goals: ["longevity", "freshness"] },
];

const BLENDING_TIPS: Record<PerfumeType, string[]> = {
  edt: [
    "Use high-purity perfumer's alcohol (SDA 40B or cosmetic 95%+) for best clarity and lift.",
    "Add fixatives to alcohol first, swirl to integrate, then add the fragrance oil last.",
    "EDT benefits from a 24 h maceration — the top notes brighten significantly after resting.",
  ],
  edp: [
    "Add fixatives to alcohol first, swirl to integrate, then add the fragrance oil last.",
    "Let the blend macerate 48–72 h before final evaluation. The fragrance opens up substantially.",
    "For best diffusion, apply to warm skin areas — neck, inside wrists, behind knees.",
  ],
  parfum: [
    "Decant into a sealed dark-glass bottle and macerate 5–7 days for full development.",
    "Apply sparingly — parfum concentration means a small amount goes a long way.",
    "Store away from light and heat to prevent oxidation of the high oil content.",
  ],
  elixir: [
    "Allow at least 1 week of maceration — the high oil percentage takes time to fully integrate.",
    "Apply to moisturized skin for maximum longevity and to amplify the base notes.",
    "A dab applicator or stopper bottle works better than a spray for this concentration.",
  ],
  attar: [
    "Attars develop beautifully on warm skin — apply to pulse points: wrists, neck, behind ears.",
    "No maceration required — pure oil is ready immediately, but mellows further over weeks.",
    "Roll-on applicator bottles are ideal for attar. Keep sealed to prevent oxidation.",
  ],
};

// ─── Calculation ──────────────────────────────────────────────────────────────

interface BlendResult {
  oil: number;
  alcohol: number;
  fixativeTotal: number;
  fixatives: (FixativeOption & { ml: number })[];
}

function calcBlend(qty: number, type: PerfumeType, goals: Goal[]): BlendResult {
  if (type === "attar") {
    return { oil: qty, alcohol: 0, fixativeTotal: 0, fixatives: [] };
  }

  const cfg = TYPE_CONFIGS[type];

  // Pick fixatives that match at least one selected goal; cap at 3 for clarity
  let selected = ALL_FIXATIVES.filter((f) => f.goals.some((g) => goals.includes(g)));
  if (selected.length === 0) {
    // Default: DPG as a neutral carrier when no goals set
    selected = [ALL_FIXATIVES.find((f) => f.name === "DPG (Dipropylene Glycol)")!];
  }
  // Limit to 3, prefer those covering the most selected goals
  selected = selected
    .map((f) => ({ ...f, score: f.goals.filter((g) => goals.includes(g)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const fixativeRows = selected.map((f) => ({
    ...f,
    ml: parseFloat((f.mlPer100 * qty / 100).toFixed(2)),
  }));

  const fixativeTotal = parseFloat(fixativeRows.reduce((s, f) => s + f.ml, 0).toFixed(2));
  const oilMl = parseFloat((cfg.oilPct / 100 * qty).toFixed(2));
  const alcoholMl = parseFloat(Math.max(0, qty - oilMl - fixativeTotal).toFixed(2));

  return { oil: oilMl, alcohol: alcoholMl, fixativeTotal, fixatives: fixativeRows };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatTile({ emoji, value, label, color }: { emoji: string; value: string; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
          flexShrink: 0,
        }}
      >
        {emoji}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>{value}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CloneContent() {
  const { sym } = useSettings();
  const [quantity, setQuantity] = useState<number>(100);
  const [customQty, setCustomQty] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [perfumeType, setPerfumeType] = useState<PerfumeType>("edp");
  const [goals, setGoals] = useState<Goal[]>([]);

  // Accord (oil base) selection
  const [accordId, setAccordId] = useState<string | null>(null);
  const accord = MASTER_ACCORDS.find((a) => a.id === accordId) ?? null;

  // Production checklist
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggleCheck = (key: string) => setChecked((p) => ({ ...p, [key]: !p[key] }));

  // Export to stock
  const [packaging, setPackaging] = useState<PackagingItem[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [bottleSku, setBottleSku] = useState<string>("");      // packaging id, or "" for manual
  const [manualBottle, setManualBottle] = useState<number>(10);
  const [oilMaterialId, setOilMaterialId] = useState<string>(""); // raw material id, or "" for manual
  const [oilCostPerMl, setOilCostPerMl] = useState<number>(0); // fragrance-oil cost, for COGS
  const [batchName, setBatchName] = useState("");
  const [committing, setCommitting] = useState(false);
  const [commitMsg, setCommitMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/packaging")
      .then((r) => r.json())
      .then((d) => setPackaging(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/materials")
      .then((r) => r.json())
      .then((d) => setMaterials(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // When an inventory oil is chosen, auto-fill its per-mL cost
  const handleOilMaterialChange = (id: string) => {
    setOilMaterialId(id);
    const mat = materials.find((m) => m.id === id);
    if (mat) {
      const perMl = normalizedCost(mat.cost_per_unit, mat.unit_of_measure, mat.density).perMl;
      if (perMl != null) setOilCostPerMl(parseFloat(perMl.toFixed(4)));
    }
  };

  const effectiveQty = isCustom ? parseFloat(customQty) || 0 : quantity;
  const cfg = TYPE_CONFIGS[perfumeType];
  const blend: BlendResult = useMemo(
    () => calcBlend(effectiveQty, perfumeType, goals),
    [effectiveQty, perfumeType, goals]
  );

  const oilPct      = effectiveQty > 0 ? (blend.oil          / effectiveQty) * 100 : 0;
  const alcoholPct  = effectiveQty > 0 ? (blend.alcohol      / effectiveQty) * 100 : 0;
  const fixPct      = effectiveQty > 0 ? (blend.fixativeTotal / effectiveQty) * 100 : 0;

  const toggleGoal = (g: Goal) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const tips = BLENDING_TIPS[perfumeType];

  // ── Accord scaled to oil volume ──
  const oilGrams = blend.oil * (accord?.density ?? 0.96);
  const accordRows = accord
    ? accord.ingredients.map((ing) => ({
        ...ing,
        ml: parseFloat(((ing.pct / 100) * blend.oil).toFixed(2)),
        g:  parseFloat(((ing.pct / 100) * oilGrams).toFixed(2)),
      }))
    : [];

  // ── Bottle fill / export-to-stock maths ──
  const bottleItems = packaging.filter(
    (p) => ["bottle", "vial", "roller"].includes(p.item_type) && (p.capacity_ml ?? 0) > 0
  );
  const selectedPkg = bottleItems.find((p) => p.id === bottleSku) ?? null;
  const bottleSize  = selectedPkg ? (selectedPkg.capacity_ml ?? 0) : manualBottle;
  const bottlesFilled = bottleSize > 0 ? Math.floor(effectiveQty / bottleSize) : 0;
  const leftoverMl  = bottleSize > 0 ? parseFloat((effectiveQty - bottlesFilled * bottleSize).toFixed(2)) : effectiveQty;
  const stockShort  = selectedPkg ? Math.max(0, bottlesFilled - selectedPkg.current_stock) : 0;
  const bottlesUsable = selectedPkg ? Math.min(bottlesFilled, selectedPkg.current_stock) : bottlesFilled;

  // Checklist rows (alcohol, oil/accord, fixatives)
  const checklistRows: { key: string; label: string; amount: string; color: string }[] = [
    ...(blend.alcohol > 0 ? [{ key: "alcohol", label: "Perfumer's Alcohol", amount: `${blend.alcohol} ml`, color: "#60a5fa" }] : []),
    ...(accord
      ? accordRows.map((r) => ({ key: `acc-${r.name}`, label: r.name, amount: `${r.g} g`, color: NOTE_META[r.note].color }))
      : [{ key: "oil", label: "Fragrance Oil", amount: `${blend.oil} ml`, color: "#c9a84c" }]),
    ...blend.fixatives.map((f) => ({ key: `fix-${f.name}`, label: f.name, amount: `${f.ml} ml`, color: "#a78bfa" })),
  ];
  const doneCount = checklistRows.filter((r) => checked[r.key]).length;

  // ── Oil source (from inventory) ──
  const selectedOilMaterial = materials.find((m) => m.id === oilMaterialId) ?? null;
  const oilDeductQty = selectedOilMaterial
    ? parseFloat(oilDeductInUnit(blend.oil, selectedOilMaterial.unit_of_measure, selectedOilMaterial.density).toFixed(3))
    : 0;
  const oilUnit = selectedOilMaterial?.unit_of_measure ?? "";
  const oilShort = selectedOilMaterial ? oilDeductQty > selectedOilMaterial.current_stock : false;

  // COGS for the committed batch
  const materialCost = parseFloat((blend.oil * oilCostPerMl).toFixed(2));
  const packagingCost = parseFloat((bottlesUsable * (selectedPkg?.unit_price ?? 0)).toFixed(2));
  const batchCostTotal = parseFloat((materialCost + packagingCost).toFixed(2));

  const handleCommit = async () => {
    setCommitting(true); setCommitMsg(null);
    try {
      const res = await fetch("/api/finished-goods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: batchName.trim() || `${cfg.shortLabel} clone · ${effectiveQty}ml · ${new Date().toLocaleDateString()}`,
          perfume_type: perfumeType,
          batch_volume_ml: effectiveQty,
          bottle_size_ml: bottleSize,
          planned_bottles: bottlesFilled,
          bottles_filled: bottlesUsable,
          leftover_ml: leftoverMl,
          oil_ml: blend.oil,
          alcohol_ml: blend.alcohol,
          fixative_ml: blend.fixativeTotal,
          material_cost: materialCost || null,
          packaging_cost: packagingCost || null,
          batch_cost: batchCostTotal || null,
          unit_cost: bottlesUsable > 0 && batchCostTotal > 0 ? parseFloat((batchCostTotal / bottlesUsable).toFixed(2)) : null,
          packaging_id: selectedPkg?.id ?? null,
          oil_material_id: selectedOilMaterial?.id ?? null,
          oil_deduct_qty: oilDeductQty || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to commit");
      // Reflect packaging decrement locally
      if (selectedPkg && data.bottles_used) {
        setPackaging((ps) => ps.map((p) => p.id === selectedPkg.id ? { ...p, current_stock: p.current_stock - data.bottles_used } : p));
      }
      // Reflect oil-material decrement locally
      if (selectedOilMaterial && data.oil_deducted) {
        setMaterials((ms) => ms.map((m) => m.id === selectedOilMaterial.id ? { ...m, current_stock: m.current_stock - data.oil_deducted } : m));
      }
      const oilMsg = selectedOilMaterial && data.oil_deducted ? ` · ${data.oil_deducted}${oilUnit} of ${selectedOilMaterial.name} deducted from inventory` : "";
      setCommitMsg({ type: "ok", text: `Committed ${bottlesUsable} × ${bottleSize}ml bottle${bottlesUsable !== 1 ? "s" : ""} to stock${data.bottles_used ? ` · ${data.bottles_used} bottles deducted from supplies` : ""}${oilMsg}.` });
    } catch (e: any) {
      setCommitMsg({ type: "err", text: e.message });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden" }}>

      {/* ══════════════════════════════════════════
          LEFT PANEL — Configuration
      ══════════════════════════════════════════ */}
      <div
        style={{
          width: 370,
          flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.07)",
          overflowY: "auto",
          padding: "28px 24px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FlaskConical size={20} style={{ color: "#c9a84c" }} />
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
              Blend Calculator
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              Fragrance oil · alcohol · fixative
            </div>
          </div>
        </div>

        {/* ── Step 1: Bottle Size ── */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 11 }}>
            1 · Bottle Size
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {PRESET_QUANTITIES.map((q) => {
              const active = !isCustom && quantity === q;
              return (
                <button
                  key={q}
                  onClick={() => { setQuantity(q); setIsCustom(false); }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: `1px solid ${active ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.1)"}`,
                    background: active ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)",
                    color: active ? "#c9a84c" : "rgba(255,255,255,0.55)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {q} ml
                </button>
              );
            })}
            <button
              onClick={() => setIsCustom(true)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${isCustom ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.1)"}`,
                background: isCustom ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)",
                color: isCustom ? "#c9a84c" : "rgba(255,255,255,0.55)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Custom
            </button>
          </div>
          {isCustom && (
            <input
              className="input-base"
              type="number"
              placeholder="Enter ml (e.g. 75)"
              value={customQty}
              onChange={(e) => setCustomQty(e.target.value)}
              style={{ marginTop: 10, width: "100%" }}
            />
          )}
        </div>

        {/* ── Step 2: Perfume Type ── */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 11 }}>
            2 · Perfume Type
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {(Object.entries(TYPE_CONFIGS) as [PerfumeType, TypeConfig][]).map(([key, c]) => {
              const active = perfumeType === key;
              return (
                <button
                  key={key}
                  onClick={() => setPerfumeType(key)}
                  style={{
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: `1px solid ${active ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.07)"}`,
                    background: active ? "rgba(201,168,76,0.07)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.15s",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#c9a84c" : "#ffffff", marginBottom: 2 }}>
                      {c.label}
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, opacity: 0.55 }}>({c.shortLabel})</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{c.description}</div>
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 10, textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: active ? "#c9a84c" : "rgba(255,255,255,0.35)" }}>
                      {key === "attar" ? "100%" : `${c.oilPct}%`}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>oil</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Step 3: Goals (hidden for attar) ── */}
        {perfumeType !== "attar" && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              3 · Achieve Goals
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginBottom: 11 }}>
              Select what to optimise — fixatives are recommended accordingly
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {GOALS_CONFIG.map((g) => {
                const active = goals.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGoal(g.id)}
                    style={{
                      padding: "9px 13px",
                      borderRadius: 9,
                      border: `1px solid ${active ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)"}`,
                      background: active ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.015)",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{g.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: active ? "#c9a84c" : "#ffffff" }}>{g.label}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{g.description}</div>
                    </div>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        border: `1.5px solid ${active ? "#c9a84c" : "rgba(255,255,255,0.18)"}`,
                        background: active ? "rgba(201,168,76,0.18)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {active && <CheckCircle2 size={11} style={{ color: "#c9a84c" }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 4: Oil Base / Accord ── */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            {perfumeType === "attar" ? "3" : "4"} · Oil Base <span style={{ color: "#c9a84c" }}>(Accord)</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginBottom: 11 }}>
            Build the fragrance oil on a classic perfumer accord — scaled to your oil volume
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <button
              onClick={() => setAccordId(null)}
              style={{
                padding: "9px 13px", borderRadius: 9, textAlign: "left", cursor: "pointer",
                border: `1px solid ${accordId === null ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.07)"}`,
                background: accordId === null ? "rgba(201,168,76,0.07)" : "rgba(255,255,255,0.015)",
                display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
              }}
            >
              <FlaskConical size={15} style={{ color: accordId === null ? "#c9a84c" : "rgba(255,255,255,0.4)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: accordId === null ? "#c9a84c" : "#fff" }}>My Own Oil</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Use a ready fragrance oil — no accord breakdown</div>
              </div>
            </button>
            {MASTER_ACCORDS.map((a) => {
              const active = accordId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAccordId(a.id)}
                  style={{
                    padding: "9px 13px", borderRadius: 9, textAlign: "left", cursor: "pointer",
                    border: `1px solid ${active ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.07)"}`,
                    background: active ? "rgba(201,168,76,0.07)" : "rgba(255,255,255,0.015)",
                    display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
                  }}
                >
                  <Layers size={15} style={{ color: active ? "#c9a84c" : "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: active ? "#c9a84c" : "#fff" }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{a.origin}</div>
                  </div>
                  {active && <CheckCircle2 size={13} style={{ color: "#c9a84c", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Live Results
      ══════════════════════════════════════════ */}
      <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
        {effectiveQty > 0 ? (
          <>
            {/* Result header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#ffffff", marginBottom: 5 }}>
                  {effectiveQty} ml {cfg.label}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  {goals.length > 0
                    ? `Optimised for: ${goals.map((g) => GOALS_CONFIG.find((x) => x.id === g)?.label).join(" · ")}`
                    : "Standard formula blend — add goals to refine fixatives"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                <span className="badge badge-gold">{cfg.shortLabel}</span>
                <span className="badge badge-muted">
                  <Clock size={9} /> {cfg.longevityLabel}
                </span>
              </div>
            </div>

            {/* ── Composition bar ── */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                Composition Breakdown
              </div>

              {/* Stacked bar */}
              <div style={{ display: "flex", height: 40, borderRadius: 10, overflow: "hidden", gap: 2, marginBottom: 16 }}>
                {/* Oil */}
                <div
                  style={{
                    width: `${oilPct}%`,
                    background: "linear-gradient(90deg, #c9a84c, #9b7b2a)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "width 0.35s ease",
                  }}
                >
                  {oilPct > 9 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0a0600" }}>Oil {oilPct.toFixed(0)}%</span>
                  )}
                </div>
                {/* Alcohol */}
                {blend.alcohol > 0 && (
                  <div
                    style={{
                      width: `${alcoholPct}%`,
                      background: "rgba(96,165,250,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "width 0.35s ease",
                    }}
                  >
                    {alcoholPct > 9 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                        Alcohol {alcoholPct.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {/* Fixatives */}
                {blend.fixativeTotal > 0 && (
                  <div
                    style={{
                      width: `${fixPct}%`,
                      background: "rgba(167,139,250,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "width 0.35s ease",
                    }}
                  >
                    {fixPct > 4 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                        Fix {fixPct.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                {[
                  { label: "Fragrance Oil",      ml: blend.oil,           pct: oilPct,     color: "#c9a84c" },
                  ...(blend.alcohol > 0 ? [{ label: "Perfumer's Alcohol", ml: blend.alcohol, pct: alcoholPct, color: "#60a5fa" }] : []),
                  ...(blend.fixativeTotal > 0 ? [{ label: "Fixatives (total)", ml: blend.fixativeTotal, pct: fixPct, color: "#a78bfa" }] : []),
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{item.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#ffffff" }}>{item.ml} ml</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>({item.pct.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Mix recipe + Performance ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>

              {/* Mix recipe */}
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                  Mix Recipe
                </div>
                <div style={{ borderRadius: 9, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>

                  {/* Oil row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "11px 14px",
                      background: "rgba(201,168,76,0.05)",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: "#c9a84c" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>Fragrance Oil</span>
                    </div>
                    <span style={{ fontSize: 17, fontWeight: 800, color: "#c9a84c" }}>{blend.oil} ml</span>
                  </div>

                  {/* Alcohol row */}
                  {blend.alcohol > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "11px 14px",
                        background: "rgba(96,165,250,0.04)",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: "#60a5fa" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>Perfumer&apos;s Alcohol</span>
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 800, color: "#60a5fa" }}>{blend.alcohol} ml</span>
                    </div>
                  )}

                  {/* Fixative rows */}
                  {blend.fixatives.map((f, i) => (
                    <div
                      key={f.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 14px",
                        borderBottom: i < blend.fixatives.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: "#a78bfa" }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{f.name}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>{f.ml} ml</span>
                    </div>
                  ))}

                  {/* Total row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "11px 14px",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Total
                    </span>
                    <span style={{ fontSize: 17, fontWeight: 800, color: "#ffffff" }}>{effectiveQty} ml</span>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                  Expected Performance
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <StatTile emoji="⏳" value={cfg.longevityLabel}      label="Longevity"        color="#60a5fa" />
                  <StatTile emoji="📡" value={cfg.projectionLabel}     label="Projection"       color="#a78bfa" />
                  <StatTile emoji="💧" value={`${oilPct.toFixed(1)}%`} label="Oil concentration" color="#c9a84c" />
                  <StatTile emoji="🌟" value={cfg.bestFor}             label="Best for"         color="#34d399" />
                </div>
              </div>
            </div>

            {/* ── Fixative detail table ── */}
            {blend.fixatives.length > 0 && (
              <div className="glass-card" style={{ overflow: "hidden", marginBottom: 18 }}>
                <div
                  style={{
                    padding: "13px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Sparkles size={14} style={{ color: "#a78bfa" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>Fixative Recommendations</span>
                  <span className="badge badge-muted" style={{ marginLeft: "auto" }}>
                    {blend.fixatives.length} fixative{blend.fixatives.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Fixative</th>
                      <th>Amount</th>
                      <th>Purpose &amp; Benefit</th>
                      <th>Goals Served</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blend.fixatives.map((f) => (
                      <tr key={f.name}>
                        <td style={{ fontWeight: 600, color: "#ffffff" }}>{f.name}</td>
                        <td style={{ color: "#a78bfa", fontWeight: 800, fontSize: 14 }}>{f.ml} ml</td>
                        <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{f.benefit}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {f.goals
                              .filter((g) => goals.includes(g))
                              .map((g) => (
                                <span key={g} className="badge badge-gold" style={{ fontSize: 10, padding: "2px 7px" }}>
                                  {GOALS_CONFIG.find((x) => x.id === g)?.label}
                                </span>
                              ))}
                            {f.goals.filter((g) => goals.includes(g)).length === 0 && (
                              <span className="badge badge-muted" style={{ fontSize: 10 }}>Default</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Blending tips ── */}
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                Blending Tips
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  ...tips,
                  ...(goals.includes("longevity")
                    ? ["For maximum longevity, moisturise skin before applying and never rub — let it dry naturally."]
                    : []),
                  ...(goals.includes("projection")
                    ? ["Apply to hair and clothes for stronger projection; fabric holds fragrance longer than skin."]
                    : []),
                ].map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <Star size={11} style={{ color: "#c9a84c", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Accord breakdown (oil base) ── */}
            {accord && blend.oil > 0 && (
              <div className="glass-card" style={{ overflow: "hidden", marginTop: 18 }}>
                <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
                  <Layers size={14} style={{ color: "#c9a84c" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{accord.name} — Oil Build</span>
                  <span className="badge badge-muted" style={{ marginLeft: "auto" }}>{blend.oil} ml oil ≈ {oilGrams.toFixed(1)} g</span>
                </div>
                <div style={{ padding: "12px 20px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.55, fontStyle: "italic", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {accord.description}
                </div>
                <table className="table-base">
                  <thead>
                    <tr><th>Note</th><th>Material</th><th>%</th><th>Weigh (g)</th><th>Volume (ml)</th></tr>
                  </thead>
                  <tbody>
                    {accordRows.map((r) => (
                      <tr key={r.name}>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: NOTE_META[r.note].color }} />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{NOTE_META[r.note].label}</span>
                          </span>
                        </td>
                        <td style={{ color: "#fff", fontWeight: 500 }}>{r.name}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)" }}>{r.pct}%</td>
                        <td style={{ color: "#c9a84c", fontWeight: 800 }}>{r.g} g</td>
                        <td style={{ color: "rgba(255,255,255,0.6)" }}>{r.ml} ml</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Production checklist ── */}
            <div className="glass-card" style={{ overflow: "hidden", marginTop: 18 }}>
              <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
                <CheckSquare size={14} style={{ color: "#34d399" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Production Checklist</span>
                <span className="badge badge-muted" style={{ marginLeft: "auto" }}>{doneCount} / {checklistRows.length} added</span>
              </div>
              {/* progress */}
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ height: "100%", width: `${checklistRows.length ? (doneCount / checklistRows.length) * 100 : 0}%`, background: doneCount === checklistRows.length ? "#34d399" : "#c9a84c", transition: "width 0.3s" }} />
              </div>
              <div style={{ padding: "8px 12px" }}>
                {checklistRows.map((r) => {
                  const on = !!checked[r.key];
                  return (
                    <button
                      key={r.key}
                      onClick={() => toggleCheck(r.key)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 11,
                        padding: "9px 10px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                        background: on ? "rgba(52,211,153,0.06)" : "transparent",
                        border: "1px solid " + (on ? "rgba(52,211,153,0.18)" : "transparent"),
                        marginBottom: 2, transition: "all 0.12s",
                      }}
                    >
                      {on
                        ? <CheckSquare size={16} style={{ color: "#34d399", flexShrink: 0 }} />
                        : <Square size={16} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />}
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: on ? "rgba(255,255,255,0.5)" : "#fff", textDecoration: on ? "line-through" : "none" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: on ? "rgba(255,255,255,0.4)" : r.color }}>{r.amount}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Export to stock ── */}
            <div className="glass-card" style={{ overflow: "hidden", marginTop: 18, marginBottom: 8 }}>
              <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
                <Boxes size={14} style={{ color: "#60a5fa" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Bottle &amp; Export to Stock</span>
                <span className="badge badge-muted" style={{ marginLeft: "auto" }}>Batch {effectiveQty} ml</span>
              </div>

              <div style={{ padding: 20 }}>
                {/* Bottle picker */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Fill into bottle</div>
                    <select className="select-base" value={bottleSku} onChange={(e) => setBottleSku(e.target.value)}>
                      <option value="">Manual size…</option>
                      {bottleItems.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} · {p.capacity_ml}ml ({p.current_stock} in stock)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Bottle size (ml)</div>
                    <input
                      className="input-base"
                      type="number"
                      min={1}
                      value={bottleSize || ""}
                      disabled={!!selectedPkg}
                      onChange={(e) => setManualBottle(parseFloat(e.target.value) || 0)}
                      style={selectedPkg ? { opacity: 0.5 } : {}}
                    />
                  </div>
                </div>

                {bottleItems.length === 0 && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>
                    Tip: add bottles under <strong style={{ color: "#c9a84c" }}>Packaging &amp; Supplies</strong> to track stock consumption automatically.
                  </div>
                )}

                {/* Yield tiles */}
                {bottleSize > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                    {[
                      { label: "Bottles filled", value: `${bottlesFilled}`, sub: `× ${bottleSize}ml`, color: "#34d399" },
                      { label: "Leftover", value: `${leftoverMl}`, sub: "ml", color: "#eab308" },
                      { label: selectedPkg ? "From stock" : "Bottles needed", value: `${bottlesUsable}`, sub: selectedPkg ? `of ${selectedPkg.current_stock}` : "bottles", color: "#60a5fa" },
                    ].map((t) => (
                      <div key={t.label} style={{ padding: "12px 14px", borderRadius: 10, background: `${t.color}10`, border: `1px solid ${t.color}28` }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: t.color, fontFamily: "Georgia, serif", lineHeight: 1 }}>
                          {t.value}<span style={{ fontSize: 12, fontWeight: 600, marginLeft: 4, opacity: 0.7 }}>{t.sub}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{t.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {stockShort > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, marginBottom: 14, fontSize: 12, color: "#fca5a5" }}>
                    <AlertTriangle size={13} />
                    <span>Short by <strong>{stockShort}</strong> bottle{stockShort !== 1 ? "s" : ""} — only {selectedPkg!.current_stock} in stock. {bottlesUsable} will be committed.</span>
                  </div>
                )}

                {/* Oil source — draw the fragrance oil from inventory (deducts on commit) */}
                {bottleSize > 0 && (
                  <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>
                      Oil source <span style={{ color: "rgba(255,255,255,0.3)" }}>— pick a material to auto-deduct {blend.oil}ml of oil from inventory</span>
                    </div>
                    <select className="select-base" value={oilMaterialId} onChange={(e) => handleOilMaterialChange(e.target.value)}>
                      <option value="">Manual / not tracked in inventory</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} — {m.current_stock}{m.unit_of_measure} in stock</option>
                      ))}
                    </select>
                    {selectedOilMaterial && (
                      <div style={{ marginTop: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 8, color: oilShort ? "#fca5a5" : "rgba(255,255,255,0.55)" }}>
                        {oilShort && <AlertTriangle size={13} />}
                        <span>
                          Will deduct <strong style={{ color: oilShort ? "#fca5a5" : "#c9a84c" }}>{oilDeductQty}{oilUnit}</strong>
                          {" "}from {selectedOilMaterial.name} ({selectedOilMaterial.current_stock}{oilUnit} in stock)
                          {oilShort ? " — insufficient stock, will be capped." : ""}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cost capture (optional) → feeds Products pricing & margins */}
                {bottleSize > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", marginBottom: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Fragrance oil cost ({sym}/mL) <span style={{ color: "rgba(255,255,255,0.3)" }}>{selectedOilMaterial ? "— auto-filled from inventory" : "— optional, for COGS"}</span></div>
                      <input className="input-base" type="number" min={0} step={0.1} value={oilCostPerMl || ""} placeholder="e.g. 4.5" onChange={(e) => setOilCostPerMl(parseFloat(e.target.value) || 0)} style={{ maxWidth: 160 }} />
                    </div>
                    {batchCostTotal > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Batch cost · per bottle</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#c9a84c", fontFamily: "Georgia, serif" }}>
                          {sym}{batchCostTotal.toFixed(2)} · {sym}{bottlesUsable > 0 ? (batchCostTotal / bottlesUsable).toFixed(2) : "0"}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Batch name + commit */}
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Batch name</div>
                    <input
                      className="input-base"
                      placeholder={`${cfg.shortLabel} clone · ${effectiveQty}ml`}
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-primary"
                    disabled={committing || bottleSize <= 0 || bottlesUsable <= 0}
                    onClick={handleCommit}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {committing
                      ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Committing…</>
                      : <><Boxes size={14} /> Commit to Stock</>}
                  </button>
                </div>

                {commitMsg && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px", borderRadius: 8,
                    background: commitMsg.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${commitMsg.type === "ok" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 12, color: commitMsg.type === "ok" ? "#22c55e" : "#fca5a5",
                  }}>
                    {commitMsg.type === "ok" ? <Check size={14} /> : <AlertTriangle size={14} />}
                    {commitMsg.text}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 14,
              opacity: 0.35,
            }}
          >
            <FlaskConical size={52} style={{ color: "#c9a84c" }} />
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
              Select a bottle size to see your blend recipe
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
