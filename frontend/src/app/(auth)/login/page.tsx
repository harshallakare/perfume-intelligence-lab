"use client";

import { useState } from "react";
import { FlaskConical, Eye, EyeOff, Lock, Mail, Loader2, KeyRound, Check, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type Mode = "login" | "recover";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  // ── Login state ──────────────────────────────────────────────────────
  const [email,        setEmail]        = useState("admin@pil.com");
  const [password,     setPassword]     = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  // ── Recovery state ───────────────────────────────────────────────────
  const [rcEmail,      setRcEmail]      = useState("");
  const [rcCode,       setRcCode]       = useState("");
  const [rcNewPw,      setRcNewPw]      = useState("");
  const [rcConfirmPw,  setRcConfirmPw]  = useState("");
  const [rcLoading,    setRcLoading]    = useState(false);
  const [rcMsg,        setRcMsg]        = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error ?? "Login failed");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcEmail || !rcCode || !rcNewPw || !rcConfirmPw) {
      setRcMsg({ type: "err", text: "All fields are required." }); return;
    }
    if (rcNewPw !== rcConfirmPw) {
      setRcMsg({ type: "err", text: "Passwords do not match." }); return;
    }
    if (rcNewPw.length < 8) {
      setRcMsg({ type: "err", text: "Password must be at least 8 characters." }); return;
    }
    setRcLoading(true); setRcMsg(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", email: rcEmail, code: rcCode, newPassword: rcNewPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      setRcMsg({ type: "ok", text: data.message });
      setTimeout(() => { setMode("login"); setEmail(rcEmail); setPassword(""); }, 2000);
    } catch (e: any) {
      setRcMsg({ type: "err", text: e.message });
    } finally {
      setRcLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg, #c9a84c, #9b7b2a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", boxShadow: "0 0 32px rgba(201,168,76,0.25)",
        }}>
          <FlaskConical size={26} color="#0a0600" strokeWidth={2.5} />
        </div>
        <h1 style={{
          fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700,
          color: "#ffffff", marginBottom: 6, letterSpacing: "0.01em",
        }}>
          Perfume Intelligence Lab
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
          {mode === "login" ? "Sign in to your workspace" : "Recover account access"}
        </p>
      </div>

      <div className="glass-elevated" style={{ padding: 28 }}>

        {/* ── Login form ─────────────────────────────────────────────── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 7 }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                <input type="email" className="input-base" style={{ paddingLeft: 36 }}
                  placeholder="you@company.com" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Password</label>
                <button type="button" onClick={() => { setMode("recover"); setRcEmail(email); setRcMsg(null); }}
                  style={{ fontSize: 12, color: "#c9a84c", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Recover access
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                <input type={showPassword ? "text" : "password"} className="input-base"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 2,
                }}>
                  {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "11px 20px", marginTop: 4, fontSize: 14 }}>
              {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }}/> Signing in…</> : "Sign In"}
            </button>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, fontSize: 12, color: "#ef4444" }}>
                {error}
              </div>
            )}
          </form>
        )}

        {/* ── Recovery form ──────────────────────────────────────────── */}
        {mode === "recover" && (
          <form onSubmit={handleRecover} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <KeyRound size={15} color="#c9a84c"/>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Account Recovery</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  Enter the recovery code from Settings → Profile
                </div>
              </div>
            </div>

            {rcMsg && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: rcMsg.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${rcMsg.type === "ok" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 12, color: rcMsg.type === "ok" ? "#22c55e" : "#fca5a5",
              }}>
                {rcMsg.type === "ok" ? <Check size={13}/> : <AlertTriangle size={13}/>}
                {rcMsg.text}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>Email</label>
              <input className="input-base" type="email" placeholder="admin@pil.com"
                value={rcEmail} onChange={e => setRcEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>Recovery Code</label>
              <input className="input-base" placeholder="PIL-XXXX-XXXX" value={rcCode}
                onChange={e => setRcCode(e.target.value.toUpperCase())}
                style={{ fontFamily: "monospace", letterSpacing: 2 }} required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>New Password</label>
              <input className="input-base" type="password" placeholder="Min 8 characters"
                value={rcNewPw} onChange={e => setRcNewPw(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>Confirm Password</label>
              <input className="input-base" type="password" placeholder="Repeat new password"
                value={rcConfirmPw} onChange={e => setRcConfirmPw(e.target.value)} required />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }}
                onClick={() => { setMode("login"); setRcMsg(null); }}>
                ← Back to Login
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={rcLoading}>
                {rcLoading
                  ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }}/> Resetting…</>
                  : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        {/* Demo hint — login only */}
        {mode === "login" && (
          <div style={{
            marginTop: 18, padding: "10px 14px",
            background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.8,
          }}>
            <span style={{ color: "#c9a84c", fontWeight: 600 }}>Demo credentials</span><br/>
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>admin@pil.com</strong> / <code style={{ color: "#c9a84c" }}>admin123</code><br/>
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>perfumer@pil.com</strong> / <code style={{ color: "#c9a84c" }}>perfumer123</code>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
        Perfume Intelligence Lab · Enterprise Edition
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
