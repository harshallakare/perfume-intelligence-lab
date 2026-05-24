"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Loader2, FlaskConical, Package, Factory, TrendingUp, BarChart2 } from "lucide-react";

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

const CHART_TOOLTIP: React.CSSProperties = {
  background: "#0b0b18",
  border: "1px solid rgba(201,168,76,0.3)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 12,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject("Failed")))
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Analytics" subtitle="Inventory trends, formula performance & business metrics" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: "#c9a84c" }} />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading analytics…</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header title="Analytics" subtitle="Inventory trends, formula performance & business metrics" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#ef4444", fontSize: 14 }}>Failed to load analytics data.</span>
        </div>
      </>
    );
  }

  const { kpis, top_materials, formulas_by_family, formulas_by_month, productions_by_month } = data;

  const kpiCards = [
    { label: "Total Formulas",      value: kpis.total_formulas,     sub: `+${kpis.formulas_mtd} this month`,     icon: FlaskConical,  color: "#c9a84c" },
    { label: "Total Materials",     value: kpis.total_materials,    sub: "raw materials in library",              icon: Package,       color: "#60a5fa" },
    { label: "Active Productions",  value: kpis.active_productions, sub: `+${kpis.productions_mtd} created MTD`, icon: Factory,       color: "#a78bfa" },
    { label: "Formulas MTD",        value: kpis.formulas_mtd,       sub: "created this month",                   icon: TrendingUp,    color: "#34d399" },
    { label: "Productions MTD",     value: kpis.productions_mtd,    sub: "new orders this month",                icon: BarChart2,     color: "#f472b6" },
  ];

  return (
    <>
      <Header title="Analytics" subtitle="Inventory trends, formula performance & business metrics" />
      <div className="page-content" style={{ flex: 1 }}>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="glass-card" style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {kpi.label}
                  </span>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${kpi.color}18`, border: `1px solid ${kpi.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={13} style={{ color: kpi.color }} />
                  </div>
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: kpi.color }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Charts row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Most used materials */}
          <div className="glass-card" style={{ padding: 20 }}>
            <SectionLabel>Most Used Materials</SectionLabel>
            {top_materials.length === 0 ? (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                No formula ingredients yet — create formulas first
              </div>
            ) : (
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

          {/* Formula creation trend */}
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

        {/* Charts row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>

          {/* Monthly production activity */}
          <div className="glass-card" style={{ padding: 20 }}>
            <SectionLabel>Monthly Production Activity (6 months)</SectionLabel>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productions_by_month} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Bar dataKey="count"     name="Total Orders"    fill="#c9a84c"              radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="completed" name="Completed"       fill="rgba(34,197,94,0.6)"  radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Formulas by olfactory family */}
          <div className="glass-card" style={{ padding: 20 }}>
            <SectionLabel>Formulas by Family</SectionLabel>
            {formulas_by_family.length === 0 ? (
              <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                No formulas yet
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <PieChart width={150} height={150}>
                    <Pie
                      data={formulas_by_family}
                      cx={70} cy={70}
                      innerRadius={38} outerRadius={65}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {formulas_by_family.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
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
      </div>
    </>
  );
}
