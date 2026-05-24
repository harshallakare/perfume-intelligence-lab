"use client";

import { useState, useEffect } from "react";
import { Plus, Search, X, Save, ShieldCheck, DollarSign, FlaskConical, GripVertical, ChevronDown, ChevronUp, Sparkles, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { PerfumePyramid } from "./perfume-pyramid";
import { concentrationLabel } from "@/lib/utils";
import { useSettings } from "@/context/settings-context";

interface Ingredient {
  id: string;
  raw_material_id: string;
  material_name: string;
  material_type: string;
  section: "top_note" | "middle_note" | "base_note" | "modifier" | "trace_molecule";
  percentage: number;
  cost_per_unit: number;
  cas_number?: string;
}

interface ApiMaterial {
  id: string;
  name: string;
  material_type: string;
  cas_number?: string;
  cost_per_unit: number;
  odor_family?: string;
  current_stock: number;
}

const SECTION_META = {
  top_note:       { label: "Top Notes",    color: "#60a5fa", cls: "note-top",      desc: "0–30 min" },
  middle_note:    { label: "Middle Notes", color: "#a78bfa", cls: "note-middle",   desc: "30 min – 4 h" },
  base_note:      { label: "Base Notes",   color: "#c9a84c", cls: "note-base",     desc: "4 h+" },
  modifier:       { label: "Modifiers",    color: "#34d399", cls: "note-modifier", desc: "Balance & blend" },
  trace_molecule: { label: "Trace",        color: "rgba(255,255,255,0.3)", cls: "note-trace", desc: "< 0.1%" },
};

const SECTIONS = ["top_note", "middle_note", "base_note", "modifier", "trace_molecule"] as const;

export function FormulaBuilderWorkspace() {
  const router = useRouter();
  const { sym } = useSettings();

  // Formula meta
  const [formulaName, setFormulaName] = useState("");
  const [concentration, setConcentration] = useState("edp");
  const [batchSize, setBatchSize] = useState(100);
  const [olfactoryFamily, setOlfactoryFamily] = useState("");
  const [genderTarget, setGenderTarget] = useState("unisex");

  // Ingredients
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Materials library from API
  const [allMaterials, setAllMaterials] = useState<ApiMaterial[]>([]);
  const [matsLoading, setMatsLoading] = useState(true);

  // UI state
  const [addSection, setAddSection] = useState<typeof SECTIONS[number]>("middle_note");
  const [matSearch, setMatSearch] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  // Load materials from API
  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => setAllMaterials(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setMatsLoading(false));
  }, []);

  // Computed
  const totalPct = ingredients.reduce((s, i) => s + i.percentage, 0);
  const concentrateCostPerMl = ingredients.reduce((s, i) => s + (i.percentage / 100) * i.cost_per_unit, 0);
  const alcoholPct = Math.max(0, 100 - totalPct);
  const isOverLimit = totalPct > 100;

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) =>
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const removeIngredient = (id: string) =>
    setIngredients((prev) => prev.filter((i) => i.id !== id));

  const addIngredient = (mat: ApiMaterial) => {
    // Don't add duplicates
    if (ingredients.some((i) => i.raw_material_id === mat.id)) return;
    setIngredients((prev) => [
      ...prev,
      {
        id: `i${Date.now()}`,
        raw_material_id: mat.id,
        material_name: mat.name,
        material_type: mat.material_type,
        section: addSection,
        percentage: 1.0,
        cost_per_unit: mat.cost_per_unit,
        cas_number: mat.cas_number,
      },
    ]);
    setShowAddPanel(false);
    setMatSearch("");
  };

  const toggleSection = (section: string) =>
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section); else next.add(section);
      return next;
    });

  const filteredMats = allMaterials.filter((m) => {
    if (!matSearch) return true;
    const q = matSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.cas_number ?? "").includes(q) || m.material_type.includes(q);
  });

  const sectionIngredients = (section: typeof SECTIONS[number]) =>
    ingredients.filter((i) => i.section === section);

  const sectionPct = (section: typeof SECTIONS[number]) =>
    sectionIngredients(section).reduce((s, i) => s + i.percentage, 0);

  // Save formula to DB
  const handleSave = async () => {
    if (!formulaName.trim()) { setSaveError("Formula name is required"); return; }
    if (ingredients.length === 0) { setSaveError("Add at least one ingredient"); return; }
    setSaving(true);
    setSaveError("");
    try {
      // 1. Create formula
      const fRes = await fetch("/api/formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formulaName.trim(),
          concentration_type: concentration,
          olfactory_family: olfactoryFamily || null,
          gender_target: genderTarget,
          total_fragrance_pct: parseFloat(totalPct.toFixed(4)),
          cost_per_ml: parseFloat(concentrateCostPerMl.toFixed(6)),
          status: "draft",
        }),
      });
      if (!fRes.ok) throw new Error("Failed to create formula");
      const formula = await fRes.json();

      // 2. Create ingredients in bulk
      await Promise.all(
        ingredients.map((ing) =>
          fetch(`/api/formulas/${formula.id}/ingredients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              raw_material_id: ing.raw_material_id,
              section: ing.section,
              percentage: ing.percentage,
              sort_order: ingredients.indexOf(ing),
            }),
          })
        )
      );

      setSavedId(formula.id);
      setTimeout(() => router.push(`/formulas/${formula.id}`), 1000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 0, flex: 1, height: "calc(100vh - 60px)", overflow: "hidden" }}>

      {/* ====== Left: Formula editor ====== */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Formula meta bar */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
          <input
            className="input-base"
            style={{ flex: 1, maxWidth: 280, fontSize: 14, fontWeight: 600 }}
            placeholder="Formula name…"
            value={formulaName}
            onChange={(e) => setFormulaName(e.target.value)}
          />
          <select className="select-base" style={{ width: 130 }} value={concentration} onChange={(e) => setConcentration(e.target.value)}>
            {["edt", "edp", "parfum", "extrait", "attar", "cologne", "oil_blend"].map((c) => (
              <option key={c} value={c}>{concentrationLabel(c)}</option>
            ))}
          </select>
          <select className="select-base" style={{ width: 100 }} value={genderTarget} onChange={(e) => setGenderTarget(e.target.value)}>
            {["masculine", "feminine", "unisex"].map((g) => <option key={g} value={g} style={{ textTransform: "capitalize" }}>{g}</option>)}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Batch:</span>
            <input type="number" className="input-base" style={{ width: 80 }} value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>ml</span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" style={{ height: 34 }}>
            <ShieldCheck size={13} /> IFRA Check
          </button>
          <button
            className={savedId ? "btn-ghost" : "btn-primary"}
            style={{ height: 34, minWidth: 130, justifyContent: "center" }}
            onClick={handleSave}
            disabled={saving || !!savedId}
          >
            {saving ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> :
             savedId ? <><Check size={13} /> Saved!</> :
             <><Save size={13} /> Save Formula</>}
          </button>
        </div>

        {/* Error bar */}
        {saveError && (
          <div style={{ padding: "8px 24px", background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444", display: "flex", alignItems: "center", gap: 8 }}>
            <X size={13} /> {saveError}
          </div>
        )}

        {/* Total bar */}
        <div style={{ padding: "8px 24px", background: isOverLimit ? "rgba(239,68,68,0.08)" : "rgba(201,168,76,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Fragrance concentrate:</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: isOverLimit ? "#ef4444" : "#c9a84c" }}>{totalPct.toFixed(2)}%</span>
            {isOverLimit && <span style={{ fontSize: 11, color: "#ef4444" }}>⚠ Over 100%</span>}
          </div>
          <div style={{ height: 14, width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Alcohol:</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{alcoholPct.toFixed(2)}%</span>
          </div>
          <div style={{ height: 14, width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DollarSign size={13} style={{ color: "#c9a84c" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Concentrate cost:</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#c9a84c" }}>{sym}{(concentrateCostPerMl * batchSize).toFixed(2)}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>for {batchSize}ml</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: 200 }}>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${Math.min(totalPct, 100)}%`, background: isOverLimit ? "#ef4444" : undefined }} />
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{(100 - totalPct).toFixed(2)}% left</span>
          </div>
        </div>

        {/* Ingredient sections */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          {SECTIONS.map((section) => {
            const meta = SECTION_META[section];
            const ings = sectionIngredients(section);
            const collapsed = collapsedSections.has(section);
            const pct = sectionPct(section);

            return (
              <div key={section} style={{ marginBottom: 14 }}>
                <div className={meta.cls} onClick={() => toggleSection(section)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: collapsed ? 8 : "8px 8px 0 0", background: `${meta.color}08`, cursor: "pointer", userSelect: "none" }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: meta.color, letterSpacing: "0.04em", textTransform: "uppercase" }}>{meta.label}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{meta.desc}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, minWidth: 50, textAlign: "right" }}>{pct.toFixed(2)}%</span>
                  <span className="badge badge-muted" style={{ fontSize: 10 }}>{ings.length}</span>
                  {collapsed ? <ChevronDown size={14} color="rgba(255,255,255,0.4)" /> : <ChevronUp size={14} color="rgba(255,255,255,0.4)" />}
                </div>

                {!collapsed && (
                  <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
                    {ings.length === 0 ? (
                      <div style={{ padding: "16px", fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>Click + to add ingredients</div>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={{ width: 20 }} />
                            {["Material", "CAS", "%", "Grams", "Cost", ""].map((h, i) => (
                              <th key={i} style={{ padding: "7px 10px", textAlign: i >= 2 && i <= 4 ? "right" : "left", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.05)", width: [undefined, undefined, 110, 90, 80, 36][i] }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ings.map((ing) => (
                            <tr key={ing.id}>
                              <td style={{ padding: "8px 4px 8px 8px" }}>
                                <GripVertical size={14} color="rgba(255,255,255,0.2)" style={{ cursor: "grab" }} />
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <div style={{ fontSize: 13, color: "#ffffff", fontWeight: 500 }}>{ing.material_name}</div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1, textTransform: "capitalize" }}>{ing.material_type.replace(/_/g, " ")}</div>
                              </td>
                              <td style={{ padding: "8px 10px", fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.35)" }}>{ing.cas_number || "—"}</td>
                              <td style={{ padding: "8px 10px", textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                                  <input type="number" step="0.01" min="0" max="100" value={ing.percentage}
                                    onChange={(e) => updateIngredient(ing.id, "percentage", parseFloat(e.target.value) || 0)}
                                    style={{ width: 72, padding: "4px 8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: meta.color, fontSize: 13, fontWeight: 700, textAlign: "right", outline: "none" }} />
                                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>%</span>
                                </div>
                              </td>
                              <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{((ing.percentage / 100) * batchSize).toFixed(3)} g</td>
                              <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 12, color: "#c9a84c" }}>{sym}{((ing.percentage / 100) * batchSize * ing.cost_per_unit).toFixed(3)}</td>
                              <td style={{ padding: "8px 8px" }}>
                                <button onClick={() => removeIngredient(ing.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, color: "rgba(255,255,255,0.25)", display: "flex" }}>
                                  <X size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <div style={{ padding: "8px 12px", borderTop: ings.length > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <button className="btn-ghost" style={{ fontSize: 12, color: meta.color, padding: "4px 8px" }} onClick={() => { setAddSection(section); setShowAddPanel(true); }}>
                        <Plus size={12} /> Add {meta.label.replace(" Notes", "").replace("Trace", "trace molecule")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ====== Right panel ====== */}
      <div style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Fragrance Pyramid</div>
          <PerfumePyramid ingredients={ingredients} />
        </div>

        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Note Breakdown</div>
          {SECTIONS.slice(0, 3).map((section) => {
            const meta = SECTION_META[section];
            const pct = sectionPct(section);
            return (
              <div key={section} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: meta.color }}>{meta.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{pct.toFixed(2)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((pct / Math.max(totalPct, 1)) * 100, 100)}%`, background: meta.color }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Cost Summary ({batchSize}ml)</div>
          {[
            { label: "Concentrate", value: `${sym}${(concentrateCostPerMl * batchSize).toFixed(3)}` },
            { label: "Alcohol (est.)", value: `${sym}${(alcoholPct / 100 * batchSize * 0.005).toFixed(3)}` },
            { label: "Cost / ml", value: `${sym}${(concentrateCostPerMl + 0.005 * alcoholPct / 100).toFixed(4)}` },
          ].map((r) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{r.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#c9a84c" }}>{r.value}</span>
            </div>
          ))}
        </div>

        <button className="btn-secondary" style={{ width: "100%", justifyContent: "center", padding: "10px 16px" }}>
          <Sparkles size={14} style={{ color: "#a78bfa" }} /> AI Suggest Improvements
        </button>
      </div>

      {/* ====== Add material panel ====== */}
      {showAddPanel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowAddPanel(false)}>
          <div className="glass-elevated" style={{ width: 520, maxHeight: "72vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
              <FlaskConical size={16} style={{ color: "#c9a84c" }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>Add Ingredient</span>
              <div style={{ flex: 1 }} />
              <select className="select-base" style={{ width: 150 }} value={addSection} onChange={(e) => setAddSection(e.target.value as typeof SECTIONS[number])}>
                {SECTIONS.map((s) => <option key={s} value={s}>{SECTION_META[s].label}</option>)}
              </select>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowAddPanel(false)}><X size={16} /></button>
            </div>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
                <input className="input-base" style={{ paddingLeft: 32 }} placeholder="Search by name or CAS…" value={matSearch} onChange={(e) => setMatSearch(e.target.value)} autoFocus />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
              {matsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                  <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "#c9a84c", opacity: 0.6 }} />
                </div>
              ) : filteredMats.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No materials found</div>
              ) : (
                filteredMats.map((m) => {
                  const already = ingredients.some((i) => i.raw_material_id === m.id);
                  return (
                    <div key={m.id} onClick={() => !already && addIngredient(m)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, cursor: already ? "default" : "pointer", opacity: already ? 0.4 : 1, transition: "background 0.1s" }}
                      onMouseEnter={(e) => { if (!already) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#ffffff", fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, display: "flex", gap: 10 }}>
                          <span style={{ fontFamily: "monospace" }}>{m.cas_number || "—"}</span>
                          <span style={{ textTransform: "capitalize" }}>{m.material_type.replace(/_/g, " ")}</span>
                          {m.odor_family && <span style={{ textTransform: "capitalize", color: "rgba(255,255,255,0.25)" }}>{m.odor_family}</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{m.current_stock}g stock</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#c9a84c" }}>{m.cost_per_unit.toFixed(2)}/g</div>
                      {already ? <Check size={14} color="#22c55e" /> : <Plus size={14} color="rgba(255,255,255,0.4)" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
