"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/context/settings-context";
import {
  Building2, User, Brain, Bell, Shield, BookOpen, Plug, CreditCard,
  Save, Eye, EyeOff, Plus, Trash2, Check, AlertTriangle, ChevronRight,
  Key, Globe, Clock, DollarSign, Mail, Smartphone, Webhook, RefreshCw,
  Copy, FlaskConical, Lock, Database, Server, Wifi, WifiOff,
  Terminal, Loader2, RotateCcw, ShieldAlert, ChevronDown,
  Download, Upload, HardDrive,
} from "lucide-react";

/* ─── section registry ──────────────────────────────────────────────── */
type SectionId =
  | "organization" | "profile" | "ai-providers" | "notifications"
  | "security" | "regulatory" | "integrations" | "billing" | "database";

interface Section { id: SectionId; label: string; icon: React.ElementType; badge?: string }

const SECTIONS: Section[] = [
  { id: "organization",  label: "Organization",   icon: Building2  },
  { id: "profile",       label: "Profile",         icon: User       },
  { id: "ai-providers",  label: "AI Providers",    icon: Brain      },
  { id: "notifications", label: "Notifications",   icon: Bell       },
  { id: "security",      label: "Security",        icon: Shield     },
  { id: "regulatory",    label: "Regulatory",      icon: BookOpen   },
  { id: "integrations",  label: "Integrations",    icon: Plug       },
  { id: "database",      label: "Database",        icon: Database   },
  { id: "billing",       label: "Billing",         icon: CreditCard, badge: "Pro" },
];

/* ─── tiny helpers ──────────────────────────────────────────────────── */
function SettingRow({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 24, padding: "18px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card" style={{ padding: "24px 28px", marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: value ? "#c9a84c" : "rgba(255,255,255,0.1)",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3,
        left: value ? 21 : 3,
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }} />
    </button>
  );
}

function ApiKeyField({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const masked = "sk-••••••••••••••••••••••••" + value.slice(-4);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{
        flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
        fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "monospace",
      }}>
        {visible ? value : masked}
      </div>
      <button className="btn-ghost" style={{ padding: "8px 10px" }} onClick={() => setVisible(!visible)}>
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button className="btn-ghost" style={{ padding: "8px 10px", color: copied ? "#22c55e" : undefined }} onClick={copy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

/* ─── SECTION: Organization ─────────────────────────────────────────── */
function OrganizationSection() {
  const { currency: ctxCurrency, setCurrency } = useSettings();
  const [org, setOrg] = useState({
    name: "",
    slug: "",
    website: "",
    address: "",
    country: "IN",
    timezone: "Asia/Kolkata",
    currency: ctxCurrency,
    fiscalYearStart: "04",
    logo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState("");

  // Load from DB on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setOrg((prev) => ({
          ...prev,
          name:            data.name            ?? prev.name,
          slug:            data.slug            ?? prev.slug,
          website:         data.website         ?? prev.website,
          address:         data.address         ?? prev.address,
          country:         data.country         ?? prev.country,
          timezone:        data.timezone        ?? prev.timezone,
          currency:        data.currency        ?? prev.currency,
          fiscalYearStart: data.fiscal_year_start ?? prev.fiscalYearStart,
        }));
        // Sync currency into app context from DB value
        if (data.currency) setCurrency(data.currency);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveErr("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:              org.name,
          currency:          org.currency,
          timezone:          org.timezone,
          country:           org.country,
          website:           org.website,
          address:           org.address,
          fiscal_year_start: org.fiscalYearStart,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCurrency(org.currency);   // propagate to context + localStorage
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveErr("Save failed — please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionCard title="General">
        <SettingRow label="Organization Name" hint="Shown in reports and exports">
          <input className="input-base" value={org.name}
            onChange={e => setOrg(p => ({ ...p, name: e.target.value }))} />
        </SettingRow>
        <SettingRow label="Slug / Handle" hint="URL-safe identifier (cannot be changed)">
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <span style={{ padding: "8px 12px", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)", borderRight: "none",
              borderRadius: "8px 0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              app.pilhouse.com /
            </span>
            <input className="input-base" value={org.slug} disabled
              style={{ borderRadius: "0 8px 8px 0", opacity: 0.5, cursor: "not-allowed" }} />
          </div>
        </SettingRow>
        <SettingRow label="Website">
          <input className="input-base" value={org.website}
            onChange={e => setOrg(p => ({ ...p, website: e.target.value }))} />
        </SettingRow>
        <SettingRow label="Address">
          <textarea className="input-base" rows={2} value={org.address}
            onChange={e => setOrg(p => ({ ...p, address: e.target.value }))}
            style={{ resize: "vertical" }} />
        </SettingRow>
        <SettingRow label="Country">
          <select className="select-base" value={org.country}
            onChange={e => setOrg(p => ({ ...p, country: e.target.value }))}>
            <option value="IN">India</option>
            <option value="US">United States</option>
            <option value="FR">France</option>
            <option value="AE">UAE</option>
            <option value="GB">United Kingdom</option>
            <option value="DE">Germany</option>
          </select>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Locale & Currency">
        <SettingRow label="Timezone" hint="Used for reports and scheduled jobs">
          <select className="select-base" value={org.timezone}
            onChange={e => setOrg(p => ({ ...p, timezone: e.target.value }))}>
            <option value="Asia/Kolkata">Asia/Kolkata (IST UTC+5:30)</option>
            <option value="UTC">UTC</option>
            <option value="Europe/Paris">Europe/Paris (CET)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST UTC+4)</option>
          </select>
        </SettingRow>
        <SettingRow label="Currency" hint="Used in costing, invoices, and reports">
          <select className="select-base" value={org.currency}
            onChange={e => setOrg(p => ({ ...p, currency: e.target.value }))}>
            <option value="INR">INR — Indian Rupee (₹)</option>
            <option value="USD">USD — US Dollar ($)</option>
            <option value="EUR">EUR — Euro (€)</option>
            <option value="GBP">GBP — British Pound (£)</option>
            <option value="AED">AED — UAE Dirham (د.إ)</option>
          </select>
        </SettingRow>
        <SettingRow label="Fiscal Year Start">
          <select className="select-base" value={org.fiscalYearStart}
            onChange={e => setOrg(p => ({ ...p, fiscalYearStart: e.target.value }))}>
            {["01","02","03","04","07","10"].map(m => (
              <option key={m} value={m}>
                {new Date(2024, parseInt(m)-1).toLocaleString("en", { month: "long" })}
              </option>
            ))}
          </select>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Branding">
        <SettingRow label="Logo" hint="PNG/SVG recommended, min 200×200 px">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: 10,
              background: "linear-gradient(135deg,#c9a84c,#9b7b2a)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FlaskConical size={24} color="#0a0600" />
            </div>
            <div>
              <button className="btn-secondary" style={{ fontSize: 12 }}>Upload New Logo</button>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                Max 2 MB · PNG, SVG, WebP
              </div>
            </div>
          </div>
        </SettingRow>
      </SectionCard>

      {saveErr && (
        <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
          {saveErr}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        {loading && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Loading from DB…</span>}
        <button className="btn-primary" onClick={save} disabled={saving || loading}>
          {saving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> :
           saved  ? <><Check size={14} /> Saved!</> :
                    <><Save size={14} /> Save Changes</>}
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

/* ─── SECTION: Profile ──────────────────────────────────────────────── */
function ProfileSection() {
  const [profile, setProfile] = useState({
    firstName: "Admin", lastName: "User",
    email: "admin@pilhouse.com", phone: "+91 98765 43210",
    title: "Head Perfumer", department: "Formulation",
    bio: "Leading product development and fragrance innovation at PIL House.",
  });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <SectionCard title="Personal Information">
        <SettingRow label="Full Name">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input className="input-base" placeholder="First name" value={profile.firstName}
              onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
            <input className="input-base" placeholder="Last name" value={profile.lastName}
              onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
          </div>
        </SettingRow>
        <SettingRow label="Email" hint="Used for login and notifications">
          <input className="input-base" type="email" value={profile.email}
            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
        </SettingRow>
        <SettingRow label="Phone">
          <input className="input-base" type="tel" value={profile.phone}
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
        </SettingRow>
        <SettingRow label="Job Title">
          <input className="input-base" value={profile.title}
            onChange={e => setProfile(p => ({ ...p, title: e.target.value }))} />
        </SettingRow>
        <SettingRow label="Department">
          <select className="select-base" value={profile.department}
            onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}>
            {["Formulation","Production","Quality","Sales","Management","IT"].map(d => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="Bio">
          <textarea className="input-base" rows={3} value={profile.bio}
            onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
            style={{ resize: "vertical" }} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Change Password">
        <SettingRow label="Current Password">
          <div style={{ position: "relative" }}>
            <input className="input-base" type={showPw ? "text" : "password"}
              value={pwForm.current} placeholder="Enter current password"
              onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
              style={{ paddingRight: 40 }} />
            <button onClick={() => setShowPw(!showPw)} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)",
            }}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </SettingRow>
        <SettingRow label="New Password" hint="Min 12 chars, uppercase, number, symbol">
          <input className="input-base" type="password" value={pwForm.next} placeholder="New password"
            onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} />
        </SettingRow>
        <SettingRow label="Confirm Password">
          <div>
            <input className="input-base" type="password" value={pwForm.confirm} placeholder="Confirm new password"
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
            {pwForm.confirm && pwForm.next && pwForm.next !== pwForm.confirm && (
              <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Passwords do not match</div>
            )}
          </div>
        </SettingRow>
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>
    </>
  );
}

/* ─── SECTION: AI Providers ─────────────────────────────────────────── */
const AI_PROVIDERS = [
  { id: "openai",    name: "OpenAI",    logo: "🤖", models: ["gpt-4o","gpt-4o-mini","o1-mini"],        desc: "Formula suggestions, scent description generation, AI Assistant" },
  { id: "anthropic", name: "Anthropic", logo: "🧠", models: ["claude-opus-4","claude-sonnet-4","claude-haiku-3"], desc: "Complex reasoning, IFRA compliance analysis, batch optimisation" },
  { id: "google",    name: "Google AI", logo: "🔮", models: ["gemini-1.5-pro","gemini-1.5-flash"],       desc: "Olfactory clustering, market trend analysis" },
];

function AIProvidersSection() {
  const [keys, setKeys] = useState<Record<string,string>>({
    openai: "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxx1a2b",
    anthropic: "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx3c4d",
    google: "",
  });
  const [models, setModels] = useState<Record<string,string>>({
    openai: "gpt-4o", anthropic: "claude-sonnet-4", google: "gemini-1.5-pro",
  });
  const [enabled, setEnabled] = useState<Record<string,boolean>>({
    openai: true, anthropic: true, google: false,
  });
  const [primary, setPrimary] = useState("anthropic");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState<string|null>(null);
  const [testResult, setTestResult] = useState<Record<string, "ok"|"fail">>({});

  const test = (id: string) => {
    setTesting(id);
    setTimeout(() => {
      setTesting(null);
      setTestResult(p => ({ ...p, [id]: keys[id] ? "ok" : "fail" }));
    }, 1200);
  };

  return (
    <>
      <div className="glass-card" style={{ padding: "14px 20px", marginBottom: 16,
        borderColor: "rgba(201,168,76,0.25)", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Brain size={15} color="#c9a84c" style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          API keys are encrypted at rest and never logged. The <strong style={{ color:"#c9a84c" }}>primary</strong> provider
          is used for real-time assistant queries; secondary providers are used for specialised tasks.
        </div>
      </div>

      {AI_PROVIDERS.map(p => (
        <SectionCard key={p.id} title="">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 24 }}>{p.logo}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{p.name}</span>
                {primary === p.id && (
                  <span className="badge badge-yellow" style={{ fontSize: 10 }}>Primary</span>
                )}
                {testResult[p.id] === "ok" && (
                  <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Connected</span>
                )}
                {testResult[p.id] === "fail" && (
                  <span className="badge badge-red" style={{ fontSize: 10 }}>✗ Failed</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{p.desc}</div>
            </div>
            <Toggle value={enabled[p.id]} onChange={v => setEnabled(x => ({ ...x, [p.id]: v }))} />
          </div>

          <SettingRow label="API Key">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ApiKeyField value={keys[p.id] || "not-configured"} />
              <input className="input-base" type="password"
                placeholder={`Paste new ${p.name} API key…`}
                onChange={e => setKeys(x => ({ ...x, [p.id]: e.target.value }))} />
            </div>
          </SettingRow>

          <SettingRow label="Default Model">
            <select className="select-base" value={models[p.id]}
              onChange={e => setModels(x => ({ ...x, [p.id]: e.target.value }))}>
              {p.models.map(m => <option key={m}>{m}</option>)}
            </select>
          </SettingRow>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn-secondary" style={{ fontSize: 12 }}
              onClick={() => test(p.id)} disabled={testing === p.id}>
              {testing === p.id ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Testing…</> : "Test Connection"}
            </button>
            {primary !== p.id && enabled[p.id] && (
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPrimary(p.id)}>
                Set as Primary
              </button>
            )}
          </div>
        </SectionCard>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save API Keys</>}
        </button>
      </div>
    </>
  );
}

/* ─── SECTION: Notifications ─────────────────────────────────────────── */
type NotifChannel = "email" | "sms" | "inapp";
interface NotifRule { id: string; label: string; desc: string; email: boolean; sms: boolean; inapp: boolean }

function NotificationsSection() {
  const [rules, setRules] = useState<NotifRule[]>([
    { id:"low_stock",     label:"Low Stock Alert",        desc:"Material quantity drops below reorder threshold",    email:true,  sms:false, inapp:true  },
    { id:"out_stock",     label:"Out of Stock",           desc:"Material reaches zero — production may be blocked",  email:true,  sms:true,  inapp:true  },
    { id:"formula_lock",  label:"Formula Locked",         desc:"A formula is locked and pending approval",           email:true,  sms:false, inapp:true  },
    { id:"ifra_breach",   label:"IFRA Compliance Breach", desc:"Formula exceeds IFRA maximum usage percentage",      email:true,  sms:true,  inapp:true  },
    { id:"prod_complete", label:"Production Complete",    desc:"A batch production order is marked complete",        email:false, sms:false, inapp:true  },
    { id:"prod_fail",     label:"Production QC Failed",   desc:"Quality check failed on a production batch",        email:true,  sms:true,  inapp:true  },
    { id:"new_member",    label:"New Team Member",        desc:"A new user joins the organisation",                  email:true,  sms:false, inapp:true  },
    { id:"billing",       label:"Billing & Invoices",     desc:"Subscription renewal, invoice generated",           email:true,  sms:false, inapp:false },
  ]);

  const toggle = (id: string, ch: NotifChannel) =>
    setRules(r => r.map(x => x.id === id ? { ...x, [ch]: !x[ch] } : x));

  const [digest, setDigest] = useState("daily");
  const [emailAddr, setEmailAddr] = useState("admin@pilhouse.com");

  const ChIcon = ({ ch }: { ch: NotifChannel }) => ({
    email: <Mail size={12} />, sms: <Smartphone size={12} />, inapp: <Bell size={12} />,
  }[ch]);

  return (
    <>
      <SectionCard title="Delivery">
        <SettingRow label="Notification Email" hint="Digest and critical alerts go here">
          <input className="input-base" type="email" value={emailAddr}
            onChange={e => setEmailAddr(e.target.value)} />
        </SettingRow>
        <SettingRow label="Email Digest Frequency">
          <div style={{ display: "flex", gap: 8 }}>
            {["off","daily","weekly"].map(f => (
              <button key={f} onClick={() => setDigest(f)}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${digest===f ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: digest===f ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)",
                  color: digest===f ? "#c9a84c" : "rgba(255,255,255,0.5)", cursor: "pointer",
                  textTransform: "capitalize",
                }}>
                {f}
              </button>
            ))}
          </div>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Alert Rules">
        <div style={{ marginBottom: 10, display:"flex", gap:8, justifyContent:"flex-end" }}>
          {(["email","sms","inapp"] as NotifChannel[]).map(ch => (
            <div key={ch} style={{ display:"flex", alignItems:"center", gap:4,
              fontSize:11, color:"rgba(255,255,255,0.35)" }}>
              <ChIcon ch={ch} />
              {ch === "inapp" ? "In-App" : ch.toUpperCase()}
            </div>
          ))}
        </div>
        {rules.map(rule => (
          <div key={rule.id} style={{
            display:"flex", alignItems:"center", gap:16, padding:"12px 0",
            borderBottom:"1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{rule.label}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{rule.desc}</div>
            </div>
            {(["email","sms","inapp"] as NotifChannel[]).map(ch => (
              <Toggle key={ch} value={rule[ch]} onChange={() => toggle(rule.id, ch)} />
            ))}
          </div>
        ))}
      </SectionCard>
    </>
  );
}

/* ─── SECTION: Security ──────────────────────────────────────────────── */
interface ApiKey { id: string; name: string; prefix: string; created: string; lastUsed: string; scopes: string[] }

function SecuritySection() {
  const [twoFA, setTwoFA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("8");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id:"k1", name:"Production CI", prefix:"pil_live_k1••••", created:"2026-01-15", lastUsed:"2026-05-22", scopes:["inventory:read","formulas:read"] },
    { id:"k2", name:"Analytics Connector", prefix:"pil_live_k2••••", created:"2026-03-01", lastUsed:"2026-05-20", scopes:["analytics:read"] },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["inventory:read"]);
  const [generatedKey, setGeneratedKey] = useState("");

  const ALL_SCOPES = [
    "inventory:read","inventory:write","formulas:read","formulas:write",
    "production:read","production:write","analytics:read","compliance:read",
  ];

  const generateKey = () => {
    if (!newKeyName) return;
    const raw = "pil_live_" + Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2,10);
    setGeneratedKey(raw);
    setApiKeys(k => [...k, {
      id: Date.now().toString(), name: newKeyName,
      prefix: raw.slice(0,16) + "••••",
      created: new Date().toISOString().slice(0,10),
      lastUsed: "—",
      scopes: newKeyScopes,
    }]);
    setNewKeyName("");
  };

  return (
    <>
      <SectionCard title="Two-Factor Authentication">
        <SettingRow label="Enable 2FA" hint="TOTP via Google Authenticator or similar apps">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Toggle value={twoFA} onChange={setTwoFA} />
            <span style={{ fontSize:13, color: twoFA ? "#22c55e" : "rgba(255,255,255,0.4)" }}>
              {twoFA ? "Active" : "Not configured"}
            </span>
          </div>
        </SettingRow>
        {twoFA && (
          <div style={{ padding:"14px 0 0" }}>
            <button className="btn-secondary" style={{ fontSize:12 }}>
              <RefreshCw size={13} /> Re-generate QR Code
            </button>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Session">
        <SettingRow label="Auto-logout After" hint="Inactive sessions are terminated after this period">
          <div style={{ display:"flex", gap:8 }}>
            {["1","4","8","24"].map(h => (
              <button key={h} onClick={() => setSessionTimeout(h)}
                style={{
                  padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:500,
                  border:`1px solid ${sessionTimeout===h ? "rgba(201,168,76,0.5)":"rgba(255,255,255,0.1)"}`,
                  background:sessionTimeout===h ? "rgba(201,168,76,0.1)":"rgba(255,255,255,0.04)",
                  color:sessionTimeout===h ? "#c9a84c":"rgba(255,255,255,0.5)", cursor:"pointer",
                }}>
                {h}h
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="Active Sessions">
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { device:"Chrome · macOS", ip:"103.xx.xx.12", loc:"Mumbai, IN", current:true },
              { device:"Safari · iPhone 16", ip:"103.xx.xx.55", loc:"Mumbai, IN", current:false },
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
                padding:"10px 14px", background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(255,255,255,0.07)", borderRadius:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:"#fff", fontWeight:500 }}>{s.device}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{s.ip} · {s.loc}</div>
                </div>
                {s.current
                  ? <span className="badge badge-green">Current</span>
                  : <button className="btn-ghost" style={{ fontSize:12, color:"#ef4444" }}>Revoke</button>
                }
              </div>
            ))}
          </div>
        </SettingRow>
      </SectionCard>

      <SectionCard title="API Keys">
        {generatedKey && (
          <div style={{ padding:"12px 14px", background:"rgba(34,197,94,0.08)",
            border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, marginBottom:16 }}>
            <div style={{ fontSize:12, color:"#22c55e", fontWeight:600, marginBottom:6 }}>
              ⚠ Copy this key now — it won't be shown again
            </div>
            <ApiKeyField value={generatedKey} />
          </div>
        )}

        <table className="table-base" style={{ marginBottom:16 }}>
          <thead><tr>
            <th>Name</th><th>Key</th><th>Scopes</th><th>Last Used</th><th></th>
          </tr></thead>
          <tbody>
            {apiKeys.map(k => (
              <tr key={k.id}>
                <td style={{ color:"#fff", fontWeight:500 }}>{k.name}</td>
                <td><span style={{ fontFamily:"monospace", fontSize:12 }}>{k.prefix}</span></td>
                <td>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {k.scopes.map(s => (
                      <span key={s} style={{ fontSize:10, padding:"2px 6px",
                        background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)",
                        borderRadius:99, color:"#60a5fa" }}>{s}</span>
                    ))}
                  </div>
                </td>
                <td>{k.lastUsed}</td>
                <td>
                  <button className="btn-ghost" style={{ color:"#ef4444", padding:"4px 8px" }}
                    onClick={() => setApiKeys(x => x.filter(a => a.id !== k.id))}>
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ padding:"14px", background:"rgba(255,255,255,0.02)",
          border:"1px dashed rgba(255,255,255,0.1)", borderRadius:8 }}>
          <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>
            Generate New API Key
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <input className="input-base" placeholder="Key name (e.g. ERP Connector)"
              value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
              style={{ flex:1 }} />
            <button className="btn-primary" style={{ fontSize:12 }} onClick={generateKey}>
              <Key size={13} /> Generate
            </button>
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:6 }}>Scopes:</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {ALL_SCOPES.map(s => {
              const on = newKeyScopes.includes(s);
              return (
                <button key={s} onClick={() => setNewKeyScopes(x => on ? x.filter(a=>a!==s) : [...x,s])}
                  style={{
                    fontSize:11, padding:"3px 10px", borderRadius:99, cursor:"pointer",
                    border:`1px solid ${on ? "rgba(201,168,76,0.4)":"rgba(255,255,255,0.1)"}`,
                    background:on ? "rgba(201,168,76,0.08)":"rgba(255,255,255,0.03)",
                    color:on ? "#c9a84c":"rgba(255,255,255,0.4)",
                  }}>{s}</button>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </>
  );
}

/* ─── SECTION: Regulatory / IFRA ──────────────────────────────────────── */
function RegulatorySection() {
  const [ifraAmendment, setIfraAmendment] = useState("51");
  const [defaultCategory, setDefaultCategory] = useState("4");
  const [autoCheck, setAutoCheck] = useState(true);
  const [blockOnViolation, setBlockOnViolation] = useState(false);
  const [euCosmos, setEuCosmos] = useState(true);
  const [reach, setReach] = useState(false);
  const [saved, setSaved] = useState(false);

  const IFRA_CATEGORIES = [
    {v:"1",l:"Cat 1 — Lip products"},{v:"2",l:"Cat 2 — Deodorant/body spray"},{v:"3",l:"Cat 3 — Eye-area products"},
    {v:"4",l:"Cat 4 — Fine fragrance (EDT/EDP)"},{v:"5",l:"Cat 5 — Body lotions/cream"},
    {v:"6",l:"Cat 6 — Mouthwash"},{v:"7",l:"Cat 7 — Rinse-off hair"},{v:"8",l:"Cat 8 — Wet wipes"},
    {v:"9",l:"Cat 9 — Rinse-off body"},{v:"10",l:"Cat 10 — Household cleaning"},
    {v:"11",l:"Cat 11 — Industrial / technical"},
  ];

  return (
    <>
      <SectionCard title="IFRA Compliance">
        <SettingRow label="IFRA Amendment" hint="The standard version to use for maximum usage checks">
          <select className="select-base" value={ifraAmendment} onChange={e => setIfraAmendment(e.target.value)}>
            <option value="51">Amendment 51 (Current — 2023)</option>
            <option value="50">Amendment 50 (2022)</option>
            <option value="49">Amendment 49 (2020)</option>
          </select>
        </SettingRow>
        <SettingRow label="Default Application Category" hint="Pre-selected when running compliance checks">
          <select className="select-base" value={defaultCategory} onChange={e => setDefaultCategory(e.target.value)}>
            {IFRA_CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Auto-Check on Save" hint="Run IFRA check automatically when a formula is saved">
          <Toggle value={autoCheck} onChange={setAutoCheck} />
        </SettingRow>
        <SettingRow label="Block Locking on Violation" hint="Prevent locking a formula with active IFRA violations">
          <Toggle value={blockOnViolation} onChange={setBlockOnViolation} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Additional Regulatory Frameworks">
        <SettingRow label="EU Cosmetics Regulation" hint="EU 2023/1545 allergen disclosure & labelling">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Toggle value={euCosmos} onChange={setEuCosmos} />
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>
              Flags 83 EU regulated allergens in formulas
            </span>
          </div>
        </SettingRow>
        <SettingRow label="REACH (EU)" hint="Registration, Evaluation, Authorisation and Restriction of Chemicals">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Toggle value={reach} onChange={setReach} />
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>
              Cross-references SVHC candidate list by CAS number
            </span>
          </div>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Safety Data Sheet (SDS) Defaults">
        <SettingRow label="Manufacturer Name">
          <input className="input-base" defaultValue="PIL House Fragrances Pvt. Ltd." />
        </SettingRow>
        <SettingRow label="Emergency Contact">
          <input className="input-base" type="tel" defaultValue="+91 1800-xxx-xxxx" />
        </SettingRow>
        <SettingRow label="Default SDS Language">
          <select className="select-base" defaultValue="en">
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ar">Arabic</option>
          </select>
        </SettingRow>
      </SectionCard>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button className="btn-primary" onClick={() => { setSaved(true); setTimeout(()=>setSaved(false),2000); }}>
          {saved ? <><Check size={14}/> Saved</> : <><Save size={14}/> Save Regulatory Settings</>}
        </button>
      </div>
    </>
  );
}

/* ─── SECTION: Integrations ──────────────────────────────────────────── */
interface Integration {
  id: string; name: string; desc: string; icon: string;
  category: string; connected: boolean; configurable: boolean;
}

const INTEGRATIONS: Integration[] = [
  { id:"zapier",     name:"Zapier",         icon:"⚡", category:"Automation",  desc:"Trigger workflows on formula saves, stock alerts, and production events", connected:false, configurable:false },
  { id:"slack",      name:"Slack",          icon:"💬", category:"Notifications", desc:"Receive real-time alerts in your Slack channels",                    connected:true,  configurable:true  },
  { id:"quickbooks", name:"QuickBooks",     icon:"📊", category:"Accounting",   desc:"Sync cost of goods sold, inventory valuation, and invoices",           connected:false, configurable:false },
  { id:"shopify",    name:"Shopify",        icon:"🛍", category:"E-commerce",   desc:"Push products with formula-linked SKUs; sync orders to production",    connected:false, configurable:false },
  { id:"gcms",       name:"GC-MS Import",   icon:"🔬", category:"Lab",          desc:"Import component data directly from GC-MS CSV exports",               connected:true,  configurable:true  },
  { id:"webhook",    name:"Webhooks",       icon:"🔗", category:"Developer",    desc:"Send HTTP events to your systems on any platform action",              connected:false, configurable:true  },
];

function IntegrationsSection() {
  const [intgs, setIntgs] = useState(INTEGRATIONS);
  const [webhookUrl, setWebhookUrl] = useState("https://your-server.com/webhook");
  const [webhookEvents, setWebhookEvents] = useState(["formula.saved","stock.low"]);

  const WEBHOOK_EVENTS = [
    "formula.saved","formula.locked","formula.approved",
    "stock.low","stock.out","production.completed","compliance.violation",
  ];

  const toggle = (id: string) =>
    setIntgs(x => x.map(i => i.id === id ? { ...i, connected: !i.connected } : i));

  return (
    <>
      {[...new Set(intgs.map(i => i.category))].map(cat => (
        <SectionCard key={cat} title={cat}>
          {intgs.filter(i => i.category === cat).map(intg => (
            <div key={intg.id} style={{ display:"flex", alignItems:"flex-start", gap:14,
              padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize:28, lineHeight:1, marginTop:2 }}>{intg.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{intg.name}</span>
                  {intg.connected
                    ? <span className="badge badge-green">Connected</span>
                    : <span className="badge" style={{ background:"rgba(255,255,255,0.05)",
                        color:"rgba(255,255,255,0.35)", border:"1px solid rgba(255,255,255,0.1)" }}>Not connected</span>
                  }
                </div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{intg.desc}</div>
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                {intg.connected && intg.configurable && (
                  <button className="btn-ghost" style={{ fontSize:12 }}>Configure</button>
                )}
                <button
                  onClick={() => toggle(intg.id)}
                  className={intg.connected ? "btn-danger" : "btn-secondary"}
                  style={{ fontSize:12 }}>
                  {intg.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </SectionCard>
      ))}

      <SectionCard title="Webhook Configuration">
        <SettingRow label="Endpoint URL">
          <input className="input-base" value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)} />
        </SettingRow>
        <SettingRow label="Events to Send">
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {WEBHOOK_EVENTS.map(ev => {
              const on = webhookEvents.includes(ev);
              return (
                <button key={ev} onClick={() => setWebhookEvents(x => on ? x.filter(a=>a!==ev) : [...x,ev])}
                  style={{
                    fontSize:11, padding:"4px 10px", borderRadius:99, cursor:"pointer",
                    border:`1px solid ${on ? "rgba(201,168,76,0.4)":"rgba(255,255,255,0.1)"}`,
                    background:on ? "rgba(201,168,76,0.08)":"rgba(255,255,255,0.03)",
                    color:on ? "#c9a84c":"rgba(255,255,255,0.4)",
                  }}>{ev}</button>
              );
            })}
          </div>
        </SettingRow>
        <SettingRow label="Secret Header" hint="Sent as X-PIL-Signature for verification">
          <ApiKeyField value="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        </SettingRow>
        <div style={{ marginTop:12 }}>
          <button className="btn-secondary" style={{ fontSize:12 }}>
            <Webhook size={13} /> Send Test Payload
          </button>
        </div>
      </SectionCard>
    </>
  );
}

/* ─── SECTION: Database ──────────────────────────────────────────────── */
type DbType = "postgresql" | "mysql" | "mariadb" | "mssql" | "sqlite";

const DB_DEFAULTS: Record<DbType, { port: number; label: string; icon: string; color: string }> = {
  postgresql: { port: 5432,  label: "PostgreSQL",  icon: "🐘", color: "#336791" },
  mysql:      { port: 3306,  label: "MySQL",        icon: "🐬", color: "#e48e00" },
  mariadb:    { port: 3306,  label: "MariaDB",      icon: "🦭", color: "#c0765a" },
  mssql:      { port: 1433,  label: "SQL Server",   icon: "🪟", color: "#cc2927" },
  sqlite:     { port: 0,     label: "SQLite",       icon: "📦", color: "#44b5f6" },
};

type ConnStatus = "idle" | "testing" | "ok" | "fail";
type OpStatus   = "idle" | "running" | "done" | "fail";

interface LogLine { ts: string; text: string; level: "info" | "ok" | "err" }

function DatabaseSection() {
  const [dbType,   setDbType]   = useState<DbType>("sqlite");
  const [host,     setHost]     = useState("127.0.0.1");
  const [port,     setPort]     = useState(5432);
  const [dbName,   setDbName]   = useState("pil_production");
  const [user,     setUser]     = useState("pil_admin");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [ssl,      setSsl]      = useState(false);
  const [sslMode,  setSslMode]  = useState("require");

  const [connStatus,  setConnStatus]  = useState<ConnStatus>("idle");
  const [connMsg,     setConnMsg]     = useState("");
  const [connLatency, setConnLatency] = useState<number | null>(null);

  const [migrateStatus, setMigrateStatus] = useState<OpStatus>("idle");
  const [seedStatus,    setSeedStatus]    = useState<OpStatus>("idle");
  const [logs,          setLogs]          = useState<LogLine[]>([]);
  const [showLogs,      setShowLogs]      = useState(false);
  const [confirmReset,  setConfirmReset]  = useState(false);

  // ── Backup / Restore state
  const [backupStatus,   setBackupStatus]   = useState<OpStatus>("idle");
  const [restoreStatus,  setRestoreStatus]  = useState<OpStatus>("idle");
  const [restoreMsg,     setRestoreMsg]     = useState("");
  const [restoreFile,    setRestoreFile]    = useState<File | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const isSqlite = dbType === "sqlite";

  // Switch DB type → reset port
  const switchDb = (t: DbType) => {
    setDbType(t);
    if (DB_DEFAULTS[t].port > 0) setPort(DB_DEFAULTS[t].port);
  };

  // Auto-build connection string preview
  const connString = isSqlite
    ? "file:./prisma/pil.db"
    : `${dbType}://${user}:${password ? "••••••" : "<password>"}@${host}:${port}/${dbName}${ssl ? `?sslmode=${sslMode}` : ""}`;

  const addLog = (text: string, level: LogLine["level"] = "info") =>
    setLogs(l => [...l, { ts: new Date().toLocaleTimeString(), text, level }]);

  // ── Test connection
  const testConnection = async () => {
    setConnStatus("testing");
    setConnMsg("");
    setConnLatency(null);
    addLog(`Testing ${DB_DEFAULTS[dbType].label} connection to ${isSqlite ? "local SQLite file" : `${host}:${port}`}…`);
    try {
      const res = await fetch("/api/db/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbType, host, port, dbName, username: user, password, ssl, sslMode }),
      });
      const data = await res.json();
      if (data.ok) {
        setConnStatus("ok");
        setConnMsg(data.message);
        setConnLatency(data.latency ?? null);
        addLog(`✓ ${data.message}${data.latency ? ` (${data.latency}ms)` : ""}`, "ok");
        if (data.version) addLog(`Server: ${data.version}`, "info");
      } else {
        setConnStatus("fail");
        setConnMsg(data.message);
        addLog(`✗ ${data.message}`, "err");
      }
    } catch (err: any) {
      setConnStatus("fail");
      setConnMsg(err.message);
      addLog(`✗ Network error: ${err.message}`, "err");
    }
  };

  // ── Apply migrations
  const runMigrate = async () => {
    setMigrateStatus("running");
    setShowLogs(true);
    addLog("Running prisma migrate deploy…");
    try {
      const res = await fetch("/api/db/migrate", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMigrateStatus("done");
        addLog(`✓ ${data.message}`, "ok");
        data.output?.split("\n").filter(Boolean).forEach((l: string) => addLog(l, "info"));
      } else {
        setMigrateStatus("fail");
        addLog(`✗ ${data.message}`, "err");
        data.output?.split("\n").filter(Boolean).forEach((l: string) => addLog(l, "err"));
      }
    } catch (err: any) {
      setMigrateStatus("fail");
      addLog(`✗ ${err.message}`, "err");
    }
  };

  // ── Seed demo data
  const runSeed = async () => {
    setSeedStatus("running");
    setShowLogs(true);
    addLog("Seeding database with demo data…");
    try {
      const res = await fetch("/api/db/seed", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setSeedStatus("done");
        addLog(`✓ ${data.message}`, "ok");
        data.output?.split("\n").filter(Boolean).forEach((l: string) => addLog(l, "info"));
      } else {
        setSeedStatus("fail");
        addLog(`✗ ${data.message}`, "err");
        data.output?.split("\n").filter(Boolean).forEach((l: string) => addLog(l, "err"));
      }
    } catch (err: any) {
      setSeedStatus("fail");
      addLog(`✗ ${err.message}`, "err");
    }
  };

  // ── Download backup
  const downloadBackup = async () => {
    setBackupStatus("running");
    addLog("Requesting database backup…");
    try {
      const res = await fetch("/api/db/backup");
      if (!res.ok) throw new Error("Backup request failed");
      const blob = await res.blob();
      const ts = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `pil_backup_${ts}.db`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setBackupStatus("done");
      addLog(`✓ Backup downloaded: ${filename}`, "ok");
      setTimeout(() => setBackupStatus("idle"), 3000);
    } catch (err: any) {
      setBackupStatus("fail");
      addLog(`✗ Backup failed: ${err.message}`, "err");
    }
  };

  // ── Upload restore
  const restoreDb = async () => {
    if (!restoreFile) return;
    setRestoreStatus("running");
    setShowLogs(true);
    addLog(`Uploading ${restoreFile.name} for restore…`);
    try {
      const form = new FormData();
      form.append("file", restoreFile);
      const res = await fetch("/api/db/restore", { method: "POST", body: form });
      const data = await res.json();
      if (data.ok) {
        setRestoreStatus("done");
        setRestoreMsg(data.message);
        addLog(`✓ ${data.message}`, "ok");
      } else {
        setRestoreStatus("fail");
        setRestoreMsg(data.error);
        addLog(`✗ ${data.error}`, "err");
      }
    } catch (err: any) {
      setRestoreStatus("fail");
      setRestoreMsg(err.message);
      addLog(`✗ ${err.message}`, "err");
    }
    setRestoreFile(null);
    setConfirmRestore(false);
  };

  // ── Helpers
  const opIcon = (s: OpStatus, size = 14) => {
    if (s === "running") return <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />;
    if (s === "done")    return <Check   size={size} />;
    if (s === "fail")    return <AlertTriangle size={size} />;
    return null;
  };
  const opColor = (s: OpStatus) =>
    s === "done" ? "#22c55e" : s === "fail" ? "#ef4444" : s === "running" ? "#c9a84c" : undefined;

  return (
    <>
      {/* ── Connection type strip ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(Object.keys(DB_DEFAULTS) as DbType[]).map(t => {
          const d = DB_DEFAULTS[t];
          const active = dbType === t;
          return (
            <button key={t} onClick={() => switchDb(t)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 10, cursor: "pointer",
              border: `1px solid ${active ? d.color + "66" : "rgba(255,255,255,0.08)"}`,
              background: active ? d.color + "14" : "rgba(255,255,255,0.03)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 20 }}>{d.icon}</span>
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 400,
                color: active ? d.color : "rgba(255,255,255,0.45)" }}>{d.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Connection details card ── */}
      <SectionCard title="Connection Details">

        {/* Host + Port (hidden for SQLite) */}
        {!isSqlite && (
          <SettingRow label="Host / IP Address" hint="Database server hostname or IP">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <Server size={13} style={{ position: "absolute", left: 10, top: "50%",
                  transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                <input className="input-base" style={{ paddingLeft: 30 }}
                  placeholder="e.g. 192.168.1.100 or db.example.com"
                  value={host} onChange={e => setHost(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>Port</div>
                <input className="input-base" type="number" min={1} max={65535}
                  value={port} onChange={e => setPort(parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </SettingRow>
        )}

        {/* SQLite file path */}
        {isSqlite && (
          <SettingRow label="Database File" hint="Path relative to the project root">
            <div style={{ position: "relative" }}>
              <Database size={13} style={{ position: "absolute", left: 10, top: "50%",
                transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
              <input className="input-base" style={{ paddingLeft: 30 }}
                defaultValue="./prisma/pil.db"
                disabled
                title="SQLite file location is managed by Prisma configuration" />
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
              Controlled by <code style={{ color: "#c9a84c", fontSize: 11 }}>prisma.config.ts</code> — edit that file to change the path
            </div>
          </SettingRow>
        )}

        {/* Database name */}
        <SettingRow label="Database Name" hint="The specific database / schema to connect to">
          <input className="input-base"
            placeholder="e.g. pil_production"
            value={isSqlite ? "pil.db (SQLite file)" : dbName}
            disabled={isSqlite}
            onChange={e => setDbName(e.target.value)} />
        </SettingRow>

        {/* Username + Password (hidden for SQLite) */}
        {!isSqlite && (
          <>
            <SettingRow label="Username" hint="Database user with read/write access">
              <input className="input-base" placeholder="e.g. pil_admin"
                value={user} onChange={e => setUser(e.target.value)} />
            </SettingRow>

            <SettingRow label="Password">
              <div style={{ position: "relative" }}>
                <input
                  className="input-base"
                  type={showPw ? "text" : "password"}
                  placeholder="Database password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: 40 }}
                />
                <button onClick={() => setShowPw(!showPw)} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)",
                }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </SettingRow>

            <SettingRow label="SSL / TLS" hint="Encrypt the connection to the database server">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Toggle value={ssl} onChange={setSsl} />
                {ssl && (
                  <select className="select-base" style={{ width: 180 }}
                    value={sslMode} onChange={e => setSslMode(e.target.value)}>
                    <option value="disable">disable</option>
                    <option value="allow">allow</option>
                    <option value="require">require</option>
                    <option value="verify-ca">verify-ca</option>
                    <option value="verify-full">verify-full</option>
                  </select>
                )}
                {!ssl && (
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No encryption</span>
                )}
              </div>
            </SettingRow>
          </>
        )}

        {/* Connection string preview */}
        <SettingRow label="Connection String" hint="Auto-generated preview — password masked">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{
              flex: 1, padding: "9px 12px", background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
              fontFamily: "monospace", fontSize: 12, color: "#a78bfa",
              wordBreak: "break-all",
            }}>
              {connString}
            </div>
            <button className="btn-ghost" style={{ padding: "8px 10px", flexShrink: 0 }}
              onClick={() => navigator.clipboard.writeText(connString).catch(() => {})}
              title="Copy connection string">
              <Copy size={13} />
            </button>
          </div>
        </SettingRow>
      </SectionCard>

      {/* ── Test connection ── */}
      <SectionCard title="Connection Test">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="btn-primary"
            onClick={testConnection}
            disabled={connStatus === "testing"}
            style={{ minWidth: 160 }}
          >
            {connStatus === "testing"
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Testing…</>
              : <><Wifi size={14} /> Test Connection</>
            }
          </button>

          {connStatus === "ok" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 8,
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <Check size={14} color="#22c55e" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>Connected</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {connMsg}{connLatency !== null ? ` · ${connLatency}ms` : ""}
                </div>
              </div>
            </div>
          )}

          {connStatus === "fail" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 8,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <WifiOff size={14} color="#ef4444" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>Connection Failed</div>
                <div style={{ fontSize: 11, color: "rgba(239,68,68,0.7)", maxWidth: 360 }}>{connMsg}</div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Schema & Data ── */}
      <SectionCard title="Schema & Data Operations">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Apply migrations */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 16,
            padding: "16px", borderRadius: 10,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Terminal size={16} color="#60a5fa" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
                Apply Schema Migrations
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
                Runs <code style={{ color: "#c9a84c", fontSize: 11 }}>prisma migrate deploy</code> — creates or updates all
                tables to match the current schema. Safe to run multiple times.
              </div>
              <button
                className="btn-secondary"
                onClick={runMigrate}
                disabled={migrateStatus === "running"}
                style={{ fontSize: 12, color: opColor(migrateStatus) }}
              >
                {opIcon(migrateStatus)} Apply Migrations
                {migrateStatus === "done" && " — Done"}
                {migrateStatus === "fail" && " — Failed"}
              </button>
            </div>
          </div>

          {/* Seed demo data */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 16,
            padding: "16px", borderRadius: 10,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FlaskConical size={16} color="#22c55e" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
                Populate with Demo Data
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
                Seeds the database with a default organisation, 10 raw materials (ISO E Super, Ambroxan, Rose Absolute…),
                and sample formulas. Uses <code style={{ color: "#c9a84c", fontSize: 11 }}>upsert</code> — safe to re-run,
                existing records are not duplicated.
              </div>
              <button
                className="btn-secondary"
                onClick={runSeed}
                disabled={seedStatus === "running"}
                style={{ fontSize: 12, color: opColor(seedStatus) }}
              >
                {opIcon(seedStatus)} Populate Database
                {seedStatus === "done" && " — Done"}
                {seedStatus === "fail" && " — Failed"}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Operation log ── */}
      {logs.length > 0 && (
        <SectionCard title="">
          <button
            onClick={() => setShowLogs(!showLogs)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none",
              border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)",
              fontSize: 12, fontWeight: 600, padding: 0, width: "100%" }}
          >
            <Terminal size={12} />
            Operation Log ({logs.length} lines)
            <ChevronDown size={12} style={{ marginLeft: "auto",
              transform: showLogs ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showLogs && (
            <div style={{
              marginTop: 10, padding: "10px 12px", borderRadius: 8,
              background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)",
              fontFamily: "monospace", fontSize: 12, maxHeight: 240, overflowY: "auto",
            }}>
              {logs.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 3 }}>
                  <span style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>{l.ts}</span>
                  <span style={{
                    color: l.level === "ok" ? "#22c55e" : l.level === "err" ? "#f87171" : "rgba(255,255,255,0.6)",
                  }}>{l.text}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Backup & Restore ── */}
      <SectionCard title="Backup & Restore">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Backup */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 16, padding: 16,
            borderRadius: 10, background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <HardDrive size={16} color="#c9a84c" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
                Download Backup
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
                Downloads the current <code style={{ color: "#c9a84c", fontSize: 11 }}>pil.db</code> SQLite
                file to your computer. Filename includes a timestamp.
                Store it somewhere safe — this is your full data snapshot.
              </div>
              <button
                className="btn-secondary"
                onClick={downloadBackup}
                disabled={backupStatus === "running"}
                style={{ fontSize: 12, color: opColor(backupStatus) }}
              >
                {backupStatus === "running"
                  ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Preparing…</>
                  : backupStatus === "done"
                    ? <><Check size={13} /> Downloaded!</>
                    : <><Download size={13} /> Download Backup</>}
              </button>
            </div>
          </div>

          {/* Restore */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 16, padding: 16,
            borderRadius: 10, background: "rgba(255,255,255,0.02)",
            border: `1px solid ${restoreStatus === "fail" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Upload size={16} color="#60a5fa" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
                Restore from Backup
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
                Upload a <code style={{ color: "#c9a84c", fontSize: 11 }}>.db</code> backup file to replace
                the current database. The existing database is auto-saved on the server before replacement.
              </div>

              {/* File picker */}
              {!confirmRestore && (
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="file"
                    accept=".db"
                    style={{ display: "none" }}
                    onChange={e => {
                      const f = e.target.files?.[0] ?? null;
                      setRestoreFile(f);
                      setRestoreStatus("idle");
                      setRestoreMsg("");
                      if (f) setConfirmRestore(true);
                    }}
                  />
                  <span className="btn-secondary" style={{ fontSize: 12, pointerEvents: "none" }}>
                    <Upload size={13} /> Choose .db File
                  </span>
                </label>
              )}

              {/* Confirm step */}
              {confirmRestore && restoreFile && (
                <div style={{
                  padding: "12px 14px", borderRadius: 8, marginTop: 8,
                  background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fca5a5", marginBottom: 8 }}>
                    ⚠ Replace current database with <strong>{restoreFile.name}</strong>?
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
                    All current data will be replaced. This cannot be undone from the UI
                    (the server keeps an auto-backup of the replaced file).
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn-danger" style={{ fontSize: 12 }}
                      onClick={restoreDb}
                      disabled={restoreStatus === "running"}
                    >
                      {restoreStatus === "running"
                        ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Restoring…</>
                        : <><Upload size={13} /> Yes, Restore</>}
                    </button>
                    <button className="btn-ghost" style={{ fontSize: 12 }}
                      onClick={() => { setConfirmRestore(false); setRestoreFile(null); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Result messages */}
              {restoreStatus === "done" && restoreMsg && (
                <div style={{
                  marginTop: 8, padding: "8px 12px", borderRadius: 8, fontSize: 12,
                  background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                  color: "#22c55e",
                }}>
                  <Check size={12} style={{ display: "inline", marginRight: 6 }} />
                  {restoreMsg}
                </div>
              )}
              {restoreStatus === "fail" && restoreMsg && (
                <div style={{
                  marginTop: 8, padding: "8px 12px", borderRadius: 8, fontSize: 12,
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444",
                }}>
                  {restoreMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Danger zone ── */}
      <div className="glass-card" style={{
        padding: "20px 24px",
        border: "1px solid rgba(239,68,68,0.2)",
        background: "rgba(239,68,68,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <ShieldAlert size={15} color="#ef4444" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>Danger Zone</span>
        </div>
        <div style={{ height: 1, background: "rgba(239,68,68,0.15)", margin: "10px 0" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>
              Reset Database
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              Drops all tables and re-applies migrations from scratch. <strong style={{ color: "#ef4444" }}>All data will be lost.</strong>
            </div>
          </div>
          {!confirmReset ? (
            <button className="btn-danger" style={{ fontSize: 12, flexShrink: 0 }}
              onClick={() => setConfirmReset(true)}>
              <RotateCcw size={13} /> Reset Database
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="btn-ghost" style={{ fontSize: 12 }}
                onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="btn-danger" style={{ fontSize: 12 }}
                onClick={() => {
                  setConfirmReset(false);
                  addLog("⚠ Reset triggered — dropping and re-migrating schema…", "err");
                  setShowLogs(true);
                  // In a real implementation this would call /api/db/reset
                }}>
                <ShieldAlert size={13} /> Yes, Reset Everything
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── SECTION: Billing ────────────────────────────────────────────────── */
function BillingSection() {
  const usage = { formulas: 87, formulaLimit: 200, users: 4, userLimit: 10,
    aiCredits: 6840, aiCreditLimit: 10000, storage: 2.3, storageLimit: 10 };

  const UsageBar = ({ used, limit, unit }: { used:number; limit:number; unit:string }) => {
    const pct = Math.min((used/limit)*100, 100);
    const warn = pct > 80;
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between",
          fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>
          <span>{used.toLocaleString()} {unit}</span>
          <span>{limit.toLocaleString()} {unit} limit</span>
        </div>
        <div style={{ height:6, background:"rgba(255,255,255,0.07)", borderRadius:99 }}>
          <div style={{ height:"100%", width:`${pct}%`, borderRadius:99,
            background: warn ? "#ef4444" : "#c9a84c", transition:"width 0.5s" }} />
        </div>
      </div>
    );
  };

  return (
    <>
      <SectionCard title="Current Plan">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 0 20px" }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:"#c9a84c" }}>Pro Plan</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:2 }}>
              Billed annually · ₹12,000 / month · Next renewal June 23, 2026
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-secondary" style={{ fontSize:12 }}>View Invoices</button>
            <button className="btn-primary" style={{ fontSize:12 }}>Upgrade to Enterprise</button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[
            { label:"Formulas", used:usage.formulas, limit:usage.formulaLimit, unit:"formulas" },
            { label:"Team Members", used:usage.users, limit:usage.userLimit, unit:"users" },
            { label:"AI Credits", used:usage.aiCredits, limit:usage.aiCreditLimit, unit:"credits" },
            { label:"Storage", used:usage.storage, limit:usage.storageLimit, unit:"GB" },
          ].map(u => (
            <div key={u.label} style={{ padding:"14px 16px", background:"rgba(255,255,255,0.03)",
              border:"1px solid rgba(255,255,255,0.07)", borderRadius:8 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)",
                marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>{u.label}</div>
              <UsageBar used={u.used} limit={u.limit} unit={u.unit} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Payment Method">
        <SettingRow label="Card on File">
          <div style={{ display:"flex", alignItems:"center", gap:12,
            padding:"10px 14px", background:"rgba(255,255,255,0.03)",
            border:"1px solid rgba(255,255,255,0.08)", borderRadius:8 }}>
            <div style={{ fontSize:20 }}>💳</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:"#fff", fontWeight:500 }}>Visa ending 4242</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>Expires 09 / 2027</div>
            </div>
            <button className="btn-ghost" style={{ fontSize:12 }}>Update</button>
          </div>
        </SettingRow>
        <SettingRow label="Billing Email">
          <input className="input-base" defaultValue="billing@pilhouse.com" />
        </SettingRow>
        <SettingRow label="GST / Tax Number">
          <input className="input-base" placeholder="e.g. 27AABCU9603R1ZX" />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Plan Comparison">
        {[
          { plan:"Starter",    price:"₹4,000",  formulas:50,  users:2,  ai:"2,000",   highlight:false },
          { plan:"Pro",        price:"₹12,000", formulas:200, users:10, ai:"10,000",  highlight:true  },
          { plan:"Enterprise", price:"Custom",  formulas:"∞", users:"∞",ai:"Unlimited",highlight:false },
        ].map(p => (
          <div key={p.plan} style={{
            display:"flex", alignItems:"center", gap:20,
            padding:"14px 16px", marginBottom:8, borderRadius:10,
            background: p.highlight ? "rgba(201,168,76,0.07)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${p.highlight ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.07)"}`,
          }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color: p.highlight ? "#c9a84c" : "#fff" }}>{p.plan}</span>
                {p.highlight && <span className="badge badge-yellow" style={{ fontSize:10 }}>Current</span>}
              </div>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{p.formulas} formulas</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{p.users} users</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{p.ai} AI credits</div>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff", width:80, textAlign:"right" }}>{p.price}/mo</div>
          </div>
        ))}
      </SectionCard>
    </>
  );
}

/* ─── Root component ─────────────────────────────────────────────────── */
export function SettingsContent() {
  const [active, setActive] = useState<SectionId>("organization");

  const SECTION_MAP: Record<SectionId, React.ReactNode> = {
    "organization":  <OrganizationSection />,
    "profile":       <ProfileSection />,
    "ai-providers":  <AIProvidersSection />,
    "notifications": <NotificationsSection />,
    "security":      <SecuritySection />,
    "regulatory":    <RegulatorySection />,
    "integrations":  <IntegrationsSection />,
    "database":      <DatabaseSection />,
    "billing":       <BillingSection />,
  };

  const current = SECTIONS.find(s => s.id === active)!;

  return (
    <div style={{ display:"flex", flex:1, minHeight:0, overflow:"hidden" }}>
      {/* ── Left settings nav ── */}
      <div style={{
        width: 220, flexShrink: 0, padding: "20px 10px",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        overflowY: "auto",
      }}>
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const on = active === s.id;
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"9px 12px", borderRadius:8, border:"none", cursor:"pointer",
                background: on ? "rgba(201,168,76,0.1)" : "transparent",
                marginBottom:2, textAlign:"left", transition:"background 0.15s",
              }}>
              <Icon size={15} color={on ? "#c9a84c" : "rgba(255,255,255,0.4)"} />
              <span style={{ flex:1, fontSize:13, fontWeight: on ? 600 : 400,
                color: on ? "#c9a84c" : "rgba(255,255,255,0.6)" }}>
                {s.label}
              </span>
              {s.badge && (
                <span className="badge badge-yellow" style={{ fontSize:10 }}>{s.badge}</span>
              )}
              {on && <ChevronRight size={12} color="#c9a84c" style={{ opacity:0.6 }} />}
            </button>
          );
        })}
      </div>

      {/* ── Right content ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px 32px" }}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>{current.label}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:2 }}>
            {{
              organization:  "Manage your organisation profile, locale, and branding",
              profile:       "Your personal account details and security preferences",
              "ai-providers":"Configure LLM providers, API keys, and default models",
              notifications: "Control how and when you receive alerts and digest emails",
              security:      "Two-factor auth, session management, and API keys",
              regulatory:    "IFRA amendment version, compliance rules, and SDS defaults",
              integrations:  "Connect third-party tools, webhooks, and data pipelines",
              database:      "Configure your database connection, apply migrations, and seed demo data",
              billing:       "Subscription plan, usage, and payment details",
            }[active]}
          </div>
        </div>

        {SECTION_MAP[active]}
      </div>
    </div>
  );
}
