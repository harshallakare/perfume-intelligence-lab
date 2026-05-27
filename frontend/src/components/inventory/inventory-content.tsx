"use client";

import { useState, useEffect } from "react";
import {
  Search, Plus, Download, AlertTriangle, Package,
  ArrowUpDown, Eye, Edit2, Trash2, X, Check, FlaskConical,
} from "lucide-react";
import { stockStatus, stockBadgeClass, stockLabel, materialTypeLabel, formatNumber } from "@/lib/utils";
import { useSettings } from "@/context/settings-context";
import type { RawMaterial, MaterialType, OdorFamily } from "@/types";
import { exportCsv, printHtml, buildHtmlTable } from "@/lib/export";

/* ─── Static options ─────────────────────────────────────────────────── */
const MATERIAL_TYPE_OPTIONS: MaterialType[] = [
  "aroma_chemical","essential_oil","absolute","natural_extract",
  "fixative","musk","alcohol","dpg","ipm","aldehyde","perfume_base","solvent","other",
];
const ODOR_FAMILY_OPTIONS: OdorFamily[] = [
  "floral","oriental","woody","fresh","citrus","aquatic","gourmand",
  "fougere","chypre","leather","tobacco","musk","animalic","green",
  "herbal","spicy","amber","powdery","fruity",
];
const VOLATILITY_OPTIONS = [
  { value: "T", label: "Top Note (T)" },
  { value: "M", label: "Mid Note (M)" },
  { value: "B", label: "Base Note (B)" },
];
const UOM_OPTIONS = ["g", "kg", "ml", "L", "oz"];

const MATERIAL_TYPE_FILTER = ["All Types", ...MATERIAL_TYPE_OPTIONS];
const VOLATILITY_FILTER    = ["All", "T", "M", "B"];

/* ─── Seed data ──────────────────────────────────────────────────────── */
const SEED: RawMaterial[] = [
  { id:"1", organization_id:"o1", name:"ISO E Super",           cas_number:"54464-57-2",  material_type:"aroma_chemical", odor_family:"woody",   odor_intensity:8,  volatility_class:"M", purity_percentage:99.5, current_stock:2450, minimum_stock:500,  unit_of_measure:"g", cost_per_unit:0.08,  currency:"USD", is_natural:false, is_allergen:false, is_restricted:false, ifra_restricted:false, supplier_name:"IFF",           created_at:"", updated_at:"" },
  { id:"2", organization_id:"o1", name:"Ambroxan",               cas_number:"3238-14-4",   material_type:"aroma_chemical", odor_family:"amber",   odor_intensity:7,  volatility_class:"B", purity_percentage:99.0, current_stock:12,   minimum_stock:50,   unit_of_measure:"g", cost_per_unit:2.40,  currency:"USD", is_natural:false, is_allergen:false, is_restricted:false, ifra_restricted:false, supplier_name:"Symrise",       created_at:"", updated_at:"" },
  { id:"3", organization_id:"o1", name:"Rose Absolute (Bulgaria)", cas_number:"8007-01-0", material_type:"absolute",       odor_family:"floral",  odor_intensity:9,  volatility_class:"M", purity_percentage:100,  current_stock:8,    minimum_stock:25,   unit_of_measure:"g", cost_per_unit:18.50, currency:"USD", is_natural:true,  is_allergen:true,  is_restricted:false, ifra_restricted:true,  supplier_name:"Elan Natural",  created_at:"", updated_at:"" },
  { id:"4", organization_id:"o1", name:"Hedione HC",             cas_number:"24851-98-7",  material_type:"aroma_chemical", odor_family:"floral",  odor_intensity:4,  volatility_class:"M", purity_percentage:99.0, current_stock:1800, minimum_stock:200,  unit_of_measure:"g", cost_per_unit:0.35,  currency:"USD", is_natural:false, is_allergen:false, is_restricted:false, ifra_restricted:false, supplier_name:"Givaudan",      created_at:"", updated_at:"" },
  { id:"5", organization_id:"o1", name:"Vetiver Essential Oil",  cas_number:"8016-96-4",   material_type:"essential_oil",  odor_family:"woody",   odor_intensity:7,  volatility_class:"B", purity_percentage:100,  current_stock:45,   minimum_stock:100,  unit_of_measure:"g", cost_per_unit:3.20,  currency:"USD", is_natural:true,  is_allergen:false, is_restricted:false, ifra_restricted:false, supplier_name:"Bontoux",       created_at:"", updated_at:"" },
  { id:"6", organization_id:"o1", name:"Dihydromyrcenol",        cas_number:"18479-58-8",  material_type:"aroma_chemical", odor_family:"fresh",   odor_intensity:8,  volatility_class:"T", purity_percentage:99.5, current_stock:3200, minimum_stock:300,  unit_of_measure:"g", cost_per_unit:0.12,  currency:"USD", is_natural:false, is_allergen:false, is_restricted:false, ifra_restricted:false, supplier_name:"Firmenich",     created_at:"", updated_at:"" },
  { id:"7", organization_id:"o1", name:"Iris Butter",            cas_number:"90028-63-0",  material_type:"absolute",       odor_family:"powdery", odor_intensity:8,  volatility_class:"M", purity_percentage:100,  current_stock:3,    minimum_stock:15,   unit_of_measure:"g", cost_per_unit:85.00, currency:"USD", is_natural:true,  is_allergen:false, is_restricted:false, ifra_restricted:false, supplier_name:"Robertet",      created_at:"", updated_at:"" },
  { id:"8", organization_id:"o1", name:"Ethylene Brassylate",    cas_number:"105-95-3",    material_type:"musk",           odor_family:"musk",    odor_intensity:6,  volatility_class:"B", purity_percentage:99.0, current_stock:870,  minimum_stock:150,  unit_of_measure:"g", cost_per_unit:0.55,  currency:"USD", is_natural:false, is_allergen:false, is_restricted:false, ifra_restricted:false, supplier_name:"IFF",           created_at:"", updated_at:"" },
  { id:"9", organization_id:"o1", name:"Linalool (Synthetic)",   cas_number:"78-70-6",     material_type:"aroma_chemical", odor_family:"floral",  odor_intensity:6,  volatility_class:"T", purity_percentage:99.5, current_stock:4100, minimum_stock:500,  unit_of_measure:"g", cost_per_unit:0.09,  currency:"USD", is_natural:false, is_allergen:true,  is_restricted:false, ifra_restricted:true,  supplier_name:"Givaudan",      created_at:"", updated_at:"" },
  { id:"10",organization_id:"o1", name:"Oud Absolute (Bangladesh)", cas_number:"",        material_type:"absolute",       odor_family:"woody",   odor_intensity:10, volatility_class:"B", purity_percentage:100,  current_stock:22,   minimum_stock:10,   unit_of_measure:"g", cost_per_unit:120.00,currency:"USD", is_natural:true,  is_allergen:false, is_restricted:false, ifra_restricted:false, supplier_name:"Arabian Oud",   created_at:"", updated_at:"" },
];

/* ─── Blank form helper ──────────────────────────────────────────────── */
function blankForm() {
  return {
    name: "", cas_number: "", material_type: "aroma_chemical" as MaterialType,
    odor_family: "floral" as OdorFamily, odor_description: "",
    odor_intensity: 5, volatility_class: "M" as "T"|"M"|"B",
    purity_percentage: 100, current_stock: 0, minimum_stock: 0,
    unit_of_measure: "g", cost_per_unit: 0, supplier_name: "",
    storage_conditions: "", is_natural: false, is_allergen: false,
    is_restricted: false, ifra_restricted: false,
  };
}
type FormState = ReturnType<typeof blankForm>;

/* ─── Toggle chip ────────────────────────────────────────────────────── */
function ToggleChip({ label, value, onChange, color = "#c9a84c" }: {
  label: string; value: boolean; onChange: (v: boolean) => void; color?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 99, cursor: "pointer",
        border: `1px solid ${value ? color + "55" : "rgba(255,255,255,0.1)"}`,
        background: value ? color + "15" : "rgba(255,255,255,0.03)",
        color: value ? color : "rgba(255,255,255,0.4)",
        fontSize: 12, fontWeight: value ? 600 : 400,
        transition: "all 0.15s",
      }}
    >
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: value ? color : "rgba(255,255,255,0.2)",
      }} />
      {label}
    </button>
  );
}

/* ─── Field label helper ─────────────────────────────────────────────── */
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 5 }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
        {hint && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: 6 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ─── Add / Edit modal ───────────────────────────────────────────────── */
function MaterialModal({
  initial, onSave, onClose,
}: {
  initial?: RawMaterial;
  onSave: (m: FormState) => void;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const { sym } = useSettings();
  const [tab, setTab] = useState<"basic"|"stock"|"properties">("basic");
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          name: initial.name, cas_number: initial.cas_number ?? "",
          material_type: initial.material_type, odor_family: initial.odor_family ?? "floral",
          odor_description: initial.odor_description ?? "",
          odor_intensity: initial.odor_intensity ?? 5,
          volatility_class: initial.volatility_class ?? "M",
          purity_percentage: initial.purity_percentage ?? 100,
          current_stock: initial.current_stock, minimum_stock: initial.minimum_stock,
          unit_of_measure: initial.unit_of_measure, cost_per_unit: initial.cost_per_unit,
          supplier_name: initial.supplier_name ?? "",
          storage_conditions: initial.storage_conditions ?? "",
          is_natural: initial.is_natural, is_allergen: initial.is_allergen,
          is_restricted: initial.is_restricted, ifra_restricted: initial.ifra_restricted,
        }
      : blankForm()
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.current_stock < 0) e.current_stock = "Cannot be negative";
    if (form.minimum_stock < 0) e.minimum_stock = "Cannot be negative";
    if (form.cost_per_unit < 0) e.cost_per_unit = "Cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };

  const TABS = [
    { id: "basic",      label: "Basic Info"   },
    { id: "stock",      label: "Stock & Cost" },
    { id: "properties", label: "Properties"   },
  ] as const;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div
        className="glass-elevated"
        style={{ width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#c9a84c22,#c9a84c44)",
              border: "1px solid rgba(201,168,76,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FlaskConical size={15} color="#c9a84c" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {isEdit ? "Edit Material" : "Add New Material"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                {isEdit ? `Editing: ${initial!.name}` : "Fill in the details below"}
              </div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 2, padding: "12px 24px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "7px 16px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
                background: tab === t.id ? "rgba(201,168,76,0.1)" : "transparent",
                color: tab === t.id ? "#c9a84c" : "rgba(255,255,255,0.4)",
                fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
                borderBottom: tab === t.id ? "2px solid #c9a84c" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* ── BASIC INFO ── */}
          {tab === "basic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Material Name" required>
                <input
                  className="input-base"
                  placeholder="e.g. Rose Absolute (Bulgaria)"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  style={errors.name ? { borderColor: "#ef4444" } : {}}
                  autoFocus
                />
                {errors.name && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{errors.name}</div>}
              </Field>

              <Field label="CAS Number" hint="optional">
                <input
                  className="input-base"
                  placeholder="e.g. 8007-01-0"
                  value={form.cas_number}
                  onChange={e => set("cas_number", e.target.value)}
                  style={{ fontFamily: "monospace" }}
                />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Material Type" required>
                  <select className="select-base" value={form.material_type}
                    onChange={e => set("material_type", e.target.value as MaterialType)}>
                    {MATERIAL_TYPE_OPTIONS.map(t => (
                      <option key={t} value={t}>{materialTypeLabel(t)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Odor Family">
                  <select className="select-base" value={form.odor_family}
                    onChange={e => set("odor_family", e.target.value as OdorFamily)}>
                    {ODOR_FAMILY_OPTIONS.map(f => (
                      <option key={f} value={f} style={{ textTransform: "capitalize" }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Odor Description" hint="optional">
                <textarea
                  className="input-base"
                  rows={2}
                  placeholder="Describe the scent profile…"
                  value={form.odor_description}
                  onChange={e => set("odor_description", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </Field>

              <Field label="Supplier Name" hint="optional">
                <input
                  className="input-base"
                  placeholder="e.g. Givaudan, IFF, Symrise…"
                  value={form.supplier_name}
                  onChange={e => set("supplier_name", e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* ── STOCK & COST ── */}
          {tab === "stock" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 12 }}>
                <Field label="Current Stock" required>
                  <input
                    className="input-base"
                    type="number"
                    min={0}
                    step={1}
                    value={form.current_stock}
                    onChange={e => set("current_stock", parseFloat(e.target.value) || 0)}
                    style={errors.current_stock ? { borderColor: "#ef4444" } : {}}
                  />
                  {errors.current_stock && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{errors.current_stock}</div>}
                </Field>
                <Field label="Minimum Stock" hint="reorder threshold">
                  <input
                    className="input-base"
                    type="number"
                    min={0}
                    step={1}
                    value={form.minimum_stock}
                    onChange={e => set("minimum_stock", parseFloat(e.target.value) || 0)}
                  />
                </Field>
                <Field label="Unit">
                  <select className="select-base" value={form.unit_of_measure}
                    onChange={e => set("unit_of_measure", e.target.value)}>
                    {UOM_OPTIONS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </Field>
              </div>

              <Field label={`Cost per ${form.unit_of_measure} (${sym})`} required>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    fontSize: 13, color: "rgba(255,255,255,0.4)", pointerEvents: "none",
                  }}>{sym}</span>
                  <input
                    className="input-base"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.cost_per_unit}
                    onChange={e => set("cost_per_unit", parseFloat(e.target.value) || 0)}
                    style={{ paddingLeft: 26, ...(errors.cost_per_unit ? { borderColor: "#ef4444" } : {}) }}
                  />
                </div>
                {errors.cost_per_unit && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{errors.cost_per_unit}</div>}
              </Field>

              {/* Live stock value preview */}
              {form.current_stock > 0 && form.cost_per_unit > 0 && (
                <div style={{
                  padding: "12px 16px", borderRadius: 8,
                  background: "rgba(201,168,76,0.06)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    Stock Value ({form.current_stock} {form.unit_of_measure} × {sym}{form.cost_per_unit})
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#c9a84c", fontFamily: "Georgia, serif" }}>
                    {sym}{(form.current_stock * form.cost_per_unit).toFixed(2)}
                  </span>
                </div>
              )}

              <Field label="Storage Conditions" hint="optional">
                <input
                  className="input-base"
                  placeholder="e.g. Cool, dry place — below 25°C"
                  value={form.storage_conditions}
                  onChange={e => set("storage_conditions", e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* ── PROPERTIES ── */}
          {tab === "properties" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Field label="Volatility / Note Position">
                <div style={{ display: "flex", gap: 8 }}>
                  {VOLATILITY_OPTIONS.map(v => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => set("volatility_class", v.value as "T"|"M"|"B")}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer",
                        background: form.volatility_class === v.value
                          ? (v.value === "T" ? "rgba(96,165,250,0.15)" : v.value === "M" ? "rgba(167,139,250,0.15)" : "rgba(201,168,76,0.15)")
                          : "rgba(255,255,255,0.03)",
                        color: form.volatility_class === v.value
                          ? (v.value === "T" ? "#60a5fa" : v.value === "M" ? "#a78bfa" : "#c9a84c")
                          : "rgba(255,255,255,0.4)",
                        border: `1px solid ${form.volatility_class === v.value
                          ? (v.value === "T" ? "rgba(96,165,250,0.4)" : v.value === "M" ? "rgba(167,139,250,0.4)" : "rgba(201,168,76,0.4)")
                          : "rgba(255,255,255,0.08)"}`,
                        fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Odor Intensity" hint="1–10">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="range" min={1} max={10} step={1}
                      value={form.odor_intensity}
                      onChange={e => set("odor_intensity", parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: "#c9a84c" }}
                    />
                    <span style={{
                      width: 28, textAlign: "center", fontSize: 14, fontWeight: 700,
                      color: "#c9a84c", fontFamily: "Georgia, serif",
                    }}>{form.odor_intensity}</span>
                  </div>
                </Field>
                <Field label="Purity %" hint="0–100">
                  <input
                    className="input-base"
                    type="number" min={0} max={100} step={0.1}
                    value={form.purity_percentage}
                    onChange={e => set("purity_percentage", parseFloat(e.target.value) || 0)}
                  />
                </Field>
              </div>

              <Field label="Flags & Restrictions">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  <ToggleChip label="Natural Origin"   value={form.is_natural}      onChange={v => set("is_natural", v)}      color="#22c55e" />
                  <ToggleChip label="Known Allergen"   value={form.is_allergen}     onChange={v => set("is_allergen", v)}     color="#f59e0b" />
                  <ToggleChip label="IFRA Restricted"  value={form.ifra_restricted} onChange={v => set("ifra_restricted", v)} color="#ef4444" />
                  <ToggleChip label="Internally Restricted" value={form.is_restricted} onChange={v => set("is_restricted", v)} color="#a78bfa" />
                </div>
              </Field>

              {/* Summary preview */}
              <div style={{
                padding: "14px 16px", borderRadius: 8,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10,
                  textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  Summary Preview
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { label: form.volatility_class === "T" ? "Top Note" : form.volatility_class === "M" ? "Mid Note" : "Base Note",
                      color: form.volatility_class === "T" ? "#60a5fa" : form.volatility_class === "M" ? "#a78bfa" : "#c9a84c" },
                    ...(form.is_natural      ? [{ label: "Natural",  color: "#22c55e" }] : []),
                    ...(form.is_allergen     ? [{ label: "Allergen", color: "#f59e0b" }] : []),
                    ...(form.ifra_restricted ? [{ label: "IFRA Restricted", color: "#ef4444" }] : []),
                  ].map(t => (
                    <span key={t.label} style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600,
                      background: t.color + "18", border: `1px solid ${t.color}44`, color: t.color,
                    }}>{t.label}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {TABS.map((t, i) => (
              <div key={t.id} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: tab === t.id ? "#c9a84c" : "rgba(255,255,255,0.15)",
                transition: "background 0.2s",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" data-modal-save onClick={handleSave}>
              <Check size={14} /> {isEdit ? "Save Changes" : "Add Material"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── View drawer ────────────────────────────────────────────────────── */
function ViewDrawer({ m, onEdit, onClose }: {
  m: RawMaterial; onEdit: () => void; onClose: () => void;
}) {
  const { sym } = useSettings();
  const status = stockStatus(m.current_stock, m.minimum_stock);
  const noteColor = m.volatility_class === "T" ? "#60a5fa" : m.volatility_class === "M" ? "#a78bfa" : "#c9a84c";
  const noteLabel = m.volatility_class === "T" ? "Top Note" : m.volatility_class === "M" ? "Mid Note" : "Base Note";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
      display: "flex", justifyContent: "flex-end",
    }}>
      <div
        className="glass-elevated"
        style={{ width: 420, height: "100%", display: "flex", flexDirection: "column", borderRadius: "12px 0 0 12px" }}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{m.name}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600,
                  background: noteColor + "18", border: `1px solid ${noteColor}44`, color: noteColor }}>
                  {noteLabel}
                </span>
                <span className={`badge ${stockBadgeClass(status)}`}>{stockLabel(status)}</span>
                {m.is_natural && <span className="badge badge-green">Natural</span>}
                {m.is_allergen && <span className="badge badge-yellow">Allergen</span>}
                {m.ifra_restricted && <span className="badge badge-red">IFRA</span>}
              </div>
            </div>
            <button className="btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* Cost highlight */}
          <div style={{
            padding: "14px 18px", borderRadius: 10, marginBottom: 20,
            background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Cost / {m.unit_of_measure}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#c9a84c", fontFamily: "Georgia, serif" }}>
                {sym}{m.cost_per_unit.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Stock Value</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>
                {sym}{(m.current_stock * m.cost_per_unit).toFixed(0)}
              </div>
            </div>
          </div>

          {/* Stock gauge */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Current Stock</span>
              <span style={{ fontWeight: 700, color: status === "out" ? "#ef4444" : status === "low" ? "#eab308" : "#22c55e" }}>
                {formatNumber(m.current_stock, 0)} / {m.minimum_stock} {m.unit_of_measure} min
              </span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99 }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${Math.min((m.current_stock / (m.minimum_stock * 3)) * 100, 100)}%`,
                background: status === "out" ? "#ef4444" : status === "low" ? "#eab308" : "#22c55e",
                transition: "width 0.5s",
              }} />
            </div>
          </div>

          {/* Details grid */}
          {[
            ["CAS Number",       m.cas_number || "—"],
            ["Material Type",    materialTypeLabel(m.material_type)],
            ["Odor Family",      m.odor_family ? m.odor_family.charAt(0).toUpperCase() + m.odor_family.slice(1) : "—"],
            ["Odor Intensity",   m.odor_intensity ? `${m.odor_intensity} / 10` : "—"],
            ["Purity",           m.purity_percentage != null ? `${m.purity_percentage}%` : "—"],
            ["Supplier",         m.supplier_name || "—"],
            ["Storage",          m.storage_conditions || "—"],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{label}</span>
              <span style={{ fontSize: 13, color: "#fff", fontWeight: 500, fontFamily: label === "CAS Number" ? "monospace" : undefined }}>
                {value}
              </span>
            </div>
          ))}

          {m.odor_description && (
            <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 8,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 5,
                textTransform: "uppercase", letterSpacing: "0.07em" }}>Odor Notes</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontStyle: "italic", lineHeight: 1.5 }}>
                "{m.odor_description}"
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Close</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onEdit}>
            <Edit2 size={13} /> Edit Material
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export function InventoryContent() {
  const { sym } = useSettings();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState("");
  const [typeFilter,      setTypeFilter]      = useState("All Types");
  const [volatilityFilter,setVolatilityFilter]= useState("All");
  const [stockFilter,     setStockFilter]     = useState("All");
  const [sortField,       setSortField]       = useState<"name"|"stock"|"cost">("name");
  const [sortDir,         setSortDir]         = useState<"asc"|"desc">("asc");
  const [addOpen,         setAddOpen]         = useState(false);
  const [editTarget,      setEditTarget]      = useState<RawMaterial | null>(null);
  const [viewTarget,      setViewTarget]      = useState<RawMaterial | null>(null);
  const [deleteTarget,    setDeleteTarget]    = useState<RawMaterial | null>(null);
  const [deleteError,     setDeleteError]     = useState<string | null>(null);
  const [deleteLoading,   setDeleteLoading]   = useState(false);

  // Fetch from DB on mount
  useEffect(() => {
    fetch("/api/materials")
      .then(r => r.json())
      .then(data => setMaterials(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = materials
    .filter(m => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !(m.cas_number ?? "").includes(search)) return false;
      if (typeFilter !== "All Types" && m.material_type !== typeFilter) return false;
      if (volatilityFilter !== "All" && m.volatility_class !== volatilityFilter) return false;
      if (stockFilter === "Low"     && stockStatus(m.current_stock, m.minimum_stock) !== "low")     return false;
      if (stockFilter === "Out"     && stockStatus(m.current_stock, m.minimum_stock) !== "out")     return false;
      if (stockFilter === "Healthy" && stockStatus(m.current_stock, m.minimum_stock) !== "healthy") return false;
      return true;
    })
    .sort((a, b) => {
      const va = sortField === "name" ? a.name : sortField === "stock" ? a.current_stock : a.cost_per_unit;
      const vb = sortField === "name" ? b.name : sortField === "stock" ? b.current_stock : b.cost_per_unit;
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

  const lowCount   = materials.filter(m => stockStatus(m.current_stock, m.minimum_stock) === "low").length;
  const outCount   = materials.filter(m => stockStatus(m.current_stock, m.minimum_stock) === "out").length;
  const totalValue = materials.reduce((s, m) => s + m.current_stock * m.cost_per_unit, 0);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleAdd = async (form: FormState) => {
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: RawMaterial = await res.json();
      setMaterials(ms => [...ms, created]);
      setAddOpen(false);
    } catch (err) {
      console.error("Failed to add material:", err);
    }
  };

  const handleEdit = async (form: FormState) => {
    try {
      const res = await fetch(`/api/materials/${editTarget!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: RawMaterial = await res.json();
      setMaterials(ms => ms.map(m => m.id === updated.id ? updated : m));
      setEditTarget(null);
    } catch (err) {
      console.error("Failed to update material:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/materials/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to delete material" }));
        setDeleteError(body.error ?? "Failed to delete material");
        return;
      }
      setMaterials(ms => ms.filter(m => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError("Failed to delete material. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading inventory…</div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ flex: 1 }}>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Materials",  value: materials.length,                        color: "#c9a84c" },
          { label: "Low Stock",        value: lowCount,                                color: "#eab308" },
          { label: "Out of Stock",     value: outCount,                                color: "#ef4444" },
          { label: "Inventory Value",  value: `${sym}${formatNumber(totalValue, 0)}`,  color: "#60a5fa" },
        ].map(s => (
          <div key={s.label} className="glass-card"
            style={{ padding: "14px 18px", flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 6, height: 36, background: s.color, borderRadius: 99, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "Georgia, serif" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
          <input className="input-base" style={{ paddingLeft: 32 }}
            placeholder="Search materials, CAS…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-base" style={{ width: 160 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {MATERIAL_TYPE_FILTER.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="select-base" style={{ width: 130 }} value={volatilityFilter} onChange={e => setVolatilityFilter(e.target.value)}>
          {VOLATILITY_FILTER.map(v => (
            <option key={v} value={v}>{v === "All" ? "All Notes" : v === "T" ? "Top Note" : v === "M" ? "Mid Note" : "Base Note"}</option>
          ))}
        </select>
        <select className="select-base" style={{ width: 130 }} value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
          {["All","Healthy","Low","Out"].map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button
          className="btn-ghost"
          style={{ height: 36 }}
          onClick={() => exportCsv(
            materials.map((m) => ({
              name: m.name,
              cas: m.cas_number ?? "",
              type: materialTypeLabel(m.material_type),
              odor_family: m.odor_family ?? "",
              current_stock: m.current_stock,
              minimum_stock: m.minimum_stock,
              unit: m.unit_of_measure,
              cost_per_unit: m.cost_per_unit,
              currency: m.currency,
              is_natural: m.is_natural ? "yes" : "no",
              is_allergen: m.is_allergen ? "yes" : "no",
              is_restricted: m.is_restricted ? "yes" : "no",
              ifra_restricted: m.ifra_restricted ? "yes" : "no",
              supplier: m.supplier_name ?? "",
            })),
            "inventory_export"
          )}
        >
          <Download size={13} /> CSV
        </button>
        <button
          className="btn-ghost"
          style={{ height: 36 }}
          onClick={() => {
            const cols = [
              { key: "name", label: "Material" },
              { key: "type", label: "Type" },
              { key: "odor_family", label: "Odor" },
              { key: "stock", label: "Stock" },
              { key: "cost", label: "Cost/Unit" },
              { key: "flags", label: "Flags" },
            ];
            const rows = materials.map((m) => ({
              name: m.name,
              type: materialTypeLabel(m.material_type),
              odor_family: m.odor_family ?? "—",
              stock: `${m.current_stock} ${m.unit_of_measure}`,
              cost: `${m.currency} ${m.cost_per_unit.toFixed(2)}`,
              flags: [m.is_natural && "Natural", m.is_allergen && "Allergen", m.ifra_restricted && "IFRA"].filter(Boolean).join(", ") || "—",
            }));
            printHtml(buildHtmlTable(rows, cols), {
              title: "Raw Materials Inventory",
              subtitle: `${rows.length} materials · Exported ${new Date().toLocaleDateString()}`,
            });
          }}
        >
          <Download size={13} /> PDF
        </button>
        <button className="btn-primary" style={{ height: 36 }} onClick={() => setAddOpen(true)}>
          <Plus size={13} /> Add Material
        </button>
      </div>

      {/* Low-stock banner */}
      {(lowCount > 0 || outCount > 0) && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#fca5a5" }}>
          <AlertTriangle size={14} />
          <span>
            <strong>{outCount} material{outCount !== 1 ? "s" : ""} out of stock</strong> and{" "}
            <strong>{lowCount} below minimum threshold</strong>. Consider placing purchase orders.
          </span>
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="table-base">
          <thead>
            <tr>
              <th>
                <button onClick={() => toggleSort("name")} style={{ display:"flex",alignItems:"center",gap:4,background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:"inherit",fontWeight:"inherit",letterSpacing:"inherit",textTransform:"inherit",padding:0 }}>
                  Material <ArrowUpDown size={10} />
                </button>
              </th>
              <th>CAS #</th><th>Type</th><th>Note</th>
              <th>
                <button onClick={() => toggleSort("stock")} style={{ display:"flex",alignItems:"center",gap:4,background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:"inherit",fontWeight:"inherit",letterSpacing:"inherit",textTransform:"inherit",padding:0 }}>
                  Stock <ArrowUpDown size={10} />
                </button>
              </th>
              <th>Status</th>
              <th>
                <button onClick={() => toggleSort("cost")} style={{ display:"flex",alignItems:"center",gap:4,background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:"inherit",fontWeight:"inherit",letterSpacing:"inherit",textTransform:"inherit",padding:0 }}>
                  Cost/g <ArrowUpDown size={10} />
                </button>
              </th>
              <th>IFRA</th><th>Supplier</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const status = stockStatus(m.current_stock, m.minimum_stock);
              return (
                <tr key={m.id}>
                  <td>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:8,height:8,borderRadius:"50%",flexShrink:0,
                        background: m.volatility_class==="T"?"#60a5fa":m.volatility_class==="M"?"#a78bfa":"#c9a84c" }} />
                      <div>
                        <div style={{ color:"#fff",fontWeight:500,fontSize:13 }}>{m.name}</div>
                        {m.is_allergen && <div style={{ fontSize:10,color:"#f59e0b",marginTop:1 }}>Allergen</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily:"monospace",fontSize:12 }}>{m.cas_number||"—"}</td>
                  <td><span className="badge badge-muted">{materialTypeLabel(m.material_type)}</span></td>
                  <td>
                    {m.volatility_class && (
                      <span className={`badge ${m.volatility_class==="T"?"badge-blue":m.volatility_class==="M"?"badge-purple":"badge-gold"}`}>
                        {m.volatility_class==="T"?"Top":m.volatility_class==="M"?"Mid":"Base"}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ color:status==="out"?"#ef4444":status==="low"?"#eab308":"rgba(255,255,255,0.7)" }}>
                      {formatNumber(m.current_stock,0)} {m.unit_of_measure}
                    </div>
                    <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1 }}>min: {m.minimum_stock}</div>
                  </td>
                  <td><span className={`badge ${stockBadgeClass(status)}`}>{stockLabel(status)}</span></td>
                  <td style={{ color:"#c9a84c",fontWeight:600 }}>{sym}{m.cost_per_unit.toFixed(2)}</td>
                  <td>
                    {m.ifra_restricted
                      ? <span className="badge badge-yellow">Restricted</span>
                      : <span className="badge badge-green">OK</span>}
                  </td>
                  <td style={{ color:"rgba(255,255,255,0.5)",fontSize:12 }}>{m.supplier_name||"—"}</td>
                  <td>
                    <div style={{ display:"flex",gap:4 }}>
                      <button className="btn-ghost" style={{ padding:"4px 8px" }} title="View"
                        onClick={() => setViewTarget(m)}><Eye size={13} /></button>
                      <button className="btn-ghost" style={{ padding:"4px 8px" }} title="Edit"
                        onClick={() => setEditTarget(m)}><Edit2 size={13} /></button>
                      <button className="btn-ghost" style={{ padding:"4px 8px",color:"rgba(239,68,68,0.5)" }} title="Delete"
                        onClick={() => { setDeleteTarget(m); setDeleteError(null); }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ padding:"48px 24px",textAlign:"center",color:"rgba(255,255,255,0.35)" }}>
            <Package size={32} style={{ margin:"0 auto 12px",opacity:0.5 }} />
            <div style={{ fontSize:14 }}>No materials match your filters</div>
          </div>
        )}
      </div>

      <div style={{ marginTop:12,fontSize:12,color:"rgba(255,255,255,0.3)" }}>
        Showing {filtered.length} of {materials.length} materials
      </div>

      {/* Modals */}
      {addOpen && (
        <MaterialModal onSave={handleAdd} onClose={() => setAddOpen(false)} />
      )}
      {editTarget && (
        <MaterialModal
          initial={editTarget}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {viewTarget && !editTarget && (
        <ViewDrawer
          m={viewTarget}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
          onClose={() => setViewTarget(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1100,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}>
          <div className="glass-elevated" style={{ width: "100%", maxWidth: 440 }}>
            {/* Header */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Trash2 size={16} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Delete Material</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>This action cannot be undone</div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "18px 24px" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0 }}>
                Are you sure you want to delete{" "}
                <span style={{ color: "#fff", fontWeight: 600 }}>{deleteTarget.name}</span>?
                {" "}This will permanently remove the material from your inventory.
              </p>

              {deleteError && (
                <div style={{
                  marginTop: 14, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                  display: "flex", alignItems: "flex-start", gap: 8,
                }}>
                  <AlertTriangle size={14} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>{deleteError}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn-secondary"
                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  color: "#ef4444",
                }}
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                <Trash2 size={13} />
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
