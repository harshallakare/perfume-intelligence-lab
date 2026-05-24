"use client";

import { useEffect, useState } from "react";
import { Package, FlaskConical, Factory, ShieldAlert, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity, Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsPayload {
  total_materials: number;
  low_stock_count: number;
  total_formulas: number;
  active_productions: number;
  ifra_pending: number;
  low_stock_materials: { name: string; stock: number; min: number; unit: string }[];
  recent_notifications: { id: string; type: string; title: string; message: string; severity: string; is_read: boolean; created_at: string }[];
  top_formulas: { id: string; name: string; type: string; batches: number; status: string }[];
  recent_productions: { id: string; order_number: string; formula_name: string; status: string; updated_at: string }[];
}

// Static chart shapes (representative; replace with real time-series data in Tier 3)
const inventoryTrend = [
  { month: "Dec", value: 142 }, { month: "Jan", value: 158 },
  { month: "Feb", value: 151 }, { month: "Mar", value: 169 },
  { month: "Apr", value: 174 }, { month: "May", value: 188 },
];

const MATERIAL_COLORS = ["#c9a84c", "#60a5fa", "#a78bfa", "#34d399", "rgba(255,255,255,0.2)"];

const SEV_COLOR: Record<string, string> = { warning: "#eab308", error: "#ef4444", success: "#22c55e", info: "#60a5fa" };
const STATUS_COLOR: Record<string, string> = {
  draft: "rgba(255,255,255,0.3)", scheduled: "#60a5fa", in_progress: "#eab308",
  macerating: "#a78bfa", quality_check: "#c9a84c", completed: "#22c55e",
  rejected: "#ef4444", cancelled: "rgba(255,255,255,0.2)",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  trend?: { value: string; up: boolean };
  href?: string;
  alert?: boolean;
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, iconColor, trend, href, alert, loading }: StatCardProps) {
  const inner = (
    <div
      className="glass-card"
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "border-color 0.15s, transform 0.15s",
        borderColor: alert ? "rgba(239,68,68,0.3)" : undefined,
        minHeight: 110,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${iconColor}18`, border: `1px solid ${iconColor}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        {trend && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: trend.up ? "#22c55e" : "#ef4444" }}>
            <TrendingUp size={12} style={{ transform: trend.up ? "none" : "scaleY(-1)" }} />
            {trend.value}
          </div>
        )}
      </div>
      <div>
        {loading ? (
          <div style={{ height: 32, display: "flex", alignItems: "center" }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: iconColor, opacity: 0.6 }} />
          </div>
        ) : (
          <div className="stat-number">{value}</div>
        )}
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none", display: "block" }}>{inner}</Link> : inner;
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardContent() {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build pie data from top formulas status distribution (fallback to placeholder)
  const materialDist = [
    { name: "Aroma Chemicals", value: 42, color: "#c9a84c" },
    { name: "Essential Oils",  value: 28, color: "#60a5fa" },
    { name: "Absolutes",       value: 15, color: "#a78bfa" },
    { name: "Musks",           value:  9, color: "#34d399" },
    { name: "Other",           value:  6, color: "rgba(255,255,255,0.2)" },
  ];

  const lowStock = stats?.low_stock_materials ?? [];
  const topFormulas = stats?.top_formulas ?? [];
  const notifications = stats?.recent_notifications ?? [];

  return (
    <div className="page-content" style={{ flex: 1 }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Materials"  value={stats?.total_materials ?? "—"}  icon={Package}     iconColor="#c9a84c" href="/inventory"   loading={loading} />
        <StatCard label="Low Stock"        value={stats?.low_stock_count ?? "—"}  icon={AlertTriangle} iconColor="#ef4444" href="/inventory" alert={!!stats && stats.low_stock_count > 0} loading={loading} />
        <StatCard label="Active Formulas"  value={stats?.total_formulas ?? "—"}   icon={FlaskConical} iconColor="#a78bfa" href="/formulas"   loading={loading} />
        <StatCard label="In Production"    value={stats?.active_productions ?? "—"} icon={Factory}   iconColor="#34d399" href="/production"  loading={loading} />
        <StatCard label="IFRA Pending"     value={stats?.ifra_pending ?? "—"}     icon={ShieldAlert}  iconColor="#f59e0b" href="/compliance"  loading={loading} />
        <StatCard label="Notifications"    value={notifications.filter((n) => !n.is_read).length || (loading ? "—" : "0")} icon={Bell} iconColor="#60a5fa" loading={loading} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Inventory Trend */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div className="section-title" style={{ fontSize: 15 }}>Inventory Trend</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                Total materials — current: <strong style={{ color: "#c9a84c" }}>{stats?.total_materials ?? "…"}</strong>
              </div>
            </div>
            <span className="badge badge-green"><Activity size={10} /> Live</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={inventoryTrend}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0b0b18", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, color: "#fff", fontSize: 12 }} itemStyle={{ color: "#c9a84c" }} />
              <Area type="monotone" dataKey="value" stroke="#c9a84c" strokeWidth={2} fill="url(#goldGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent productions */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="section-title" style={{ fontSize: 15 }}>Productions</div>
            <Link href="/production" style={{ fontSize: 11, color: "#c9a84c", textDecoration: "none" }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}><Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#c9a84c", opacity: 0.5 }} /></div>
          ) : stats?.recent_productions?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.recent_productions.slice(0, 5).map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[p.status] ?? "#888", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.formula_name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{p.order_number}</div>
                  </div>
                  <span style={{ fontSize: 10, color: STATUS_COLOR[p.status], fontWeight: 600, textTransform: "uppercase" }}>{p.status.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", paddingTop: 40 }}>No productions yet</div>
          )}
        </div>

        {/* Material Distribution */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ fontSize: 15 }}>Material Types</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>By category</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <PieChart width={120} height={120}>
              <Pie data={materialDist} cx={55} cy={55} innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={0}>
                {materialDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
            <div style={{ width: "100%", marginTop: 8 }}>
              {materialDist.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {/* Recent Notifications as activity feed */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="section-title" style={{ fontSize: 15 }}>Recent Activity</div>
            {notifications.some((n) => !n.is_read) && (
              <span className="badge badge-red" style={{ fontSize: 10 }}>{notifications.filter((n) => !n.is_read).length} new</span>
            )}
          </div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}><Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#c9a84c", opacity: 0.5 }} /></div>
          ) : notifications.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notifications.map((n) => {
                const color = SEV_COLOR[n.severity] ?? "#60a5fa";
                return (
                  <div key={n.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: n.is_read ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)", lineHeight: 1.4, fontWeight: n.is_read ? 400 : 600 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 4 }} />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", paddingTop: 40 }}>No recent activity</div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card" style={{ padding: 20, borderColor: lowStock.length > 0 ? "rgba(239,68,68,0.2)" : undefined }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="section-title" style={{ fontSize: 15 }}>Low Stock Alerts</div>
            <Link href="/inventory" style={{ fontSize: 11, color: "#c9a84c", textDecoration: "none" }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}><Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#ef4444", opacity: 0.5 }} /></div>
          ) : lowStock.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {lowStock.map((m) => {
                const pct = Math.round((m.stock / m.min) * 100);
                return (
                  <div key={m.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{m.name}</span>
                      <span style={{ fontSize: 11, color: m.stock <= 5 ? "#ef4444" : "#eab308", fontWeight: 600 }}>
                        {m.stock}{m.unit} / {m.min}{m.unit}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pct < 30 ? "#ef4444" : pct < 60 ? "#eab308" : "#22c55e" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 100, gap: 8 }}>
              <CheckCircle size={24} style={{ color: "#22c55e", opacity: 0.6 }} />
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>All stock levels healthy</div>
            </div>
          )}
        </div>

        {/* Top Formulas */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="section-title" style={{ fontSize: 15 }}>Formulas</div>
            <Link href="/formulas" style={{ fontSize: 11, color: "#c9a84c", textDecoration: "none" }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}><Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#a78bfa", opacity: 0.5 }} /></div>
          ) : topFormulas.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topFormulas.map((f, i) => (
                <Link key={f.id} href={`/formulas/${f.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", background: "rgba(255,255,255,0.025)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)", transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                  >
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(201,168,76,0.15)", color: "#c9a84c", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{f.batches} batches</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      <span className="badge badge-gold" style={{ fontSize: 10 }}>{f.type}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "capitalize" }}>{f.status.replace("_", " ")}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", paddingTop: 40 }}>No formulas yet</div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
