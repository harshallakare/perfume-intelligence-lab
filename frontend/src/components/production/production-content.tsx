"use client";

import { useState, useEffect } from "react";
import { Factory, Clock, CheckCircle, AlertCircle, Play, Pause, Package, FlaskConical, QrCode, Loader2 } from "lucide-react";

interface ProductionOrder {
  id: string;
  order_number: string;
  formula_name: string;
  status: string;
  requested_bottles: number;
  bottle_size_ml: number;
  planned_start_date?: string;
  maceration_ends_at?: string;
  assigned_to?: string;
  qc_result?: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType; color: string }> = {
  draft:        { label: "Draft",         cls: "badge-muted",   icon: Clock,          color: "rgba(255,255,255,0.3)" },
  scheduled:    { label: "Scheduled",     cls: "badge-blue",    icon: Clock,          color: "#60a5fa" },
  in_progress:  { label: "In Progress",   cls: "badge-yellow",  icon: Play,           color: "#eab308" },
  macerating:   { label: "Macerating",    cls: "badge-purple",  icon: Pause,          color: "#a78bfa" },
  quality_check:{ label: "QC Check",      cls: "badge-gold",    icon: AlertCircle,    color: "#c9a84c" },
  completed:    { label: "Completed",     cls: "badge-green",   icon: CheckCircle,    color: "#22c55e" },
  rejected:     { label: "Rejected",      cls: "badge-red",     icon: AlertCircle,    color: "#ef4444" },
  cancelled:    { label: "Cancelled",     cls: "badge-muted",   icon: AlertCircle,    color: "rgba(255,255,255,0.3)" },
};

function MaceratingTimer({ endsAt }: { endsAt: string }) {
  const end = new Date(endsAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000));
  const diffHrs = Math.max(0, Math.floor((diffMs % 86400000) / 3600000));
  const pct = Math.max(0, Math.min(100, ((7 - diffDays) / 7) * 100));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#a78bfa" }}>Maceration</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{diffDays}d {diffHrs}h left</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: "#a78bfa" }} />
      </div>
    </div>
  );
}

export function ProductionContent() {
  const [filter, setFilter] = useState("All");
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProductionOrder | null>(null);

  useEffect(() => {
    fetch("/api/productions")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setOrders(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const STATUS_FILTERS = ["All", "Scheduled", "In Progress", "Macerating", "QC Check", "Completed"];
  const filterMap: Record<string, string> = { "In Progress": "in_progress", "QC Check": "quality_check" };

  const filtered = orders.filter((o) => {
    if (filter === "All") return true;
    const key = filterMap[filter] ?? filter.toLowerCase();
    return o.status === key;
  });

  const stats = [
    { label: "Active Orders", value: orders.filter((o) => !["completed", "cancelled", "rejected"].includes(o.status)).length, color: "#60a5fa" },
    { label: "Macerating", value: orders.filter((o) => o.status === "macerating").length, color: "#a78bfa" },
    { label: "QC Pending", value: orders.filter((o) => o.status === "quality_check").length, color: "#eab308" },
    { label: "Completed (MTD)", value: orders.filter((o) => o.status === "completed").length, color: "#22c55e" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, height: 320, gap: 10, color: "rgba(255,255,255,0.4)" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        <span>Loading production orders…</span>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        {stats.map((s) => (
          <div key={s.label} className="glass-card" style={{ padding: "13px 18px", flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 5, height: 32, background: s.color, borderRadius: 99 }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "Georgia, serif" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, flex: 1 }}>
        {/* Order list */}
        <div>
          {/* Filter bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: "1px solid",
                  transition: "all 0.15s",
                  background: filter === f ? "rgba(201,168,76,0.15)" : "transparent",
                  borderColor: filter === f ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.1)",
                  color: filter === f ? "#c9a84c" : "rgba(255,255,255,0.5)",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="glass-card" style={{ overflow: "hidden" }}>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Formula</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status];
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelected(order)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div style={{ fontSize: 12, fontFamily: "monospace", color: "#c9a84c" }}>{order.order_number}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <FlaskConical size={12} style={{ color: "#c9a84c", flexShrink: 0 }} />
                          <span style={{ color: "#ffffff", fontWeight: 500 }}>{order.formula_name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: "#ffffff" }}>{order.requested_bottles}×</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{order.bottle_size_ml}ml</div>
                      </td>
                      <td>
                        <span className={`badge ${cfg.cls}`}>
                          <Icon size={10} /> {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{order.assigned_to}</td>
                      <td style={{ fontSize: 12 }}>{order.planned_start_date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order detail */}
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Factory size={16} style={{ color: "#c9a84c" }} />
                <div className="section-title" style={{ fontSize: 15 }}>{selected.formula_name}</div>
              </div>

              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#c9a84c", marginBottom: 12 }}>
                {selected.order_number}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Bottles", value: `${selected.requested_bottles}×${selected.bottle_size_ml}ml` },
                  { label: "Volume", value: `${(selected.requested_bottles * selected.bottle_size_ml / 1000).toFixed(1)}L` },
                  { label: "Start Date", value: selected.planned_start_date ?? "—" },
                  { label: "Assigned", value: selected.assigned_to ?? "—" },
                ].map((r) => (
                  <div key={r.label} style={{ background: "rgba(255,255,255,0.025)", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>{r.value}</div>
                  </div>
                ))}
              </div>

              {selected.status === "macerating" && selected.maceration_ends_at && (
                <MaceratingTimer endsAt={selected.maceration_ends_at} />
              )}

              {selected.status === "quality_check" && (
                <div style={{ padding: "12px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, marginTop: 10 }}>
                  <div style={{ fontSize: 12, color: "#c9a84c", fontWeight: 600, marginBottom: 8 }}>QC Checkpoint</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "8px 0" }}>
                      <CheckCircle size={13} /> Pass
                    </button>
                    <button className="btn-danger" style={{ flex: 1, justifyContent: "center", padding: "8px 0" }}>
                      Fail
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                  <QrCode size={13} /> QR Code
                </button>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
                  <Package size={13} /> Log Batch
                </button>
              </div>
            </div>

            {/* Status timeline */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                Status Timeline
              </div>
              {(["scheduled", "in_progress", "macerating", "quality_check", "completed"] as const).map((s, i) => {
                const statusOrder = ["scheduled", "in_progress", "macerating", "quality_check", "completed"];
                const currentIdx = statusOrder.indexOf(selected.status);
                const thisIdx = statusOrder.indexOf(s);
                const isDone = thisIdx <= currentIdx;
                const isCurrent = thisIdx === currentIdx;
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;

                return (
                  <div key={s} style={{ display: "flex", gap: 12, marginBottom: i < 4 ? 4 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: isDone ? `${cfg.color}22` : "rgba(255,255,255,0.05)",
                          border: `1.5px solid ${isDone ? cfg.color : "rgba(255,255,255,0.1)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: isCurrent ? `0 0 10px ${cfg.color}44` : "none",
                        }}
                      >
                        <Icon size={11} style={{ color: isDone ? cfg.color : "rgba(255,255,255,0.2)" }} />
                      </div>
                      {i < 4 && (
                        <div style={{ width: 1.5, flex: 1, minHeight: 20, background: isDone ? cfg.color + "40" : "rgba(255,255,255,0.06)", margin: "3px 0" }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 2, paddingBottom: i < 4 ? 8 : 0 }}>
                      <div style={{ fontSize: 12, fontWeight: isCurrent ? 600 : 400, color: isDone ? "#ffffff" : "rgba(255,255,255,0.3)" }}>
                        {cfg.label}
                      </div>
                      {isCurrent && (
                        <div style={{ fontSize: 10, color: cfg.color, marginTop: 1 }}>Current stage</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
