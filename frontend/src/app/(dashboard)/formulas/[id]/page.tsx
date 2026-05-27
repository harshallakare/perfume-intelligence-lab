"use client";

import { useState, useEffect, use } from "react";
import {
  ArrowLeft, FlaskConical, ShieldCheck, ShieldX, Lock, Unlock,
  History, DownloadCloud, Loader2, Edit2, AlertTriangle, CheckCircle2,
  Clock, Package, User2, Calendar, Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { concentrationLabel } from "@/lib/utils";
import { buildHtmlTable, printHtml, exportCsv } from "@/lib/export";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Ingredient {
  id: string;
  raw_material_id: string;
  name: string;
  cas_number?: string;
  odor_family?: string;
  section: string;
  percentage: number;
  sort_order: number;
  perfumer_notes?: string;
  cost_per_kg?: number;
}

interface Version {
  id: string;
  version_num: number;
  change_note?: string;
  created_at: string;
}

interface Formula {
  id: string;
  name: string;
  internal_code?: string;
  concentration_type: string;
  status: string;
  olfactory_family?: string;
  gender_target?: string;
  total_fragrance_pct: number;
  cost_per_ml?: number;
  is_ifra_compliant?: boolean | null;
  description?: string;
  perfumer_notes?: string;
  version: number;
  ingredient_count: number;
  production_count?: number;
  ingredients: Ingredient[];
  versions: Version[];
  created_at: string;
  updated_at: string;
}

// ─── Section meta ──────────────────────────────────────────────────────────

const SECTION_META: Record<string, { label: string; color: string }> = {
  top_note:       { label: "Top Notes",    color: "#60a5fa" },
  middle_note:    { label: "Middle Notes", color: "#a78bfa" },
  base_note:      { label: "Base Notes",   color: "#c9a84c" },
  modifier:       { label: "Modifiers",    color: "#34d399" },
  trace_molecule: { label: "Trace",        color: "rgba(255,255,255,0.4)" },
};

const SECTION_ORDER = ["top_note", "middle_note", "base_note", "modifier", "trace_molecule"];

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     color: "#94a3b8", icon: Clock        },
  active:    { label: "Active",    color: "#22c55e", icon: CheckCircle2 },
  locked:    { label: "Locked",    color: "#c9a84c", icon: Lock         },
  archived:  { label: "Archived",  color: "rgba(255,255,255,0.3)", icon: Package },
  rejected:  { label: "Rejected",  color: "#ef4444", icon: AlertTriangle },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h}h ago`;
  const m = Math.floor(diff / 60000);
  return m > 0 ? `${m}m ago` : "just now";
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FormulaDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();

  const [formula, setFormula] = useState<Formula | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus,  setUpdatingStatus]  = useState(false);
  const [activeTab,       setActiveTab]       = useState<"ingredients" | "history">("ingredients");
  const [deleteConfirm,   setDeleteConfirm]   = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [deleteError,     setDeleteError]     = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/formulas/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("Not found")))
      .then(setFormula)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async (newStatus: string) => {
    if (!formula) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/formulas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, change_note: `Status changed to ${newStatus}` }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFormula((prev) => prev ? { ...prev, status: updated.status, version: updated.version } : prev);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteFormula = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/formulas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to delete formula" }));
        setDeleteError(body.error ?? "Failed to delete formula");
        return;
      }
      router.push("/formulas");
    } catch {
      setDeleteError("Failed to delete formula. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!formula) return;
    exportCsv(
      formula.ingredients.map((i) => ({
        Section: SECTION_META[i.section]?.label ?? i.section,
        Material: i.name,
        "CAS Number": i.cas_number ?? "",
        "Odor Family": i.odor_family ?? "",
        "% in Formula": i.percentage,
        "Notes": i.perfumer_notes ?? "",
      })),
      `${formula.name.replace(/\s+/g, "_")}_ingredients.csv`
    );
  };

  const handleExportPdf = () => {
    if (!formula) return;
    printHtml(
      `<h2 style="font-family:Georgia,serif">${formula.name}</h2>
       <p style="color:#666;margin-bottom:16px">${concentrationLabel(formula.concentration_type)} · v${formula.version} · ${formula.status}</p>` +
      buildHtmlTable(
        formula.ingredients.map((i) => ({
          Section: SECTION_META[i.section]?.label ?? i.section,
          Material: i.name,
          "CAS": i.cas_number ?? "—",
          "%": `${i.percentage}%`,
        }))
      ),
      { title: `${formula.name} — Formula Sheet` }
    );
  };

  // ── Loading / error ──
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 60px)", gap: 12 }}>
        <Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: "#c9a84c" }} />
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading formula…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !formula) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 60px)", gap: 16 }}>
        <AlertTriangle size={36} style={{ color: "#ef4444" }} />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Formula not found or failed to load.</p>
        <Link href="/formulas" className="btn-secondary" style={{ textDecoration: "none" }}>
          <ArrowLeft size={14} /> Back to Formulas
        </Link>
      </div>
    );
  }

  const statusMeta = STATUS_META[formula.status] ?? STATUS_META.draft;
  const StatusIcon = statusMeta.icon;
  const bySection = SECTION_ORDER.map((sec) => ({
    section: sec,
    meta: SECTION_META[sec],
    items: formula.ingredients.filter((i) => i.section === sec),
  })).filter((g) => g.items.length > 0);

  const ifraIcon = formula.is_ifra_compliant === true
    ? <ShieldCheck size={14} style={{ color: "#22c55e" }} />
    : formula.is_ifra_compliant === false
    ? <ShieldX size={14} style={{ color: "#ef4444" }} />
    : <ShieldCheck size={14} style={{ color: "rgba(255,255,255,0.3)" }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", overflow: "hidden" }}>

      {/* ── Header bar ── */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0, flexWrap: "wrap" }}>
        <button className="btn-ghost" style={{ padding: "6px 10px" }} onClick={() => router.push("/formulas")}>
          <ArrowLeft size={15} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 400 }}>
              {formula.name}
            </h1>
            {formula.internal_code && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{formula.internal_code}</span>
            )}
            <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)" }}>
              {concentrationLabel(formula.concentration_type)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${statusMeta.color}18`, color: statusMeta.color, border: `1px solid ${statusMeta.color}30` }}>
              <StatusIcon size={11} /> {statusMeta.label}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 11, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {ifraIcon} {formula.is_ifra_compliant === true ? "IFRA OK" : formula.is_ifra_compliant === false ? "IFRA Issue" : "IFRA Pending"}
            </span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>v{formula.version}</span>
            {formula.olfactory_family && <span style={{ textTransform: "capitalize" }}>{formula.olfactory_family}</span>}
            {formula.gender_target && <span style={{ textTransform: "capitalize" }}>{formula.gender_target}</span>}
            <span>{formula.ingredient_count} ingredient{formula.ingredient_count !== 1 ? "s" : ""}</span>
            <span>Updated {timeAgo(formula.updated_at)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button className="btn-ghost" style={{ height: 34, padding: "0 12px", fontSize: 12 }} onClick={handleExportCsv}>
            <DownloadCloud size={13} /> CSV
          </button>
          <button className="btn-ghost" style={{ height: 34, padding: "0 12px", fontSize: 12 }} onClick={handleExportPdf}>
            <DownloadCloud size={13} /> PDF
          </button>
          {formula.status === "draft" && (
            <button className="btn-secondary" style={{ height: 34 }} onClick={() => changeStatus("active")} disabled={updatingStatus}>
              {updatingStatus ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={13} />}
              Approve
            </button>
          )}
          {formula.status === "active" && (
            <button className="btn-secondary" style={{ height: 34 }} onClick={() => changeStatus("locked")} disabled={updatingStatus}>
              {updatingStatus ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Lock size={13} />}
              Lock
            </button>
          )}
          {formula.status === "locked" && (
            <button className="btn-ghost" style={{ height: 34 }} onClick={() => changeStatus("active")} disabled={updatingStatus}>
              <Unlock size={13} /> Unlock
            </button>
          )}
          <button
            className="btn-ghost"
            style={{ height: 34, color: "rgba(239,68,68,0.7)", borderColor: "rgba(239,68,68,0.2)" }}
            onClick={() => { setDeleteConfirm(true); setDeleteError(null); }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 300px", gap: 0 }}>

        {/* ── Left: ingredients + history ── */}
        <div style={{ overflowY: "auto", padding: "20px 24px" }}>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: 3, width: "fit-content", marginBottom: 20 }}>
            {([
              { id: "ingredients", label: "Ingredients", icon: FlaskConical },
              { id: "history",     label: "Version History", icon: History    },
            ] as const).map(({ id: tabId, label, icon: Icon }) => (
              <button key={tabId} onClick={() => setActiveTab(tabId)} style={{
                padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                background: activeTab === tabId ? "rgba(201,168,76,0.15)" : "transparent",
                color: activeTab === tabId ? "#c9a84c" : "rgba(255,255,255,0.45)",
                fontSize: 12, fontWeight: activeTab === tabId ? 700 : 400,
                display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
              }}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>

          {/* ── Ingredients tab ── */}
          {activeTab === "ingredients" && (
            <>
              {formula.ingredients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                  No ingredients recorded for this formula.
                </div>
              ) : (
                bySection.map(({ section, meta, items }) => (
                  <div key={section} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: meta.color }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {meta.label}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                        {items.reduce((s, i) => s + i.percentage, 0).toFixed(2)}%
                      </span>
                    </div>
                    <div className="glass-card" style={{ overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            {["Material", "CAS", "Odor Family", "%", "Notes"].map((h, i) => (
                              <th key={h} style={{ padding: "8px 14px", textAlign: i >= 3 ? "right" : "left", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((ing, idx) => (
                            <tr key={ing.id} style={{ borderBottom: idx < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                              <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#ffffff" }}>{ing.name}</td>
                              <td style={{ padding: "10px 14px", fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.35)" }}>{ing.cas_number || "—"}</td>
                              <td style={{ padding: "10px 14px", fontSize: 12, color: "rgba(255,255,255,0.45)", textTransform: "capitalize" }}>{ing.odor_family || "—"}</td>
                              <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: meta.color }}>{ing.percentage}%</td>
                              <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {ing.perfumer_notes || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ── Version history tab ── */}
          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {formula.versions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                  No version history yet.
                </div>
              ) : (
                formula.versions.map((v) => (
                  <div key={v.id} className="glass-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#c9a84c" }}>v{v.version_num}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
                        {v.change_note || `Version ${v.version_num}`}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                        {new Date(v.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{timeAgo(v.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar: formula info ── */}
        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Summary stats */}
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Formula Summary</div>
            {[
              { label: "Fragrance %", value: `${formula.total_fragrance_pct?.toFixed(2) ?? 0}%` },
              { label: "Alcohol %", value: `${(100 - (formula.total_fragrance_pct ?? 0)).toFixed(2)}%` },
              { label: "Cost / ml", value: formula.cost_per_ml != null ? `$${formula.cost_per_ml.toFixed(4)}` : "—" },
              { label: "Ingredients", value: formula.ingredient_count },
              { label: "Version", value: `v${formula.version}` },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Note distribution */}
          {formula.ingredients.length > 0 && (
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Note Distribution</div>
              {bySection.map(({ section, meta, items }) => {
                const pct = items.reduce((s, i) => s + i.percentage, 0);
                const totalPct = formula.total_fragrance_pct || 1;
                return (
                  <div key={section} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: meta.color }}>{meta.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{pct.toFixed(2)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((pct / totalPct) * 100, 100)}%`, background: meta.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Meta */}
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Details</div>
            {[
              { label: "Concentration", value: concentrationLabel(formula.concentration_type), icon: FlaskConical },
              { label: "Gender", value: formula.gender_target ?? "unspecified", icon: User2 },
              { label: "Family", value: formula.olfactory_family ?? "—", icon: FlaskConical },
              { label: "Created", value: new Date(formula.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), icon: Calendar },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", textTransform: "capitalize" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Description / perfumer notes */}
          {(formula.description || formula.perfumer_notes) && (
            <div className="glass-card" style={{ padding: 16 }}>
              {formula.description && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Description</div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0, marginBottom: formula.perfumer_notes ? 14 : 0 }}>{formula.description}</p>
                </>
              )}
              {formula.perfumer_notes && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Perfumer Notes</div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>{formula.perfumer_notes}</p>
                </>
              )}
            </div>
          )}

          <Link
            href={`/formulas/new?edit=${formula.id}`}
            className="btn-secondary"
            style={{ textDecoration: "none", justifyContent: "center", padding: "10px 16px", fontSize: 13 }}
          >
            <Edit2 size={13} /> Edit Formula
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="glass-elevated" style={{ width: "100%", maxWidth: 440 }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={16} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Delete Formula</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>This action cannot be undone</div>
              </div>
            </div>

            <div style={{ padding: "18px 24px" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0 }}>
                Are you sure you want to delete{" "}
                <span style={{ color: "#fff", fontWeight: 600 }}>{formula.name}</span>?
                {" "}All ingredients and version history will be permanently removed.
              </p>
              {deleteError && (
                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <AlertTriangle size={14} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>{deleteError}</span>
                </div>
              )}
            </div>

            <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => { setDeleteConfirm(false); setDeleteError(null); }} disabled={deleteLoading}>
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
                onClick={handleDeleteFormula}
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
