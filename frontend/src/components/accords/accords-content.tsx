"use client";

import { useState, useMemo } from "react";
import { useSettings } from "@/context/settings-context";
import {
  Search, Plus, X, FlaskConical, Star, ChevronRight,
  Layers, Sparkles, BookOpen, Lock, Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccordCategory =
  | "all" | "amber" | "leather" | "tobacco" | "marine" | "rose" | "oud"
  | "blue" | "musk" | "vanilla" | "gourmand" | "citrus" | "green"
  | "woody" | "floral" | "spicy" | "custom";

type NoteSection = "top" | "heart" | "base" | "modifier";

interface AccordIngredient {
  name: string;
  percentage: number;
  section: NoteSection;
  casNumber?: string;
}

interface Accord {
  id: string;
  name: string;
  category: Exclude<AccordCategory, "all">;
  description: string;
  isSystem: boolean;
  projection: number;       // 1–10
  longevity: number;        // 1–10
  odorProfile: string;
  recommendedUsagePctMax: number;
  recommendedUsagePctMin: number;
  ingredients: AccordIngredient[];
  costPerGram?: number;
  usedInFormulas?: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SYSTEM_ACCORDS: Accord[] = [
  {
    id: "acc-rose",
    name: "Rose Accord",
    category: "rose",
    description: "A classic, dewy rose heart built from multi-faceted floral chemicals. Clean, rosy with a powdery-waxy depth.",
    isSystem: true,
    projection: 6,
    longevity: 7,
    odorProfile: "Fresh rose petals, powdery, slightly waxy with green facets",
    recommendedUsagePctMin: 5,
    recommendedUsagePctMax: 20,
    costPerGram: 0.18,
    usedInFormulas: 4,
    ingredients: [
      { name: "Phenyl Ethyl Alcohol", percentage: 45, section: "heart", casNumber: "60-12-8" },
      { name: "Geraniol", percentage: 18, section: "heart", casNumber: "106-24-1" },
      { name: "Citronellol", percentage: 15, section: "heart", casNumber: "106-22-9" },
      { name: "Nerol", percentage: 10, section: "heart", casNumber: "106-25-2" },
      { name: "Rose Oxide", percentage: 5, section: "top", casNumber: "16409-43-1" },
      { name: "Beta-Damascenone", percentage: 7, section: "base", casNumber: "23726-91-2" },
    ],
  },
  {
    id: "acc-amber",
    name: "Amber Accord",
    category: "amber",
    description: "A warm, resinous amber base anchoring oriental and gourmand fragrances. Sweet, balsamic and deeply lasting.",
    isSystem: true,
    projection: 7,
    longevity: 9,
    odorProfile: "Warm balsam, resin, sweet vanilla with powdery labdanum depth",
    recommendedUsagePctMin: 8,
    recommendedUsagePctMax: 22,
    costPerGram: 0.22,
    usedInFormulas: 7,
    ingredients: [
      { name: "Benzyl Benzoate", percentage: 30, section: "base", casNumber: "120-51-4" },
      { name: "Ethylene Brassylate", percentage: 25, section: "base", casNumber: "105-95-3" },
      { name: "Labdanum Absolute", percentage: 20, section: "base", casNumber: "68650-44-2" },
      { name: "Vanillin", percentage: 15, section: "base", casNumber: "121-33-5" },
      { name: "ISO E Super", percentage: 10, section: "modifier", casNumber: "54464-57-2" },
    ],
  },
  {
    id: "acc-leather",
    name: "Leather Accord",
    category: "leather",
    description: "A dry, smoky, animalic leather built around birch tar and quinoline. Rugged and distinguished.",
    isSystem: true,
    projection: 8,
    longevity: 9,
    odorProfile: "Dry smoke, leather, birch, slightly animalic with woody undertones",
    recommendedUsagePctMin: 3,
    recommendedUsagePctMax: 12,
    costPerGram: 0.31,
    usedInFormulas: 3,
    ingredients: [
      { name: "ISO E Super", percentage: 30, section: "base", casNumber: "54464-57-2" },
      { name: "Labdanum Absolute", percentage: 22, section: "base", casNumber: "68650-44-2" },
      { name: "Vetiver EO", percentage: 18, section: "base", casNumber: "8016-96-4" },
      { name: "Isobutyl Quinoline", percentage: 12, section: "modifier", casNumber: "1205-02-3" },
      { name: "Birch Tar", percentage: 10, section: "modifier", casNumber: "8001-88-5" },
      { name: "Castoreum Absolute", percentage: 8, section: "base", casNumber: "8023-83-4" },
    ],
  },
  {
    id: "acc-oud",
    name: "Oud Accord",
    category: "oud",
    description: "A rich, complex oud that blends agarwood depth with ISO E Super's cedarwood facets. Opulent and long-lasting.",
    isSystem: true,
    projection: 9,
    longevity: 10,
    odorProfile: "Deep woody, balsamic, barnyard facets, smoky with incense undertones",
    recommendedUsagePctMin: 4,
    recommendedUsagePctMax: 15,
    costPerGram: 0.85,
    usedInFormulas: 5,
    ingredients: [
      { name: "Agarwood EO (Hindi)", percentage: 25, section: "base" },
      { name: "ISO E Super", percentage: 22, section: "modifier", casNumber: "54464-57-2" },
      { name: "Sandalwood (Mysore)", percentage: 18, section: "base" },
      { name: "Vetiver EO", percentage: 15, section: "base", casNumber: "8016-96-4" },
      { name: "Costus Root EO", percentage: 12, section: "modifier" },
      { name: "Guaiacol", percentage: 8, section: "modifier", casNumber: "90-05-1" },
    ],
  },
  {
    id: "acc-marine",
    name: "Marine Accord",
    category: "marine",
    description: "A crisp, ozonic ocean breeze accord using Calone and fresh aldehydic materials. Bright and airy.",
    isSystem: true,
    projection: 7,
    longevity: 4,
    odorProfile: "Ozonic sea air, fresh melon, clean aldehydic with a citrus lift",
    recommendedUsagePctMin: 5,
    recommendedUsagePctMax: 18,
    costPerGram: 0.12,
    usedInFormulas: 2,
    ingredients: [
      { name: "Dihydromyrcenol", percentage: 35, section: "top", casNumber: "18479-58-8" },
      { name: "Hedione HC", percentage: 25, section: "heart", casNumber: "63500-71-0" },
      { name: "Calone 1951", percentage: 15, section: "top", casNumber: "28940-11-6" },
      { name: "Citral", percentage: 15, section: "top", casNumber: "5392-40-5" },
      { name: "Tetrahydrolinalool", percentage: 10, section: "modifier", casNumber: "16999-00-1" },
    ],
  },
  {
    id: "acc-musk",
    name: "White Musk Accord",
    category: "musk",
    description: "A clean, skin-forward white musk blend. Incredibly smooth, radiant on skin and fabric. Perfect base layer.",
    isSystem: true,
    projection: 5,
    longevity: 8,
    odorProfile: "Clean laundry, powdery skin, soft floral musk undertones",
    recommendedUsagePctMin: 5,
    recommendedUsagePctMax: 20,
    costPerGram: 0.14,
    usedInFormulas: 9,
    ingredients: [
      { name: "Galaxolide (50% in IPM)", percentage: 30, section: "base", casNumber: "1222-05-5" },
      { name: "Habanolide", percentage: 25, section: "base", casNumber: "111-12-6" },
      { name: "Ambroxan", percentage: 20, section: "modifier", casNumber: "3238-58-4" },
      { name: "Ethylene Brassylate", percentage: 15, section: "base", casNumber: "105-95-3" },
      { name: "ISO E Super", percentage: 10, section: "modifier", casNumber: "54464-57-2" },
    ],
  },
  {
    id: "acc-tobacco",
    name: "Tobacco Accord",
    category: "tobacco",
    description: "A rich, honeyed tobacco built on coumarin and hay absolute. Warm, slightly sweet, masculine and sophisticated.",
    isSystem: true,
    projection: 7,
    longevity: 8,
    odorProfile: "Sweet tobacco leaf, dried hay, honey, warm coumarin with vanilla",
    recommendedUsagePctMin: 5,
    recommendedUsagePctMax: 15,
    costPerGram: 0.28,
    usedInFormulas: 2,
    ingredients: [
      { name: "Tobacco Absolute", percentage: 28, section: "base" },
      { name: "Coumarin", percentage: 25, section: "base", casNumber: "91-64-5" },
      { name: "Ethyl Vanillin", percentage: 20, section: "base", casNumber: "121-32-4" },
      { name: "Hay Absolute", percentage: 15, section: "heart" },
      { name: "Labdanum Absolute", percentage: 12, section: "base", casNumber: "68650-44-2" },
    ],
  },
  {
    id: "acc-vanilla",
    name: "Vanilla Gourmand",
    category: "vanilla",
    description: "A rich, multi-faceted vanilla blending vanillin, ethyl vanillin and heliotropin. Warm, sweet and universal.",
    isSystem: true,
    projection: 6,
    longevity: 9,
    odorProfile: "Sweet cream, warm vanilla, cherry blossom, powdery almond",
    recommendedUsagePctMin: 5,
    recommendedUsagePctMax: 25,
    costPerGram: 0.09,
    usedInFormulas: 6,
    ingredients: [
      { name: "Vanillin", percentage: 40, section: "base", casNumber: "121-33-5" },
      { name: "Ethyl Vanillin", percentage: 22, section: "base", casNumber: "121-32-4" },
      { name: "Heliotropin (Piperonal)", percentage: 18, section: "heart", casNumber: "120-57-0" },
      { name: "Benzyl Benzoate", percentage: 12, section: "modifier", casNumber: "120-51-4" },
      { name: "Coumarin", percentage: 8, section: "base", casNumber: "91-64-5" },
    ],
  },
  {
    id: "acc-woody",
    name: "Cedarwood Amber",
    category: "woody",
    description: "A dry, warm cedar accord with ambergris facets. Masculine and versatile — works in both oriental and fresh compositions.",
    isSystem: true,
    projection: 8,
    longevity: 9,
    odorProfile: "Dry cedar, pencil shaving, warm amber, faint incense",
    recommendedUsagePctMin: 8,
    recommendedUsagePctMax: 20,
    costPerGram: 0.16,
    usedInFormulas: 3,
    ingredients: [
      { name: "ISO E Super", percentage: 32, section: "base", casNumber: "54464-57-2" },
      { name: "Ambroxan", percentage: 20, section: "modifier", casNumber: "3238-58-4" },
      { name: "Cedarwood (Virginia)", percentage: 25, section: "base", casNumber: "8000-27-9" },
      { name: "Sandalwood (Mysore)", percentage: 15, section: "base" },
      { name: "Vetiver EO", percentage: 8, section: "modifier", casNumber: "8016-96-4" },
    ],
  },
  {
    id: "acc-fougere",
    name: "Fougère Accord",
    category: "green",
    description: "The classical fern-like accord of lavender, oakmoss and coumarin. The backbone of countless masculine fragrances.",
    isSystem: true,
    projection: 7,
    longevity: 7,
    odorProfile: "Lavender, fresh herbs, earthy oakmoss, sweet coumarin",
    recommendedUsagePctMin: 10,
    recommendedUsagePctMax: 30,
    costPerGram: 0.13,
    usedInFormulas: 1,
    ingredients: [
      { name: "Dihydromyrcenol", percentage: 32, section: "top", casNumber: "18479-58-8" },
      { name: "Lavender EO (French)", percentage: 25, section: "top", casNumber: "8000-28-0" },
      { name: "Coumarin", percentage: 20, section: "base", casNumber: "91-64-5" },
      { name: "Geranium EO", percentage: 13, section: "heart", casNumber: "8000-46-2" },
      { name: "Oakmoss Absolute", percentage: 10, section: "base" },
    ],
  },
  {
    id: "acc-spice",
    name: "Spice Market",
    category: "spicy",
    description: "A bold blend of clove, cinnamon and cardamom for adding oriental spice to any composition. Use sparingly.",
    isSystem: true,
    projection: 9,
    longevity: 8,
    odorProfile: "Clove, cinnamon, cardamom, black pepper — warm and aromatic",
    recommendedUsagePctMin: 2,
    recommendedUsagePctMax: 8,
    costPerGram: 0.19,
    usedInFormulas: 2,
    ingredients: [
      { name: "Eugenol (Clove)", percentage: 30, section: "heart", casNumber: "97-53-0" },
      { name: "Cinnamaldehyde", percentage: 25, section: "heart", casNumber: "104-55-2" },
      { name: "Cardamom EO", percentage: 22, section: "top", casNumber: "8000-66-6" },
      { name: "Black Pepper EO", percentage: 15, section: "top", casNumber: "8006-82-4" },
      { name: "Isoeugenol", percentage: 8, section: "modifier", casNumber: "97-54-1" },
    ],
  },
  {
    id: "acc-blue",
    name: "Blue Signature",
    category: "blue",
    description: "A crisp, modern blue masculine — grapefruit over a woody-amber heart. The DNA of contemporary fresh-woody fragrances.",
    isSystem: true,
    projection: 8,
    longevity: 6,
    odorProfile: "Grapefruit, juniper, clean woods, subtle musk",
    recommendedUsagePctMin: 8,
    recommendedUsagePctMax: 22,
    costPerGram: 0.15,
    usedInFormulas: 3,
    ingredients: [
      { name: "Dihydromyrcenol", percentage: 28, section: "top", casNumber: "18479-58-8" },
      { name: "Citrus Blend (Bergamot)", percentage: 22, section: "top" },
      { name: "ISO E Super", percentage: 20, section: "base", casNumber: "54464-57-2" },
      { name: "Hedione HC", percentage: 15, section: "heart", casNumber: "63500-71-0" },
      { name: "Ambroxan", percentage: 15, section: "modifier", casNumber: "3238-58-4" },
    ],
  },
];

const CUSTOM_ACCORDS: Accord[] = [
  {
    id: "acc-house-amber",
    name: "House Amber Base",
    category: "amber",
    description: "Our signature amber base — warmer and more resinous than standard, with added oud facets.",
    isSystem: false,
    projection: 8,
    longevity: 10,
    odorProfile: "Deep amber, resin, subtle oud, warm vanilla with incense depth",
    recommendedUsagePctMin: 6,
    recommendedUsagePctMax: 18,
    costPerGram: 0.34,
    usedInFormulas: 2,
    ingredients: [
      { name: "Labdanum Absolute", percentage: 28, section: "base" },
      { name: "Benzyl Benzoate", percentage: 22, section: "base", casNumber: "120-51-4" },
      { name: "Ethylene Brassylate", percentage: 20, section: "base", casNumber: "105-95-3" },
      { name: "Vanillin", percentage: 15, section: "base", casNumber: "121-33-5" },
      { name: "Agarwood EO", percentage: 10, section: "modifier" },
      { name: "Coumarin", percentage: 5, section: "modifier", casNumber: "91-64-5" },
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS: { id: AccordCategory; label: string; emoji: string }[] = [
  { id: "all",      label: "All",       emoji: "✦" },
  { id: "amber",    label: "Amber",     emoji: "🟠" },
  { id: "leather",  label: "Leather",   emoji: "🤎" },
  { id: "rose",     label: "Rose",      emoji: "🌹" },
  { id: "oud",      label: "Oud",       emoji: "🪵" },
  { id: "musk",     label: "Musk",      emoji: "⚪" },
  { id: "marine",   label: "Marine",    emoji: "🌊" },
  { id: "tobacco",  label: "Tobacco",   emoji: "🍂" },
  { id: "vanilla",  label: "Vanilla",   emoji: "🍦" },
  { id: "woody",    label: "Woody",     emoji: "🌲" },
  { id: "spicy",    label: "Spicy",     emoji: "🌶️" },
  { id: "blue",     label: "Blue",      emoji: "💙" },
  { id: "green",    label: "Green",     emoji: "🌿" },
  { id: "floral",   label: "Floral",    emoji: "🌸" },
  { id: "gourmand", label: "Gourmand",  emoji: "🍫" },
  { id: "citrus",   label: "Citrus",    emoji: "🍋" },
  { id: "custom",   label: "Custom",    emoji: "⚗️" },
];

const SECTION_COLORS: Record<NoteSection, { bg: string; label: string }> = {
  top:      { bg: "#60a5fa", label: "Top" },
  heart:    { bg: "#f472b6", label: "Heart" },
  base:     { bg: "#c9a84c", label: "Base" },
  modifier: { bg: "#a78bfa", label: "Modifier" },
};

const ALL_ACCORDS = [...SYSTEM_ACCORDS, ...CUSTOM_ACCORDS];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RatingDots({ value, max = 10 }: { value: number; max?: number }) {
  const filled = Math.round(value);
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: i < filled ? "#c9a84c" : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const tab = CATEGORY_TABS.find((t) => t.id === category);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        background: "rgba(201,168,76,0.1)",
        border: "1px solid rgba(201,168,76,0.22)",
        color: "#c9a84c",
        textTransform: "capitalize",
      }}
    >
      {tab?.emoji} {category}
    </span>
  );
}

function AccordCard({ accord, selected, onClick, sym }: { accord: Accord; selected: boolean; onClick: () => void; sym: string }) {
  const totalIngredients = accord.ingredients.length;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${selected ? "rgba(201,168,76,0.45)" : "rgba(255,255,255,0.07)"}`,
        background: selected ? "rgba(201,168,76,0.07)" : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "100%",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            {accord.isSystem ? (
              <Star size={10} style={{ color: "#c9a84c", flexShrink: 0 }} />
            ) : (
              <FlaskConical size={10} style={{ color: "#a78bfa", flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{accord.name}</span>
          </div>
          <CategoryBadge category={accord.category} />
        </div>
        <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0, marginTop: 2 }} />
      </div>

      {/* Description preview */}
      <p style={{
        fontSize: 11,
        color: "rgba(255,255,255,0.4)",
        lineHeight: 1.55,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        margin: 0,
      }}>
        {accord.description}
      </p>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>Projection</div>
          <RatingDots value={accord.projection} max={5} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>Longevity</div>
          <RatingDots value={Math.round(accord.longevity / 2)} max={5} />
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
            {totalIngredients} materials
          </div>
          {accord.costPerGram !== undefined && (
            <div style={{ fontSize: 11, color: "#c9a84c", fontWeight: 600 }}>
              {sym}{accord.costPerGram.toFixed(2)}/g
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function AccordDetail({ accord, onClose, onCreateFromThis, sym }: {
  accord: Accord;
  onClose: () => void;
  onCreateFromThis: (a: Accord) => void;
  sym: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyFormula = () => {
    const text = accord.ingredients
      .map((i) => `${i.name}: ${i.percentage}%`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group ingredients by section for the stacked bar
  const bySection: Record<NoteSection, AccordIngredient[]> = { top: [], heart: [], base: [], modifier: [] };
  accord.ingredients.forEach((i) => bySection[i.section].push(i));
  const sectionTotals = Object.entries(bySection).map(([section, items]) => ({
    section: section as NoteSection,
    total: items.reduce((s, i) => s + i.percentage, 0),
    items,
  })).filter((s) => s.total > 0);

  const totalCostPer10g = accord.costPerGram ? accord.costPerGram * 10 : null;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {accord.isSystem ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", color: "#c9a84c" }}>
                <Star size={9} /> SYSTEM
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa" }}>
                <FlaskConical size={9} /> CUSTOM
              </span>
            )}
            <CategoryBadge category={accord.category} />
          </div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>
            {accord.name}
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: 420 }}>
            {accord.description}
          </p>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding: 6, flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>

      {/* Odor profile pill */}
      <div style={{
        padding: "10px 14px",
        borderRadius: 9,
        background: "rgba(201,168,76,0.06)",
        border: "1px solid rgba(201,168,76,0.15)",
        fontSize: 12,
        color: "rgba(255,255,255,0.55)",
        lineHeight: 1.55,
        marginBottom: 18,
        fontStyle: "italic",
      }}>
        <span style={{ color: "#c9a84c", fontWeight: 600, fontStyle: "normal" }}>Odor profile — </span>
        {accord.odorProfile}
      </div>

      {/* Ingredient stacked bar */}
      <div className="glass-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 14 }}>
          Composition ({accord.ingredients.length} materials)
        </div>

        {/* Stacked bar */}
        <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden", gap: 2, marginBottom: 14 }}>
          {sectionTotals.map(({ section, total }) => (
            <div
              key={section}
              style={{
                width: `${total}%`,
                background: SECTION_COLORS[section].bg + "90",
                borderLeft: `3px solid ${SECTION_COLORS[section].bg}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "width 0.3s",
              }}
            >
              {total > 12 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                  {SECTION_COLORS[section].label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Ingredient table */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          {accord.ingredients
            .sort((a, b) => b.percentage - a.percentage)
            .map((ing, i) => (
              <div
                key={ing.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderBottom: i < accord.ingredients.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: SECTION_COLORS[ing.section].bg,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontSize: 12, color: "#ffffff" }}>{ing.name}</span>
                {ing.casNumber && (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                    {ing.casNumber}
                  </span>
                )}
                {/* Mini bar */}
                <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${ing.percentage}%`, height: "100%", background: SECTION_COLORS[ing.section].bg, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#c9a84c", width: 36, textAlign: "right" }}>
                  {ing.percentage}%
                </span>
              </div>
            ))}
        </div>

        {/* Section legend */}
        <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          {sectionTotals.map(({ section }) => (
            <div key={section} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: SECTION_COLORS[section].bg }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{SECTION_COLORS[section].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance + Usage */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        {/* Performance */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 14 }}>
            Performance
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Projection</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>{accord.projection}/10</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${accord.projection * 10}%`, background: accord.projection >= 8 ? "#22c55e" : accord.projection >= 5 ? "#c9a84c" : "#60a5fa" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Longevity</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>{accord.longevity}/10</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${accord.longevity * 10}%`, background: accord.longevity >= 8 ? "#22c55e" : accord.longevity >= 5 ? "#c9a84c" : "#60a5fa" }} />
              </div>
            </div>
            {accord.usedInFormulas !== undefined && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <BookOpen size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Used in <strong style={{ color: "#ffffff" }}>{accord.usedInFormulas}</strong> formula{accord.usedInFormulas !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Usage guidance */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 14 }}>
            Usage Guide
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Recommended % in formula</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#c9a84c" }}>
                {accord.recommendedUsagePctMin}–{accord.recommendedUsagePctMax}%
              </div>
            </div>
            {totalCostPer10g !== null && (
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Est. cost / 10g</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>{sym}{totalCostPer10g.toFixed(2)}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Materials</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>{accord.ingredients.length} ingredients</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
          <FlaskConical size={13} /> Add to Formula Builder
        </button>
        <button className="btn-secondary" onClick={() => onCreateFromThis(accord)}>
          <Layers size={13} /> Create Based On This
        </button>
        <button className="btn-ghost" style={{ padding: "8px 12px" }} onClick={handleCopyFormula}>
          {copied ? <Check size={13} /> : <BookOpen size={13} />}
          {copied ? "Copied" : "Copy Formula"}
        </button>
      </div>
    </div>
  );
}

// ─── Create Accord Modal ──────────────────────────────────────────────────────

interface DraftIngredient {
  id: string;
  name: string;
  percentage: number;
  section: NoteSection;
}

function CreateAccordModal({ prefill, onClose }: { prefill?: Accord; onClose: () => void }) {
  const [name, setName] = useState(prefill ? `${prefill.name} (Copy)` : "");
  const [category, setCategory] = useState<Exclude<AccordCategory, "all">>(prefill?.category ?? "custom");
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [projection, setProjection] = useState(prefill?.projection ?? 5);
  const [longevity, setLongevity] = useState(prefill?.longevity ?? 5);
  const [minUsage, setMinUsage] = useState(prefill?.recommendedUsagePctMin ?? 5);
  const [maxUsage, setMaxUsage] = useState(prefill?.recommendedUsagePctMax ?? 15);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    prefill?.ingredients.map((i, idx) => ({ id: String(idx), name: i.name, percentage: i.percentage, section: i.section })) ?? [
      { id: "1", name: "", percentage: 0, section: "heart" },
    ]
  );

  const totalPct = ingredients.reduce((s, i) => s + (i.percentage || 0), 0);
  const isOver = totalPct > 100;
  const isUnder = totalPct < 99.9;

  const addIngredient = () =>
    setIngredients((p) => [...p, { id: String(Date.now()), name: "", percentage: 0, section: "heart" }]);

  const removeIngredient = (id: string) =>
    setIngredients((p) => p.filter((i) => i.id !== id));

  const updateIngredient = (id: string, key: keyof DraftIngredient, value: string | number) =>
    setIngredients((p) => p.map((i) => (i.id === id ? { ...i, [key]: value } : i)));

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-elevated"
        style={{ width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: 28 }}
      >
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
              {prefill ? "Create Based On This Accord" : "Create Custom Accord"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
              Define ingredients, percentages, and performance targets
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Basic info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6 }}>Accord Name *</label>
            <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. House Rose Accord" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6 }}>Category</label>
            <select className="select-base" value={category} onChange={(e) => setCategory(e.target.value as never)}>
              {CATEGORY_TABS.filter((t) => t.id !== "all").map((t) => (
                <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6 }}>Recommended Usage %</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input className="input-base" type="number" value={minUsage} onChange={(e) => setMinUsage(Number(e.target.value))} style={{ width: 72 }} />
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>–</span>
              <input className="input-base" type="number" value={maxUsage} onChange={(e) => setMaxUsage(Number(e.target.value))} style={{ width: 72 }} />
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>%</span>
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6 }}>Description</label>
            <textarea className="input-base" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the olfactory character of this accord…" style={{ resize: "none" }} />
          </div>
        </div>

        {/* Performance sliders */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
          {[
            { label: "Projection", value: projection, set: setProjection },
            { label: "Longevity",  value: longevity,  set: setLongevity },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{label}</label>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#c9a84c" }}>{value}/10</span>
              </div>
              <input type="range" min={1} max={10} value={value} onChange={(e) => set(Number(e.target.value))} style={{ width: "100%", accentColor: "#c9a84c" }} />
            </div>
          ))}
        </div>

        {/* Ingredients */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.09em", textTransform: "uppercase" }}>
              Ingredients
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isOver ? "#ef4444" : isUnder ? "#eab308" : "#22c55e",
                }}
              >
                {totalPct.toFixed(1)}% {isOver ? "(over 100%)" : isUnder ? `(${(100 - totalPct).toFixed(1)}% remaining)` : "✓"}
              </span>
            </div>
          </div>

          {/* Total bar */}
          <div className="progress-bar" style={{ marginBottom: 12 }}>
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(totalPct, 100)}%`,
                background: isOver ? "#ef4444" : isUnder ? "#eab308" : "#22c55e",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ingredients.map((ing) => (
              <div key={ing.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={ing.section}
                  onChange={(e) => updateIngredient(ing.id, "section", e.target.value)}
                  style={{
                    padding: "6px 8px", borderRadius: 7, background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${SECTION_COLORS[ing.section].bg}40`,
                    color: SECTION_COLORS[ing.section].bg, fontSize: 11, fontWeight: 700,
                    cursor: "pointer", outline: "none", flexShrink: 0, width: 90,
                  }}
                >
                  {(Object.entries(SECTION_COLORS) as [NoteSection, { bg: string; label: string }][]).map(([k, v]) => (
                    <option key={k} value={k} style={{ color: "#fff" }}>{v.label}</option>
                  ))}
                </select>
                <input
                  className="input-base"
                  placeholder="Material name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(ing.id, "name", e.target.value)}
                  style={{ flex: 1, padding: "6px 10px" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <input
                    type="number"
                    className="input-base"
                    min={0}
                    max={100}
                    step={0.5}
                    value={ing.percentage}
                    onChange={(e) => updateIngredient(ing.id, "percentage", parseFloat(e.target.value) || 0)}
                    style={{ width: 68, padding: "6px 8px", textAlign: "right" }}
                  />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>%</span>
                </div>
                <button
                  onClick={() => removeIngredient(ing.id)}
                  className="btn-ghost"
                  style={{ padding: 5, flexShrink: 0, color: "rgba(255,255,255,0.3)" }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <button className="btn-ghost" style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }} onClick={addIngredient}>
            <Plus size={12} /> Add Material
          </button>
        </div>

        {/* Footer actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={!name || ingredients.length === 0 || isOver || totalPct < 50}
            onClick={onClose}
          >
            <Sparkles size={13} /> Save Accord
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AccordsContent() {
  const { sym } = useSettings();
  const [activeCategory, setActiveCategory] = useState<AccordCategory>("all");
  const [search, setSearch] = useState("");
  const [selectedAccord, setSelectedAccord] = useState<Accord | null>(SYSTEM_ACCORDS[0] ?? null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefillAccord, setPrefillAccord] = useState<Accord | undefined>(undefined);

  const filtered = useMemo(() => {
    return ALL_ACCORDS.filter((a) => {
      const matchCat = activeCategory === "all"
        ? true
        : activeCategory === "custom"
        ? !a.isSystem
        : a.category === activeCategory;
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.odorProfile.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const systemFiltered = filtered.filter((a) => a.isSystem);
  const customFiltered = filtered.filter((a) => !a.isSystem);

  const handleCreateFromThis = (a: Accord) => {
    setPrefillAccord(a);
    setShowCreateModal(true);
  };

  return (
    <>
      <div style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden" }}>

        {/* ══ Left panel ══ */}
        <div
          style={{
            width: selectedAccord ? 380 : "100%",
            flexShrink: 0,
            borderRight: selectedAccord ? "1px solid rgba(255,255,255,0.07)" : "none",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "width 0.25s ease",
          }}
        >
          {/* Search + Create */}
          <div style={{ padding: "16px 20px 0", display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
              <input
                className="input-base"
                style={{ paddingLeft: 32 }}
                placeholder="Search accords or odor profile…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="btn-primary"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => { setPrefillAccord(undefined); setShowCreateModal(true); }}
            >
              <Plus size={13} /> Create Accord
            </button>
          </div>

          {/* Category tabs */}
          <div
            style={{
              padding: "12px 20px",
              display: "flex",
              gap: 6,
              overflowX: "auto",
              flexShrink: 0,
              scrollbarWidth: "none",
            }}
          >
            {CATEGORY_TABS.map((tab) => {
              const active = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 99,
                    border: `1px solid ${active ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.08)"}`,
                    background: active ? "rgba(201,168,76,0.12)" : "transparent",
                    color: active ? "#c9a84c" : "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    fontWeight: active ? 700 : 400,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {tab.emoji} {tab.label}
                </button>
              );
            })}
          </div>

          {/* Accord list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                <div>No accords found</div>
              </div>
            ) : (
              <>
                {/* System accords */}
                {systemFiltered.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Star size={11} style={{ color: "#c9a84c" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.09em", textTransform: "uppercase" }}>
                        System Accords
                      </span>
                      <span className="badge badge-muted" style={{ fontSize: 10 }}>{systemFiltered.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {systemFiltered.map((a) => (
                        <AccordCard
                          key={a.id}
                          accord={a}
                          selected={selectedAccord?.id === a.id}
                          onClick={() => setSelectedAccord(a)}
                          sym={sym}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom accords */}
                {customFiltered.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <FlaskConical size={11} style={{ color: "#a78bfa" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.09em", textTransform: "uppercase" }}>
                        Your Accords
                      </span>
                      <span className="badge badge-muted" style={{ fontSize: 10 }}>{customFiltered.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {customFiltered.map((a) => (
                        <AccordCard
                          key={a.id}
                          accord={a}
                          selected={selectedAccord?.id === a.id}
                          onClick={() => setSelectedAccord(a)}
                          sym={sym}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ══ Right panel — Detail ══ */}
        {selectedAccord && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <AccordDetail
              accord={selectedAccord}
              onClose={() => setSelectedAccord(null)}
              onCreateFromThis={handleCreateFromThis}
              sym={sym}
            />
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateAccordModal
          prefill={prefillAccord}
          onClose={() => { setShowCreateModal(false); setPrefillAccord(undefined); }}
        />
      )}
    </>
  );
}
