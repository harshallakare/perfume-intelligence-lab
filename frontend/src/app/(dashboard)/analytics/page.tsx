"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Loader2, FlaskConical, Package, Factory, TrendingUp, BarChart2,
  ShoppingCart, Wallet, Crown, Banknote,
} from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { formatNumber } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  kpis: {
    total_formulas:     number;
    formulas_mtd:       number;
    total_materials:    number;
    active_productions: number;
    productions_mtd:    number;
  };
  top_materials:       { name: string; uses: number }[];
  formulas_by_family:  { name: string; value: number; color: string }[];
  formulas_by_month:   { month: string; count: number }[];
  productions_by_month:{ month: string; count: number; completed: number }[];
}

interface SalesData {
  kpis: { revenue: number; profit: number; orders: number; aov: number; revenue_mtd: number; outstanding: number; units_sold: number };
  revenue_by_month:   { month: string; revenue: number; profit: number }[];
  best_sellers:       { name: string; units: number; revenue: number }[];
  top_customers:      { name: string; revenue: number; orders: number }[];
  revenue_by_channel: { name: string; value: number; color: string }[];
  orders_by_status:   { name: string; value: number; color: string }[];
}

const CHART_TOOLTIP: React.CSSProperties = {
  background: "#0b0b18",
  border: "1px solid rgba(201,168,76,0.3)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 12,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>{children}</div>;
}

function CenteredSpinner({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 300 }}>
      <Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: "#c9a84c" }} />
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{label}</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyChart({ height = 220, children }: { height?: number; children: React.ReactNode }) {
  return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: 13, textAlign: "center", padding: "0 16px" }}>{children}</div>;
}

// ─── Sales dashboard ────────────────────────────────────────────────────────

function SalesDashboard() {
  const { sym } = useSettings();
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/analytics/sales")
      .then((r) => (r.ok ? r.json() : Promise.reject("Failed")))
      .then(setData).catch((e) => setError(String(e))).finally(() => setLoading(false));
  }, []);

  if (loading) return <CenteredSpinner label="Loading sales analytics…" />;
  if (error || !data) return <div style={{ flex: 1, padding: 40, color: "#ef4444", fontSize: 14 }}>Failed to load sales analytics.</div>;

  const { kpis, revenue_by_month, best_sellers, top_customers, revenue_by_channel, orders_by_status } = data;
  const margin = kpis.revenue > 0 ? (kpis.profit / kpis.revenue) * 100 : 0;
  const money = (v: number) => `${sym}${formatNumber(v, 0)}`;
  const hasSales = kpis.orders > 0;

  const kpiCards = [
    { label: "Total Revenue",   value: money(kpis.revenue),     sub: `${money(kpis.revenue_mtd)} this month`,   icon: Banknote,     color: "#c9a84c" },
    { label: "Gross Profit",    value: money(kpis.profit),      sub: `${margin.toFixed(0)}% margin`,            icon: TrendingUp,   color: "#34d399" },
    { label: "Orders",          value: kpis.orders,             sub: `${kpis.units_sold} units sold`,           icon: ShoppingCart, color: "#60a5fa" },
    { label: "Avg Order Value", value: money(kpis.aov),         sub: `${money(kpis.outstanding)} outstanding`,  icon: Wallet,       color: "#a78bfa" },
  ];

  if (!hasSales) {
    return (
      <div className="glass-card" style={{ padding: "60px 24px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
        <ShoppingCart size={36} style={{ margin: "0 auto 14px", opacity: 0.5 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>No sales yet</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Create orders in the Orders module to see revenue, profit and best-seller trends here.</div>
      </div>
    );
  }

  return (
    <>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="glass-card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{kpi.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${kpi.color}18`, border: `1px solid ${kpi.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={13} style={{ color: kpi.color }} />
                </div>
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Row 1 — revenue/profit trend + channel mix */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <SectionLabel>Revenue &amp; Profit (6 months)</SectionLabel>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenue_by_month}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${sym}${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v, n) => [money(v as number), n === "revenue" ? "Revenue" : "Profit"]} />
              <Area type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2} fill="url(#revGrad)" dot={{ fill: "#c9a84c", r: 3 }} name="revenue" />
              <Area type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={2} fill="url(#proGrad)" dot={{ fill: "#34d399", r: 3 }} name="profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <SectionLabel>Revenue by Channel</SectionLabel>
          {revenue_by_channel.length === 0 ? <EmptyChart height={150}>No channel data</EmptyChart> : (
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <PieChart width={160} height={160}>
                  <Pie data={revenue_by_channel} cx={75} cy={75} innerRadius={42} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {revenue_by_channel.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v, n) => [money(v as number), n]} />
                </PieChart>
              </div>
              <div style={{ marginTop: 8 }}>
                {revenue_by_channel.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{money(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2 — best sellers + top customers + status */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <SectionLabel>Best Sellers (revenue)</SectionLabel>
          {best_sellers.length === 0 ? <EmptyChart height={200}>No product sales yet</EmptyChart> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={best_sellers} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${sym}${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                <YAxis dataKey="name" type="category" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v, _n, p) => [`${money(v as number)} · ${(p?.payload?.units ?? 0)} units`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#c9a84c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <SectionLabel>Top Customers</SectionLabel>
          {top_customers.length === 0 ? <EmptyChart height={200}>No customer orders yet</EmptyChart> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {top_customers.map((c, i) => {
                const max = top_customers[0].revenue || 1;
                return (
                  <div key={c.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 6 }}>
                        {i === 0 && <Crown size={11} style={{ color: "#c9a84c" }} />}{c.name}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#c9a84c" }}>{money(c.revenue)}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                      <div style={{ width: `${(c.revenue / max) * 100}%`, height: "100%", background: "linear-gradient(90deg,#c9a84c,#9b7b2a)", borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{c.orders} order{c.orders !== 1 ? "s" : ""}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <SectionLabel>Orders by Status</SectionLabel>
          {orders_by_status.length === 0 ? <EmptyChart height={150}>No orders yet</EmptyChart> : (
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <PieChart width={150} height={150}>
                  <Pie data={orders_by_status} cx={70} cy={70} innerRadius={38} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {orders_by_status.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v, n) => [`${v}`, n]} />
                </PieChart>
              </div>
              <div style={{ marginTop: 8 }}>
                {orders_by_status.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Operations dashboard (existing) ──────────────────────────────────────────

function OperationsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject("Failed")))
      .then(setData).catch((e) => setError(String(e))).finally(() => setLoading(false));
  }, []);

  if (loading) return <CenteredSpinner label="Loading analytics…" />;
  if (error || !data) return <div style={{ flex: 1, padding: 40, color: "#ef4444", fontSize: 14 }}>Failed to load analytics data.</div>;

  const { kpis, top_materials, formulas_by_family, formulas_by_month, productions_by_month } = data;

  const kpiCards = [
    { label: "Total Formulas",     value: kpis.total_formulas,     sub: `+${kpis.formulas_mtd} this month`,    icon: FlaskConical, color: "#c9a84c" },
    { label: "Total Materials",    value: kpis.total_materials,    sub: "raw materials in library",            icon: Package,      color: "#60a5fa" },
    { label: "Active Productions", value: kpis.active_productions, sub: `+${kpis.productions_mtd} created MTD`, icon: Factory,      color: "#a78bfa" },
    { label: "Formulas MTD",       value: kpis.formulas_mtd,       sub: "created this month",                  icon: TrendingUp,   color: "#34d399" },
    { label: "Productions MTD",    value: kpis.productions_mtd,    sub: "new orders this month",               icon: BarChart2,    color: "#f472b6" },
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="glass-card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{kpi.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${kpi.color}18`, border: `1px solid ${kpi.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={13} style={{ color: kpi.color }} />
                </div>
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <SectionLabel>Most Used Materials</SectionLabel>
          {top_materials.length === 0 ? <EmptyChart>No formula ingredients yet — create formulas first</EmptyChart> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={top_materials} layout="vertical" barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={CHART_TOOLTIP} itemStyle={{ color: "#c9a84c" }} formatter={(v) => [`${v} formulas`, "Uses"]} />
                <Bar dataKey="uses" fill="#c9a84c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <SectionLabel>Formula Creation (6 months)</SectionLabel>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={formulas_by_month}>
              <defs>
                <linearGradient id="frmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP} itemStyle={{ color: "#a78bfa" }} formatter={(v) => [`${v}`, "Formulas created"]} />
              <Area type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} fill="url(#frmGrad)" dot={{ fill: "#a78bfa", r: 3 }} name="Formulas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <SectionLabel>Monthly Production Activity (6 months)</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productions_by_month} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Bar dataKey="count" name="Total Orders" fill="#c9a84c" radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="completed" name="Completed" fill="rgba(34,197,94,0.6)" radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <SectionLabel>Formulas by Family</SectionLabel>
          {formulas_by_family.length === 0 ? <EmptyChart height={150}>No formulas yet</EmptyChart> : (
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <PieChart width={150} height={150}>
                  <Pie data={formulas_by_family} cx={70} cy={70} innerRadius={38} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {formulas_by_family.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v, n) => [`${v}`, n]} />
                </PieChart>
              </div>
              <div style={{ marginTop: 8 }}>
                {formulas_by_family.slice(0, 7).map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Page with tabs ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [tab, setTab] = useState<"sales" | "operations">("sales");
  const TABS: { id: "sales" | "operations"; label: string }[] = [
    { id: "sales", label: "Sales" },
    { id: "operations", label: "Operations" },
  ];

  return (
    <>
      <Header title="Analytics" subtitle="Sales performance, inventory trends & formula metrics" />
      <div className="page-content" style={{ flex: 1 }}>
        {/* Segmented control */}
        <div style={{ display: "inline-flex", gap: 2, padding: 4, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 22 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "7px 20px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                background: tab === t.id ? "rgba(201,168,76,0.15)" : "transparent",
                color: tab === t.id ? "#c9a84c" : "rgba(255,255,255,0.45)",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "sales" ? <SalesDashboard /> : <OperationsDashboard />}
      </div>
    </>
  );
}
