"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FlaskConical, Lock, Clock, CheckCircle, AlertCircle, GitBranch, Copy, Sparkles, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { concentrationLabel } from "@/lib/utils";
import { useSettings } from "@/context/settings-context";
import { exportCsv, printHtml, buildHtmlTable } from "@/lib/export";

interface FormulaCard {
  id: string;
  name: string;
  internal_code?: string;
  concentration_type: string;
  status: string;
  olfactory_family?: string;
  total_fragrance_pct?: number;
  ingredient_count: number;
  cost_per_ml?: number;
  version: number;
  is_ifra_compliant?: boolean;
  updated_at: string;
  gender_target?: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  draft:        { label: "Draft",        cls: "badge-muted",   icon: Clock },
  under_review: { label: "Under Review", cls: "badge-blue",    icon: AlertCircle },
  approved:     { label: "Approved",     cls: "badge-green",   icon: CheckCircle },
  locked:       { label: "Locked",       cls: "badge-gold",    icon: Lock },
  deprecated:   { label: "Deprecated",  cls: "badge-red",     icon: AlertCircle },
};

const GENDER_LABEL: Record<string, string> = { masculine: "M", feminine: "F", unisex: "U" };

export function FormulasContent() {
  const { sym } = useSettings();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [conFilter, setConFilter] = useState("All");
  const [formulas, setFormulas] = useState<FormulaCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/formulas")
      .then((r) => r.json())
      .then((data) => { setFormulas(Array.isArray(data) ? data : []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, height: 320, gap: 10, color: "rgba(255,255,255,0.4)" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        <span>Loading formulas…</span>
      </div>
    );
  }

  const filtered = formulas.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "All" && f.status !== statusFilter.toLowerCase().replace(" ", "_")) return false;
    if (conFilter !== "All" && f.concentration_type !== conFilter) return false;
    return true;
  });

  return (
    <div className="page-content" style={{ flex: 1 }}>
      {/* Action bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <div style={{ position: "relative", maxWidth: 260 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
          <input className="input-base" style={{ paddingLeft: 32 }} placeholder="Search formulas…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select-base" style={{ width: 140 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {["All", "Draft", "Under Review", "Approved", "Locked"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="select-base" style={{ width: 130 }} value={conFilter} onChange={(e) => setConFilter(e.target.value)}>
          {["All", "edt", "edp", "parfum", "extrait", "attar"].map((c) => <option key={c} value={c}>{c === "All" ? "All Types" : concentrationLabel(c)}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button
          className="btn-ghost"
          style={{ height: 36 }}
          onClick={() => exportCsv(
            formulas.map((f) => ({
              name: f.name,
              code: f.internal_code ?? "",
              type: f.concentration_type,
              status: f.status,
              family: f.olfactory_family ?? "",
              gender: f.gender_target ?? "",
              fragrance_pct: f.total_fragrance_pct ?? "",
              ingredients: f.ingredient_count,
              cost_per_ml: f.cost_per_ml ?? "",
              version: f.version,
              ifra_compliant: f.is_ifra_compliant === true ? "yes" : f.is_ifra_compliant === false ? "no" : "",
              updated: f.updated_at,
            })),
            "formulas_export"
          )}
        >
          <Download size={13} /> CSV
        </button>
        <button
          className="btn-ghost"
          style={{ height: 36 }}
          onClick={() => {
            const cols = [
              { key: "name", label: "Formula" },
              { key: "code", label: "Code" },
              { key: "type", label: "Type" },
              { key: "status", label: "Status" },
              { key: "family", label: "Family" },
              { key: "fragrance_pct", label: "Frag %" },
              { key: "ingredients", label: "Ingredients" },
              { key: "cost_per_ml", label: "Cost/ml" },
              { key: "version", label: "Version" },
              { key: "ifra_compliant", label: "IFRA" },
            ];
            const rows = formulas.map((f) => ({
              name: f.name,
              code: f.internal_code ?? "—",
              type: concentrationLabel(f.concentration_type),
              status: f.status,
              family: f.olfactory_family ?? "—",
              fragrance_pct: f.total_fragrance_pct ? `${f.total_fragrance_pct}%` : "—",
              ingredients: f.ingredient_count,
              cost_per_ml: f.cost_per_ml ? `${sym}${f.cost_per_ml.toFixed(2)}` : "—",
              version: `v${f.version}`,
              ifra_compliant: f.is_ifra_compliant === true ? "✓" : f.is_ifra_compliant === false ? "✗" : "—",
            }));
            printHtml(buildHtmlTable(rows, cols), { title: "Formula Library", subtitle: `${rows.length} formulas · Exported ${new Date().toLocaleDateString()}` });
          }}
        >
          <Download size={13} /> PDF
        </button>
        <Link href="/ai-assistant" className="btn-secondary" style={{ height: 36, textDecoration: "none" }}>
          <Sparkles size={13} /> AI Generate
        </Link>
        <Link href="/formulas/new" className="btn-primary" style={{ height: 36, textDecoration: "none" }}>
          <Plus size={13} /> New Formula
        </Link>
      </div>

      {/* Formula grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {filtered.map((f) => {
          const statusCfg = STATUS_CONFIG[f.status] ?? STATUS_CONFIG.draft;
          const StatusIcon = statusCfg.icon;
          const compliance = f.is_ifra_compliant === true ? "badge-green" : f.is_ifra_compliant === false ? "badge-red" : "badge-muted";
          const complianceLabel = f.is_ifra_compliant === true ? "IFRA ✓" : f.is_ifra_compliant === false ? "IFRA ✗" : "Not checked";

          return (
            <Link
              key={f.id}
              href={`/formulas/${f.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="glass-card"
                style={{
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  transition: "border-color 0.15s, transform 0.15s",
                  cursor: "pointer",
                  borderColor: f.status === "locked" ? "rgba(201,168,76,0.2)" : undefined,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <FlaskConical size={14} style={{ color: "#c9a84c", flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </span>
                    </div>
                    {f.internal_code && (
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{f.internal_code}</div>
                    )}
                  </div>
                  <span className={`badge ${statusCfg.cls}`}>
                    <StatusIcon size={10} /> {statusCfg.label}
                  </span>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  <span className="badge badge-gold">{concentrationLabel(f.concentration_type)}</span>
                  {f.olfactory_family && (
                    <span className="badge badge-muted" style={{ textTransform: "capitalize" }}>{f.olfactory_family}</span>
                  )}
                  {f.gender_target && (
                    <span className="badge badge-purple">{GENDER_LABEL[f.gender_target]}</span>
                  )}
                  <span className={`badge ${compliance}`}>{complianceLabel}</span>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Fragrance", value: `${f.total_fragrance_pct ?? "—"}%` },
                    { label: "Ingredients", value: f.ingredient_count },
                    { label: "Cost/ml", value: f.cost_per_ml ? `${sym}${f.cost_per_ml.toFixed(2)}` : "—" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.025)", borderRadius: 7, padding: "7px 10px" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    <GitBranch size={11} /> v{f.version}
                    <span style={{ marginLeft: 6 }}>Updated {f.updated_at}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.preventDefault()}>
                    <button className="btn-ghost" style={{ padding: "3px 8px", fontSize: 12 }}>
                      <Copy size={12} /> Clone
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "rgba(255,255,255,0.35)" }}>
          <FlaskConical size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <div>No formulas match your filters</div>
        </div>
      )}
    </div>
  );
}
