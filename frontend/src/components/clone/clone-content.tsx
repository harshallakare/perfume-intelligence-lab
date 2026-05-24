"use client";

import { useState, useMemo } from "react";
import { FlaskConical, Clock, Star, CheckCircle2, Droplets, Wind, Sparkles } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PerfumeType = "edt" | "edp" | "parfum" | "elixir" | "attar";
type Goal = "projection" | "longevity" | "smooth_drydown" | "skin_friendly" | "rich_character" | "freshness";

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
  const [quantity, setQuantity] = useState<number>(100);
  const [customQty, setCustomQty] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [perfumeType, setPerfumeType] = useState<PerfumeType>("edp");
  const [goals, setGoals] = useState<Goal[]>([]);

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
