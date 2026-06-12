"use client";

import { useState, useEffect } from "react";
import { Search, Edit2, Trash2, X, Check, TrendingUp, Boxes } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { formatNumber } from "@/lib/utils";
import { batchCost, unitCost, marginPct, markupPct, priceForMargin, marginColor, yieldPct } from "@/lib/pricing";
import type { FinishedGood } from "@/types";

const TYPE_LABEL: Record<string, string> = { edt: "EDT", edp: "EDP", parfum: "Parfum", elixir: "Elixir", attar: "Attar" };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 5 }}>
        {label}{hint && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: 6 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ─── Pricing / batch-profit editor ──────────────────────────────────── */
function ProductModal({ product, onSave, onClose }: { product: FinishedGood; onSave: (body: any) => void; onClose: () => void }) {
  const { sym } = useSettings();
  const [name, setName] = useState(product.name);
  const [material, setMaterial] = useState(product.material_cost ?? 0);
  const [packaging, setPackaging] = useState(product.packaging_cost ?? 0);
  const [labor, setLabor] = useState(product.labor_cost ?? 0);
  const [planned, setPlanned] = useState(product.planned_bottles ?? product.bottles_filled);
  const [targetMargin, setTargetMargin] = useState(60);
  const [price, setPrice] = useState(product.sell_price ?? 0);

  const bc = batchCost(material, packaging, labor);
  const uc = unitCost(bc, product.bottles_filled);
  const suggested = priceForMargin(uc, targetMargin);
  const margin = marginPct(price, uc);
  const markup = markupPct(price, uc);
  const profitPerBottle = price - uc;
  const yl = yieldPct(product.bottles_filled, planned);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="glass-elevated" style={{ width: "100%", maxWidth: 640, maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#c9a84c22,#c9a84c44)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={15} color="#c9a84c" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Pricing & Margin</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{product.bottle_size_ml}ml · {product.bottles_filled} bottles produced</div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <Field label="Product name"><input className="input-base" value={name} onChange={e => setName(e.target.value)} /></Field>

          {/* Cost components */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Batch Cost Components</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label={`Materials (${sym})`}><input className="input-base" type="number" min={0} step={0.01} value={material} onChange={e => setMaterial(parseFloat(e.target.value) || 0)} /></Field>
              <Field label={`Packaging (${sym})`}><input className="input-base" type="number" min={0} step={0.01} value={packaging} onChange={e => setPackaging(parseFloat(e.target.value) || 0)} /></Field>
              <Field label={`Labor / OH (${sym})`}><input className="input-base" type="number" min={0} step={0.01} value={labor} onChange={e => setLabor(parseFloat(e.target.value) || 0)} /></Field>
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Batch cost</div><div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{sym}{bc.toFixed(2)}</div></div>
              <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Cost / bottle</div><div style={{ fontSize: 16, fontWeight: 800, color: "#c9a84c" }}>{sym}{uc.toFixed(2)}</div></div>
            </div>
          </div>

          {/* Margin engine */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Margin Engine</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Target gross margin</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c" }}>{targetMargin}%</span>
            </div>
            <input type="range" min={0} max={90} value={targetMargin} onChange={e => setTargetMargin(Number(e.target.value))} style={{ width: "100%", accentColor: "#c9a84c" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Suggested price for {targetMargin}% margin</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#c9a84c", fontFamily: "Georgia, serif" }}>{sym}{suggested.toFixed(2)}</span>
                <button className="btn-secondary" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setPrice(parseFloat(suggested.toFixed(2)))}>Use</button>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Field label={`Selling price / bottle (${sym})`}><input className="input-base" type="number" min={0} step={1} value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} /></Field>
            </div>

            {/* Resulting margin */}
            {price > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 12 }}>
                {[
                  { label: "Gross margin", value: `${margin.toFixed(1)}%`, color: marginColor(margin) },
                  { label: "Markup", value: `${markup.toFixed(0)}%`, color: "#60a5fa" },
                  { label: "Profit / bottle", value: `${sym}${profitPerBottle.toFixed(2)}`, color: marginColor(margin) },
                ].map(t => (
                  <div key={t.label} style={{ padding: "10px 12px", borderRadius: 8, background: `${t.color}10`, border: `1px solid ${t.color}28` }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: t.color, fontFamily: "Georgia, serif" }}>{t.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Yield */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Yield</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "end" }}>
              <Field label="Planned bottles" hint="target fill"><input className="input-base" type="number" min={0} value={planned} onChange={e => setPlanned(parseInt(e.target.value) || 0)} /></Field>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Actual filled / yield</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: yl != null && yl < 90 ? "#eab308" : "#34d399" }}>
                  {product.bottles_filled} {yl != null ? `· ${yl.toFixed(0)}%` : ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({
            name, material_cost: material, packaging_cost: packaging, labor_cost: labor,
            planned_bottles: planned, sell_price: price,
          })}><Check size={14} /> Save</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export function ProductsContent() {
  const { sym } = useSettings();
  const [products, setProducts] = useState<FinishedGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<FinishedGood | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinishedGood | null>(null);

  useEffect(() => {
    fetch("/api/finished-goods").then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const available = (p: FinishedGood) => p.bottles_filled - p.bottles_sold;
  const stockValue = products.reduce((s, p) => s + available(p) * (p.unit_cost ?? 0), 0);
  const retailValue = products.reduce((s, p) => s + available(p) * (p.sell_price ?? 0), 0);
  const realisedProfit = products.reduce((s, p) => s + ((p.revenue ?? 0) - (p.batch_cost ?? 0) * ((p.qty_sold_orders ?? 0) > 0 ? 1 : 0)), 0);
  const unpriced = products.filter(p => !p.sell_price).length;

  const handleSave = async (body: any) => {
    try {
      const res = await fetch(`/api/finished-goods/${editTarget!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setProducts(xs => xs.map(p => p.id === updated.id ? { ...p, ...updated } : p)); setEditTarget(null);
    } catch (e) { console.error(e); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/finished-goods/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setProducts(xs => xs.filter(p => p.id !== deleteTarget.id)); setDeleteTarget(null);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="page-content" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}><div style={{ color: "rgba(255,255,255,0.4)" }}>Loading products…</div></div>;

  return (
    <div className="page-content" style={{ flex: 1 }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Products / Lots", value: products.length, color: "#c9a84c" },
          { label: "Stock at Cost", value: `${sym}${formatNumber(stockValue, 0)}`, color: "#60a5fa" },
          { label: "Stock at Retail", value: `${sym}${formatNumber(retailValue, 0)}`, color: "#34d399" },
          { label: "Need Pricing", value: unpriced, color: unpriced > 0 ? "#eab308" : "#34d399" },
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

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
          <input className="input-base" style={{ paddingLeft: 32 }} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Products are created by committing batches in the Clone Engine</span>
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="table-base">
          <thead><tr>
            <th>Product</th><th>Size</th><th>Available</th><th>Cost/btl</th><th>Price/btl</th><th>Margin</th><th>Yield</th><th>Batch Profit</th><th style={{ width: 90 }}>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(p => {
              const avail = available(p);
              const uc = p.unit_cost ?? 0;
              const price = p.sell_price ?? 0;
              const margin = price > 0 ? marginPct(price, uc) : null;
              const yl = yieldPct(p.bottles_filled, p.planned_bottles);
              const batchProfit = (p.revenue ?? 0) > 0 ? (p.revenue ?? 0) - (p.batch_cost ?? 0) : null;
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ color: "#fff", fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{TYPE_LABEL[p.perfume_type] ?? p.perfume_type} · {p.bottles_sold} sold</div>
                  </td>
                  <td style={{ color: "rgba(255,255,255,0.6)" }}>{p.bottle_size_ml}ml</td>
                  <td>
                    <span style={{ color: avail <= 0 ? "#ef4444" : "rgba(255,255,255,0.85)", fontWeight: 600 }}>{avail}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}> / {p.bottles_filled}</span>
                  </td>
                  <td style={{ color: "rgba(255,255,255,0.7)" }}>{uc > 0 ? `${sym}${uc.toFixed(2)}` : "—"}</td>
                  <td style={{ color: price > 0 ? "#c9a84c" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>{price > 0 ? `${sym}${price.toFixed(2)}` : "set price"}</td>
                  <td>{margin != null ? <span style={{ fontWeight: 700, color: marginColor(margin) }}>{margin.toFixed(0)}%</span> : <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>}</td>
                  <td>{yl != null ? <span style={{ color: yl < 90 ? "#eab308" : "#34d399" }}>{yl.toFixed(0)}%</span> : <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>}</td>
                  <td>{batchProfit != null ? <span style={{ fontWeight: 700, color: batchProfit >= 0 ? "#34d399" : "#ef4444" }}>{sym}{formatNumber(batchProfit, 0)}</span> : <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn-ghost" style={{ padding: "4px 8px" }} title="Pricing & margin" onClick={() => setEditTarget(p)}><Edit2 size={13} /></button>
                      <button className="btn-ghost" style={{ padding: "4px 8px", color: "rgba(239,68,68,0.5)" }} title="Delete" onClick={() => setDeleteTarget(p)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "rgba(255,255,255,0.35)" }}>
            <Boxes size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <div style={{ fontSize: 14 }}>{products.length === 0 ? "No products yet — commit a batch from the Clone Engine" : "No products match your search"}</div>
          </div>
        )}
      </div>

      {editTarget && <ProductModal product={editTarget} onSave={handleSave} onClose={() => setEditTarget(null)} />}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="glass-elevated" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Delete Product</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>Delete <span style={{ color: "#fff", fontWeight: 600 }}>{deleteTarget.name}</span> and its batch record? This won't restore packaging stock.</p>
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
