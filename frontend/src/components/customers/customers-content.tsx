"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Contact, Edit2, Trash2, X, Check, Mail, Phone, Building2 } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { formatNumber } from "@/lib/utils";
import type { Customer, CustomerType } from "@/types";

const TYPE_OPTIONS: { value: CustomerType; label: string; color: string }[] = [
  { value: "retail",      label: "Retail",      color: "#60a5fa" },
  { value: "wholesale",   label: "Wholesale",   color: "#c9a84c" },
  { value: "distributor", label: "Distributor", color: "#a78bfa" },
  { value: "online",      label: "Online",      color: "#34d399" },
];
const typeMeta = (t: string) => TYPE_OPTIONS.find(o => o.value === t) ?? TYPE_OPTIONS[0];

function blankForm() {
  return { name: "", type: "retail" as CustomerType, email: "", phone: "", company: "", gstin: "", address: "", city: "", notes: "" };
}
type FormState = ReturnType<typeof blankForm>;

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 5 }}>
        {label}{hint && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: 6 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function CustomerModal({ initial, onSave, onClose }: { initial?: Customer; onSave: (f: FormState) => void; onClose: () => void }) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>(() => initial
    ? { name: initial.name, type: initial.type, email: initial.email ?? "", phone: initial.phone ?? "", company: initial.company ?? "", gstin: initial.gstin ?? "", address: initial.address ?? "", city: initial.city ?? "", notes: initial.notes ?? "" }
    : blankForm());
  const [error, setError] = useState("");
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="glass-elevated" style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#c9a84c22,#c9a84c44)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Contact size={15} color="#c9a84c" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{isEdit ? "Edit Customer" : "Add Customer"}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{isEdit ? initial!.name : "Retail, wholesale or distributor"}</div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
            <Field label="Name"><input className="input-base" placeholder="Customer name" value={form.name} onChange={e => set("name", e.target.value)} autoFocus /></Field>
            <Field label="Type">
              <select className="select-base" value={form.type} onChange={e => set("type", e.target.value as CustomerType)}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Phone"><input className="input-base" placeholder="+91…" value={form.phone} onChange={e => set("phone", e.target.value)} /></Field>
            <Field label="Email"><input className="input-base" type="email" placeholder="name@email.com" value={form.email} onChange={e => set("email", e.target.value)} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Company" hint="optional"><input className="input-base" value={form.company} onChange={e => set("company", e.target.value)} /></Field>
            <Field label="GSTIN" hint="optional"><input className="input-base" style={{ fontFamily: "monospace" }} value={form.gstin} onChange={e => set("gstin", e.target.value)} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 12 }}>
            <Field label="Address" hint="optional"><input className="input-base" value={form.address} onChange={e => set("address", e.target.value)} /></Field>
            <Field label="City" hint="optional"><input className="input-base" value={form.city} onChange={e => set("city", e.target.value)} /></Field>
          </div>
          <Field label="Notes" hint="optional"><textarea className="input-base" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} style={{ resize: "vertical" }} /></Field>
          {error && <div style={{ fontSize: 12, color: "#ef4444" }}>{error}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => { if (!form.name.trim()) { setError("Name is required"); return; } onSave(form); }}>
            <Check size={14} /> {isEdit ? "Save Changes" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomersContent() {
  const { sym } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.phone ?? "").includes(search) && !(c.company ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "All" && c.type !== typeFilter) return false;
    return true;
  });

  const totalSpend = customers.reduce((s, c) => s + c.total_spend, 0);

  const handleAdd = async (form: FormState) => {
    try {
      const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setCustomers(xs => [...xs, created]); setAddOpen(false);
    } catch (e) { console.error(e); }
  };
  const handleEdit = async (form: FormState) => {
    try {
      const res = await fetch(`/api/customers/${editTarget!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setCustomers(xs => xs.map(c => c.id === updated.id ? { ...c, ...updated } : c)); setEditTarget(null);
    } catch (e) { console.error(e); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setCustomers(xs => xs.filter(c => c.id !== deleteTarget.id)); setDeleteTarget(null);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="page-content" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}><div style={{ color: "rgba(255,255,255,0.4)" }}>Loading customers…</div></div>;

  return (
    <div className="page-content" style={{ flex: 1 }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Customers", value: customers.length, color: "#c9a84c" },
          { label: "Wholesale / Dist.", value: customers.filter(c => c.type !== "retail").length, color: "#a78bfa" },
          { label: "Lifetime Revenue", value: `${sym}${formatNumber(totalSpend, 0)}`, color: "#34d399" },
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

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
          <input className="input-base" style={{ paddingLeft: 32 }} placeholder="Search name, phone, company…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-base" style={{ width: 150 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="All">All Types</option>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn-primary" style={{ height: 36 }} onClick={() => setAddOpen(true)}><Plus size={13} /> Add Customer</button>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="table-base">
          <thead><tr><th>Customer</th><th>Type</th><th>Contact</th><th>City</th><th>Orders</th><th>Lifetime Spend</th><th style={{ width: 90 }}>Actions</th></tr></thead>
          <tbody>
            {filtered.map(c => {
              const meta = typeMeta(c.type);
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ color: "#fff", fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                    {c.company && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}><Building2 size={9} />{c.company}</div>}
                  </td>
                  <td><span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, fontWeight: 600, background: meta.color + "18", border: `1px solid ${meta.color}44`, color: meta.color }}>{meta.label}</span></td>
                  <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    {c.phone && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={10} />{c.phone}</div>}
                    {c.email && <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}><Mail size={10} />{c.email}</div>}
                    {!c.phone && !c.email && "—"}
                  </td>
                  <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{c.city || "—"}</td>
                  <td style={{ color: "rgba(255,255,255,0.7)" }}>{c.order_count}</td>
                  <td style={{ color: "#34d399", fontWeight: 700 }}>{sym}{formatNumber(c.total_spend, 0)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn-ghost" style={{ padding: "4px 8px" }} title="Edit" onClick={() => setEditTarget(c)}><Edit2 size={13} /></button>
                      <button className="btn-ghost" style={{ padding: "4px 8px", color: "rgba(239,68,68,0.5)" }} title="Delete" onClick={() => setDeleteTarget(c)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "rgba(255,255,255,0.35)" }}>
            <Contact size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <div style={{ fontSize: 14 }}>{customers.length === 0 ? "No customers yet — add your first" : "No customers match your filters"}</div>
          </div>
        )}
      </div>

      {addOpen && <CustomerModal onSave={handleAdd} onClose={() => setAddOpen(false)} />}
      {editTarget && <CustomerModal initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="glass-elevated" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Delete Customer</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>Delete <span style={{ color: "#fff", fontWeight: 600 }}>{deleteTarget.name}</span>? Their orders will be kept but unlinked.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }} onClick={handleDelete}><Trash2 size={13} /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
