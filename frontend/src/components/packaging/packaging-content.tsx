"use client";

import { useState, useEffect } from "react";
import {
  Search, Plus, Package, Edit2, Trash2, X, Check, AlertTriangle, Download,
} from "lucide-react";
import { stockStatus, stockBadgeClass, stockLabel, formatNumber } from "@/lib/utils";
import { useSettings } from "@/context/settings-context";
import type { PackagingItem, PackagingType } from "@/types";
import { exportCsv } from "@/lib/export";

/* ─── Options ────────────────────────────────────────────────────────── */
const TYPE_OPTIONS: { value: PackagingType; label: string; emoji: string; hasCapacity: boolean }[] = [
  { value: "bottle",  label: "Bottle",  emoji: "🫙", hasCapacity: true  },
  { value: "vial",    label: "Vial",    emoji: "🧪", hasCapacity: true  },
  { value: "roller",  label: "Roll-on", emoji: "🎯", hasCapacity: true  },
  { value: "cap",     label: "Cap",     emoji: "🔘", hasCapacity: false },
  { value: "sprayer", label: "Sprayer", emoji: "💨", hasCapacity: false },
  { value: "pump",    label: "Pump",    emoji: "⛽", hasCapacity: false },
  { value: "box",     label: "Box",     emoji: "📦", hasCapacity: false },
  { value: "label",   label: "Label",   emoji: "🏷️", hasCapacity: false },
  { value: "other",   label: "Other",   emoji: "✦",  hasCapacity: false },
];

const typeMeta = (t: string) => TYPE_OPTIONS.find(o => o.value === t) ?? TYPE_OPTIONS[TYPE_OPTIONS.length - 1];

function blankForm() {
  return {
    name: "", item_type: "bottle" as PackagingType, capacity_ml: 0,
    unit_price: 0, current_stock: 0, minimum_stock: 0,
    supplier_name: "", notes: "",
  };
}
type FormState = ReturnType<typeof blankForm>;

/* ─── Field helper ───────────────────────────────────────────────────── */
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
function ItemModal({ initial, onSave, onClose }: {
  initial?: PackagingItem; onSave: (f: FormState) => void; onClose: () => void;
}) {
  const isEdit = !!initial;
  const { sym } = useSettings();
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          name: initial.name, item_type: initial.item_type,
          capacity_ml: initial.capacity_ml ?? 0, unit_price: initial.unit_price,
          current_stock: initial.current_stock, minimum_stock: initial.minimum_stock,
          supplier_name: initial.supplier_name ?? "", notes: initial.notes ?? "",
        }
      : blankForm()
  );
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));
  const meta = typeMeta(form.item_type);

  const handleSave = () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    onSave(form);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div className="glass-elevated" style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#c9a84c22,#c9a84c44)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={15} color="#c9a84c" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{isEdit ? "Edit Supply" : "Add Supply"}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{isEdit ? `Editing: ${initial!.name}` : "Bottles, caps, boxes & more"}</div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Item Name" required>
            <input className="input-base" placeholder="e.g. 10mL Amber Glass Bottle" value={form.name}
              onChange={e => set("name", e.target.value)} autoFocus />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: meta.hasCapacity ? "1fr 1fr" : "1fr", gap: 12 }}>
            <Field label="Type" required>
              <select className="select-base" value={form.item_type} onChange={e => set("item_type", e.target.value as PackagingType)}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
              </select>
            </Field>
            {meta.hasCapacity && (
              <Field label="Capacity (mL)" hint="per unit">
                <input className="input-base" type="number" min={0} step={1} value={form.capacity_ml || ""}
                  placeholder="e.g. 10" onChange={e => set("capacity_ml", parseFloat(e.target.value) || 0)} />
              </Field>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="In Stock" required hint="units">
              <input className="input-base" type="number" min={0} step={1} value={form.current_stock}
                onChange={e => set("current_stock", parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Min Stock" hint="reorder at">
              <input className="input-base" type="number" min={0} step={1} value={form.minimum_stock}
                onChange={e => set("minimum_stock", parseInt(e.target.value) || 0)} />
            </Field>
            <Field label={`Unit Price (${sym})`} required>
              <input className="input-base" type="number" min={0} step={0.01} value={form.unit_price}
                onChange={e => set("unit_price", parseFloat(e.target.value) || 0)} />
            </Field>
          </div>

          {/* Live value preview */}
          {form.current_stock > 0 && form.unit_price > 0 && (
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                Stock Value ({form.current_stock} × {sym}{form.unit_price})
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#c9a84c", fontFamily: "Georgia, serif" }}>
                {sym}{(form.current_stock * form.unit_price).toFixed(2)}
              </span>
            </div>
          )}

          <Field label="Supplier" hint="optional">
            <input className="input-base" placeholder="e.g. Glassmark, Alibaba supplier…" value={form.supplier_name}
              onChange={e => set("supplier_name", e.target.value)} />
          </Field>

          <Field label="Notes" hint="optional">
            <textarea className="input-base" rows={2} placeholder="Colour, thread size, finish…" value={form.notes}
              onChange={e => set("notes", e.target.value)} style={{ resize: "vertical" }} />
          </Field>

          {error && <div style={{ fontSize: 12, color: "#ef4444" }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}><Check size={14} /> {isEdit ? "Save Changes" : "Add Supply"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export function PackagingContent() {
  const { sym } = useSettings();
  const [items, setItems] = useState<PackagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PackagingItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackagingItem | null>(null);

  useEffect(() => {
    fetch("/api/packaging")
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "All" && i.item_type !== typeFilter) return false;
    return true;
  });

  const lowCount = items.filter(i => stockStatus(i.current_stock, i.minimum_stock) !== "healthy").length;
  const totalValue = items.reduce((s, i) => s + i.current_stock * i.unit_price, 0);
  const totalUnits = items.reduce((s, i) => s + i.current_stock, 0);

  const handleAdd = async (form: FormState) => {
    try {
      const res = await fetch("/api/packaging", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setItems(xs => [...xs, created]);
      setAddOpen(false);
    } catch (e) { console.error("Add packaging failed:", e); }
  };

  const handleEdit = async (form: FormState) => {
    try {
      const res = await fetch(`/api/packaging/${editTarget!.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setItems(xs => xs.map(i => i.id === updated.id ? updated : i));
      setEditTarget(null);
    } catch (e) { console.error("Edit packaging failed:", e); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/packaging/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setItems(xs => xs.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) { console.error("Delete packaging failed:", e); }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading supplies…</div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ flex: 1 }}>
      {/* Summary strip */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Supply Lines",   value: items.length,                            color: "#c9a84c" },
          { label: "Total Units",    value: formatNumber(totalUnits, 0),             color: "#60a5fa" },
          { label: "Low / Out",      value: lowCount,                                color: "#eab308" },
          { label: "Stock Value",    value: `${sym}${formatNumber(totalValue, 0)}`,  color: "#34d399" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: "14px 18px", flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
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
          <input className="input-base" style={{ paddingLeft: 32 }} placeholder="Search supplies…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-base" style={{ width: 150 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="All">All Types</option>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn-ghost" style={{ height: 36 }} onClick={() => exportCsv(
          items.map(i => ({
            name: i.name, type: i.item_type, capacity_ml: i.capacity_ml ?? "",
            current_stock: i.current_stock, minimum_stock: i.minimum_stock,
            unit_price: i.unit_price, stock_value: (i.current_stock * i.unit_price).toFixed(2),
            supplier: i.supplier_name ?? "", notes: i.notes ?? "",
          })), "packaging_export"
        )}>
          <Download size={13} /> CSV
        </button>
        <button className="btn-primary" style={{ height: 36 }} onClick={() => setAddOpen(true)}>
          <Plus size={13} /> Add Supply
        </button>
      </div>

      {/* Low banner */}
      {lowCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#fca5a5" }}>
          <AlertTriangle size={14} />
          <span><strong>{lowCount} suppl{lowCount !== 1 ? "ies" : "y"} at or below minimum.</strong> Consider reordering.</span>
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="table-base">
          <thead>
            <tr>
              <th>Supply</th><th>Type</th><th>Capacity</th><th>Stock</th><th>Status</th>
              <th>Unit Price</th><th>Stock Value</th><th>Supplier</th><th style={{ width: 90 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => {
              const status = stockStatus(i.current_stock, i.minimum_stock);
              const meta = typeMeta(i.item_type);
              return (
                <tr key={i.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>{meta.emoji}</span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 500, fontSize: 13 }}>{i.name}</div>
                        {i.notes && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{i.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-muted">{meta.label}</span></td>
                  <td style={{ color: "rgba(255,255,255,0.6)" }}>{i.capacity_ml ? `${i.capacity_ml} mL` : "—"}</td>
                  <td>
                    <div style={{ color: status === "out" ? "#ef4444" : status === "low" ? "#eab308" : "rgba(255,255,255,0.7)" }}>
                      {formatNumber(i.current_stock, 0)} units
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>min: {i.minimum_stock}</div>
                  </td>
                  <td><span className={`badge ${stockBadgeClass(status)}`}>{stockLabel(status)}</span></td>
                  <td style={{ color: "#c9a84c", fontWeight: 600 }}>{sym}{i.unit_price.toFixed(2)}</td>
                  <td style={{ color: "#fff", fontWeight: 600 }}>{sym}{(i.current_stock * i.unit_price).toFixed(2)}</td>
                  <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{i.supplier_name || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn-ghost" style={{ padding: "4px 8px" }} title="Edit" onClick={() => setEditTarget(i)}><Edit2 size={13} /></button>
                      <button className="btn-ghost" style={{ padding: "4px 8px", color: "rgba(239,68,68,0.5)" }} title="Delete" onClick={() => setDeleteTarget(i)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "rgba(255,255,255,0.35)" }}>
            <Package size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <div style={{ fontSize: 14 }}>
              {items.length === 0 ? "No supplies yet — add your first bottle or cap" : "No supplies match your filters"}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
        Showing {filtered.length} of {items.length} supply lines
      </div>

      {/* Modals */}
      {addOpen && <ItemModal onSave={handleAdd} onClose={() => setAddOpen(false)} />}
      {editTarget && <ItemModal initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="glass-elevated" style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={16} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Delete Supply</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>This action cannot be undone</div>
              </div>
            </div>
            <div style={{ padding: "18px 24px" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0 }}>
                Delete <span style={{ color: "#fff", fontWeight: 600 }}>{deleteTarget.name}</span> from your supplies?
              </p>
            </div>
            <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }} onClick={handleDelete}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
