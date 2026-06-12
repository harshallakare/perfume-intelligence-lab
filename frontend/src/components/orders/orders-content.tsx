"use client";

import { useState, useEffect } from "react";
import { Search, Plus, ShoppingCart, X, Check, Trash2, Printer, Eye, Loader2 } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { formatNumber } from "@/lib/utils";
import { printHtml } from "@/lib/export";
import type { Order, Customer, FinishedGood, OrderLine, OrderStatus } from "@/types";

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  draft:     { label: "Draft",     color: "#94a3b8" },
  confirmed: { label: "Confirmed", color: "#60a5fa" },
  fulfilled: { label: "Fulfilled", color: "#34d399" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
};
const PAY_META: Record<string, { label: string; color: string }> = {
  unpaid:  { label: "Unpaid",  color: "#ef4444" },
  partial: { label: "Partial", color: "#eab308" },
  paid:    { label: "Paid",    color: "#34d399" },
};
const CHANNELS = ["direct", "whatsapp", "retail", "wholesale", "online"];

interface DraftLine { key: string; finished_good_id: string; description: string; quantity: number; unit_price: number; unit_cost: number }

/* ─── Create order modal ─────────────────────────────────────────────── */
function CreateOrderModal({ customers, products, onSave, onClose }: {
  customers: Customer[]; products: FinishedGood[]; onSave: (body: any) => Promise<void>; onClose: () => void;
}) {
  const { sym } = useSettings();
  const [customerId, setCustomerId] = useState("");
  const [channel, setChannel] = useState("direct");
  const [status, setStatus] = useState<OrderStatus>("confirmed");
  const [discount, setDiscount] = useState(0);
  const [taxPct, setTaxPct] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [saving, setSaving] = useState(false);

  const addLine = () => setLines(ls => [...ls, { key: String(Date.now()), finished_good_id: "", description: "", quantity: 1, unit_price: 0, unit_cost: 0 }]);
  const removeLine = (key: string) => setLines(ls => ls.filter(l => l.key !== key));
  const updateLine = (key: string, patch: Partial<DraftLine>) => setLines(ls => ls.map(l => l.key === key ? { ...l, ...patch } : l));

  const pickProduct = (key: string, fgId: string) => {
    const p = products.find(x => x.id === fgId);
    if (!p) { updateLine(key, { finished_good_id: "", description: "", unit_price: 0, unit_cost: 0 }); return; }
    updateLine(key, {
      finished_good_id: p.id,
      description: `${p.name} · ${p.bottle_size_ml}ml`,
      unit_price: p.sell_price ?? 0,
      unit_cost: p.unit_cost ?? 0,
    });
  };

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const cogs = lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = taxable * (taxPct / 100);
  const total = taxable + taxAmount;
  const profit = total - cogs;

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      customer_id: customerId || null, channel, status,
      discount_amount: discount, tax_pct: taxPct, amount_paid: amountPaid, notes,
      lines: lines.filter(l => l.description.trim()).map(l => ({
        finished_good_id: l.finished_good_id || null, description: l.description,
        quantity: l.quantity, unit_price: l.unit_price, unit_cost: l.unit_cost,
      })),
    });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="glass-elevated" style={{ width: "100%", maxWidth: 760, maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#c9a84c22,#c9a84c44)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingCart size={15} color="#c9a84c" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>New Order</div>
          </div>
          <button className="btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Header fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 5 }}>Customer</div>
              <select className="select-base" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Walk-in / none</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 5 }}>Channel</div>
              <select className="select-base" value={channel} onChange={e => setChannel(e.target.value)}>
                {CHANNELS.map(c => <option key={c} value={c} style={{ textTransform: "capitalize" }}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 5 }}>Status</div>
              <select className="select-base" value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="fulfilled">Fulfilled (deduct stock)</option>
              </select>
            </div>
          </div>

          {/* Lines */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Line Items</div>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={addLine}><Plus size={12} /> Add line</button>
            </div>
            {lines.length === 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", padding: "8px 0" }}>No items yet — add a product or a custom line.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lines.map(l => (
                <div key={l.key} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 60px 90px 70px 28px", gap: 8, alignItems: "center" }}>
                  <select className="select-base" style={{ padding: "6px 8px" }} value={l.finished_good_id} onChange={e => pickProduct(l.key, e.target.value)}>
                    <option value="">— custom —</option>
                    {products.filter(p => (p.bottles_filled - p.bottles_sold) > 0 || p.id === l.finished_good_id).map(p => (
                      <option key={p.id} value={p.id}>{p.name} · {p.bottle_size_ml}ml ({p.bottles_filled - p.bottles_sold} left)</option>
                    ))}
                  </select>
                  <input className="input-base" style={{ padding: "6px 8px" }} placeholder="Description" value={l.description} onChange={e => updateLine(l.key, { description: e.target.value })} />
                  <input className="input-base" style={{ padding: "6px 8px", textAlign: "right" }} type="number" min={1} value={l.quantity} onChange={e => updateLine(l.key, { quantity: parseInt(e.target.value) || 0 })} />
                  <input className="input-base" style={{ padding: "6px 8px", textAlign: "right" }} type="number" min={0} step={0.01} value={l.unit_price} onChange={e => updateLine(l.key, { unit_price: parseFloat(e.target.value) || 0 })} />
                  <div style={{ fontSize: 12, color: "#c9a84c", textAlign: "right", fontWeight: 600 }}>{sym}{(l.quantity * l.unit_price).toFixed(0)}</div>
                  <button className="btn-ghost" style={{ padding: 4, color: "rgba(239,68,68,0.5)" }} onClick={() => removeLine(l.key)}><X size={13} /></button>
                </div>
              ))}
            </div>
            {lines.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 60px 90px 70px 28px", gap: 8, marginTop: 4, padding: "0 0", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                <span>Product</span><span>Description</span><span style={{ textAlign: "right" }}>Qty</span><span style={{ textAlign: "right" }}>Price</span><span style={{ textAlign: "right" }}>Total</span><span />
              </div>
            )}
          </div>

          {/* Totals + payment */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Discount ({sym})</div><input className="input-base" style={{ padding: "6px 8px" }} type="number" min={0} value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} /></div>
                <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Tax (%)</div><input className="input-base" style={{ padding: "6px 8px" }} type="number" min={0} value={taxPct} onChange={e => setTaxPct(parseFloat(e.target.value) || 0)} /></div>
              </div>
              <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Amount paid ({sym})</div><input className="input-base" style={{ padding: "6px 8px" }} type="number" min={0} value={amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} /></div>
              <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Notes</div><input className="input-base" style={{ padding: "6px 8px" }} value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                ["Subtotal", subtotal], ["Discount", -discount], [`Tax ${taxPct}%`, taxAmount],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
                  <span>{k}</span><span>{sym}{formatNumber(v as number, 2)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 15, fontWeight: 800, color: "#fff" }}>
                <span>Total</span><span style={{ color: "#c9a84c" }}>{sym}{formatNumber(total, 2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#34d399" }}>
                <span>Est. profit</span><span style={{ fontWeight: 700 }}>{sym}{formatNumber(profit, 2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving || lines.filter(l => l.description.trim()).length === 0} onClick={handleSave}>
            {saving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><Check size={14} /> Create Order</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Order detail drawer ────────────────────────────────────────────── */
function OrderDrawer({ order, sym, onChange, onClose, onDelete }: {
  order: Order; sym: string; onChange: (o: Order) => void; onClose: () => void; onDelete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState(order.amount_paid);

  const update = async (patch: any) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      if (res.ok) onChange(await res.json());
    } finally { setBusy(false); }
  };

  const printInvoice = () => {
    const rows = (order.lines ?? []).map(l => `<tr><td>${l.description}</td><td style="text-align:right">${l.quantity}</td><td style="text-align:right">${sym}${l.unit_price.toFixed(2)}</td><td style="text-align:right">${sym}${l.line_total.toFixed(2)}</td></tr>`).join("");
    const body = `
      <div style="display:flex;justify-content:space-between;margin-bottom:16px">
        <div><strong>Bill To:</strong><br/>${order.customer_name ?? "Walk-in customer"}</div>
        <div style="text-align:right"><strong>${order.order_number}</strong><br/>${new Date(order.order_date).toLocaleDateString()}<br/>Status: ${order.status}</div>
      </div>
      <table><thead><tr><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div style="margin-top:16px;margin-left:auto;width:260px;font-size:10pt">
        <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Subtotal</span><span>${sym}${order.subtotal.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Discount</span><span>-${sym}${order.discount_amount.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Tax (${order.tax_pct}%)</span><span>${sym}${order.tax_amount.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #ccc;font-weight:700;font-size:12pt"><span>Total</span><span>${sym}${order.total.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Paid</span><span>${sym}${order.amount_paid.toFixed(2)}</span></div>
      </div>`;
    printHtml(body, { title: `Invoice ${order.order_number}`, subtitle: "Perfume Intelligence Lab" });
  };

  const sm = STATUS_META[order.status];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "flex-end" }}>
      <div className="glass-elevated" style={{ width: 460, height: "100%", display: "flex", flexDirection: "column", borderRadius: "12px 0 0 12px" }}>
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{order.order_number}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{order.customer_name ?? "Walk-in"} · {new Date(order.order_date).toLocaleDateString()}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, fontWeight: 600, background: sm.color + "20", border: `1px solid ${sm.color}44`, color: sm.color }}>{sm.label}</span>
              <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, fontWeight: 600, background: PAY_META[order.payment_status].color + "20", border: `1px solid ${PAY_META[order.payment_status].color}44`, color: PAY_META[order.payment_status].color }}>{PAY_META[order.payment_status].label}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "capitalize", alignSelf: "center" }}>{order.channel}</span>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: "6px 8px" }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* Lines */}
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 18 }}>
            {(order.lines ?? []).map((l, i) => (
              <div key={l.id ?? i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < (order.lines!.length - 1) ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div><div style={{ fontSize: 13, color: "#fff" }}>{l.description}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{l.quantity} × {sym}{l.unit_price.toFixed(2)}</div></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c" }}>{sym}{l.line_total.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 18 }}>
            {[["Subtotal", order.subtotal], ["Discount", -order.discount_amount], [`Tax ${order.tax_pct}%`, order.tax_amount]].map(([k, v]) => (
              <div key={k as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}><span>{k}</span><span>{sym}{formatNumber(v as number, 2)}</span></div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 15, fontWeight: 800, color: "#fff" }}><span>Total</span><span style={{ color: "#c9a84c" }}>{sym}{formatNumber(order.total, 2)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12 }}><span style={{ color: "rgba(255,255,255,0.5)" }}>Profit (after COGS {sym}{formatNumber(order.cogs, 0)})</span><span style={{ fontWeight: 700, color: order.profit >= 0 ? "#34d399" : "#ef4444" }}>{sym}{formatNumber(order.profit, 2)}</span></div>
          </div>

          {/* Payment */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Record Payment</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input-base" type="number" min={0} value={pay} onChange={e => setPay(parseFloat(e.target.value) || 0)} />
              <button className="btn-secondary" disabled={busy} onClick={() => update({ amount_paid: pay })}>Update</button>
              <button className="btn-ghost" disabled={busy} onClick={() => { setPay(order.total); update({ amount_paid: order.total }); }}>Mark paid</button>
            </div>
          </div>

          {/* Status actions */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Status</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["confirmed", "fulfilled", "cancelled"] as OrderStatus[]).map(s => (
                <button key={s} className="btn-secondary" disabled={busy || order.status === s} style={{ opacity: order.status === s ? 0.5 : 1, ...(s === "fulfilled" ? { borderColor: "rgba(52,211,153,0.4)", color: "#34d399" } : s === "cancelled" ? { borderColor: "rgba(239,68,68,0.4)", color: "#ef4444" } : {}) }} onClick={() => update({ status: s })}>
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
            {order.status !== "fulfilled" && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>Marking <strong>Fulfilled</strong> deducts sold bottles from product stock.</div>}
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10 }}>
          <button className="btn-ghost" style={{ color: "rgba(239,68,68,0.6)" }} onClick={onDelete}><Trash2 size={13} /></button>
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={printInvoice}><Printer size={13} /> Invoice</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export function OrdersContent() {
  const { sym } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<FinishedGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);

  const reloadProducts = () => fetch("/api/finished-goods").then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : []));

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
      fetch("/api/finished-goods").then(r => r.json()),
    ]).then(([o, c, p]) => {
      setOrders(Array.isArray(o) ? o : []); setCustomers(Array.isArray(c) ? c : []); setProducts(Array.isArray(p) ? p : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    if (search && !o.order_number.toLowerCase().includes(search.toLowerCase()) && !(o.customer_name ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    return true;
  });

  const active = orders.filter(o => o.status !== "cancelled");
  const revenue = active.reduce((s, o) => s + o.total, 0);
  const profit = active.reduce((s, o) => s + o.profit, 0);
  const outstanding = active.reduce((s, o) => s + (o.total - o.amount_paid), 0);

  const handleCreate = async (body: any) => {
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setOrders(xs => [created, ...xs]); setCreateOpen(false);
      if (body.status === "fulfilled") reloadProducts();
    } catch (e) { console.error(e); }
  };
  const handleChange = (updated: Order) => {
    setOrders(xs => xs.map(o => o.id === updated.id ? { ...o, ...updated } : o));
    setDetail(d => d && d.id === updated.id ? { ...d, ...updated } : d);
    reloadProducts();
  };
  const handleDelete = async () => {
    if (!detail) return;
    try {
      const res = await fetch(`/api/orders/${detail.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setOrders(xs => xs.filter(o => o.id !== detail.id)); setDetail(null); reloadProducts();
    } catch (e) { console.error(e); }
  };

  const openDetail = async (o: Order) => {
    // fetch full order with lines
    try {
      const res = await fetch(`/api/orders/${o.id}`);
      setDetail(res.ok ? await res.json() : o);
    } catch { setDetail(o); }
  };

  if (loading) return <div className="page-content" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}><div style={{ color: "rgba(255,255,255,0.4)" }}>Loading orders…</div></div>;

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Orders", value: orders.length, color: "#c9a84c" },
          { label: "Revenue", value: `${sym}${formatNumber(revenue, 0)}`, color: "#60a5fa" },
          { label: "Profit", value: `${sym}${formatNumber(profit, 0)}`, color: "#34d399" },
          { label: "Outstanding", value: `${sym}${formatNumber(outstanding, 0)}`, color: outstanding > 0 ? "#eab308" : "#34d399" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: "14px 18px", flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 6, height: 36, background: s.color, borderRadius: 99, flexShrink: 0 }} />
            <div><div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "Georgia, serif" }}>{s.value}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
          <input className="input-base" style={{ paddingLeft: 32 }} placeholder="Search order #, customer…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-base" style={{ width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn-primary" style={{ height: 36 }} onClick={() => setCreateOpen(true)}><Plus size={13} /> New Order</button>
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="table-base">
          <thead><tr><th>Order #</th><th>Customer</th><th>Channel</th><th>Items</th><th>Total</th><th>Profit</th><th>Status</th><th>Payment</th><th style={{ width: 60 }}></th></tr></thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => openDetail(o)}>
                <td style={{ fontWeight: 600, color: "#fff", fontFamily: "monospace" }}>{o.order_number}</td>
                <td style={{ color: "rgba(255,255,255,0.75)" }}>{o.customer_name ?? "Walk-in"}</td>
                <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, textTransform: "capitalize" }}>{o.channel}</td>
                <td style={{ color: "rgba(255,255,255,0.6)" }}>{o.line_count}</td>
                <td style={{ color: "#c9a84c", fontWeight: 700 }}>{sym}{formatNumber(o.total, 0)}</td>
                <td style={{ color: o.profit >= 0 ? "#34d399" : "#ef4444", fontWeight: 600 }}>{sym}{formatNumber(o.profit, 0)}</td>
                <td><span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, fontWeight: 600, background: STATUS_META[o.status].color + "20", border: `1px solid ${STATUS_META[o.status].color}44`, color: STATUS_META[o.status].color }}>{STATUS_META[o.status].label}</span></td>
                <td><span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, fontWeight: 600, background: PAY_META[o.payment_status].color + "20", border: `1px solid ${PAY_META[o.payment_status].color}44`, color: PAY_META[o.payment_status].color }}>{PAY_META[o.payment_status].label}</span></td>
                <td><button className="btn-ghost" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); openDetail(o); }}><Eye size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "rgba(255,255,255,0.35)" }}>
            <ShoppingCart size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <div style={{ fontSize: 14 }}>{orders.length === 0 ? "No orders yet — create your first sale" : "No orders match your filters"}</div>
          </div>
        )}
      </div>

      {createOpen && <CreateOrderModal customers={customers} products={products} onSave={handleCreate} onClose={() => setCreateOpen(false)} />}
      {detail && <OrderDrawer order={detail} sym={sym} onChange={handleChange} onClose={() => setDetail(null)} onDelete={handleDelete} />}
    </div>
  );
}
