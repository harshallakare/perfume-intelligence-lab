"use client";

import { Header } from "@/components/layout/header";
import { ShieldCheck, ShieldAlert, ShieldX, FileText, ChevronRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const COMPLIANCE_ITEMS = [
  { id: "1", formula: "Dark Amber Oud", version: "v4", category: "Cat 11a (Fine Fragrance)", status: "pass", checked_at: "2026-05-20", issues: 0 },
  { id: "2", formula: "Midnight Leather", version: "v2", category: "Cat 11a (Fine Fragrance)", status: "fail", checked_at: "2026-05-19", issues: 2 },
  { id: "3", formula: "Rose de Mai Clone", version: "v1", category: "Cat 11a (Fine Fragrance)", status: "pending", checked_at: null, issues: 0 },
  { id: "4", formula: "Aqua Metallica", version: "v3", category: "Cat 11a (Fine Fragrance)", status: "pass", checked_at: "2026-05-18", issues: 0 },
  { id: "5", formula: "Santal Dream", version: "v1", category: "Cat 11a (Fine Fragrance)", status: "warning", checked_at: "2026-05-17", issues: 1 },
];

const ALERTS = [
  { material: "Birch Tar", usage: "5.0%", limit: "1.2%", formula: "Midnight Leather", severity: "fail" },
  { material: "Eugenol (from Clove EO)", usage: "0.8%", limit: "0.5%", formula: "Midnight Leather", severity: "fail" },
  { material: "Linalool", usage: "14.2%", limit: "15.0%", formula: "Santal Dream", severity: "warning" },
];

export default function CompliancePage() {
  const passCount = COMPLIANCE_ITEMS.filter((c) => c.status === "pass").length;
  const failCount = COMPLIANCE_ITEMS.filter((c) => c.status === "fail").length;
  const pendingCount = COMPLIANCE_ITEMS.filter((c) => c.status === "pending").length;

  return (
    <>
      <Header title="IFRA Compliance" subtitle="51st Amendment validation & allergen tracking" />
      <div className="page-content" style={{ flex: 1 }}>
        {/* Summary */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Compliant", value: passCount, icon: ShieldCheck, color: "#22c55e" },
            { label: "Violations", value: failCount, icon: ShieldX, color: "#ef4444" },
            { label: "Pending Check", value: pendingCount, icon: ShieldAlert, color: "#eab308" },
            { label: "Amendment", value: "51st", icon: FileText, color: "#60a5fa" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="glass-card" style={{ padding: "14px 18px", flex: 1, display: "flex", alignItems: "center", gap: 10, borderColor: s.color === "#ef4444" && failCount > 0 ? "rgba(239,68,68,0.2)" : undefined }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={17} style={{ color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "Georgia, serif" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
          {/* Formula compliance table */}
          <div>
            <div className="glass-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>Formula Compliance Status</div>
                <button className="btn-primary" style={{ height: 30, fontSize: 12 }}>
                  <ShieldCheck size={12} /> Run All Checks
                </button>
              </div>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Formula</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Issues</th>
                    <th>Last Checked</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {COMPLIANCE_ITEMS.map((c) => {
                    const icon = c.status === "pass" ? CheckCircle : c.status === "fail" ? XCircle : c.status === "warning" ? AlertTriangle : ShieldAlert;
                    const color = c.status === "pass" ? "#22c55e" : c.status === "fail" ? "#ef4444" : c.status === "warning" ? "#eab308" : "rgba(255,255,255,0.4)";
                    const cls = c.status === "pass" ? "badge-green" : c.status === "fail" ? "badge-red" : c.status === "warning" ? "badge-yellow" : "badge-muted";
                    const Icon = icon;
                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ color: "#ffffff", fontWeight: 500 }}>{c.formula}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{c.version}</div>
                        </td>
                        <td style={{ fontSize: 12 }}>{c.category}</td>
                        <td>
                          <span className={`badge ${cls}`}>
                            <Icon size={10} /> {c.status === "pass" ? "Compliant" : c.status === "fail" ? "Violation" : c.status === "warning" ? "Warning" : "Pending"}
                          </span>
                        </td>
                        <td>
                          {c.issues > 0 ? (
                            <span style={{ color: "#ef4444", fontWeight: 600, fontSize: 13 }}>{c.issues}</span>
                          ) : c.status === "pending" ? (
                            <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
                          ) : (
                            <span style={{ color: "#22c55e" }}>0</span>
                          )}
                        </td>
                        <td style={{ fontSize: 12 }}>{c.checked_at ?? "Not checked"}</td>
                        <td>
                          <button className="btn-ghost" style={{ padding: "4px 8px" }}>
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Violations panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="glass-card" style={{ padding: 18, borderColor: "rgba(239,68,68,0.2)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <XCircle size={14} /> Active Violations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ALERTS.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px 14px",
                      background: a.severity === "fail" ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.08)",
                      border: `1px solid ${a.severity === "fail" ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.2)"}`,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", marginBottom: 6 }}>{a.material}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Usage: <span style={{ color: "#ef4444", fontWeight: 600 }}>{a.usage}</span></div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Limit: <span style={{ color: "#22c55e" }}>{a.limit}</span></div>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>in {a.formula}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                IFRA 51st Amendment
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                Currently validating against the <span style={{ color: "#c9a84c" }}>51st Amendment</span>, effective January 2023.
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="btn-secondary" style={{ fontSize: 12, flex: 1, justifyContent: "center" }}>
                  <FileText size={12} /> View Restrictions
                </button>
                <button className="btn-ghost" style={{ fontSize: 12, flex: 1, justifyContent: "center" }}>
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
