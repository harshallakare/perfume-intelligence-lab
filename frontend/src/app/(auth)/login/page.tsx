"use client";

import { useState } from "react";
import { FlaskConical, Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pil.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
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

  return (
    <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #c9a84c, #9b7b2a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 0 32px rgba(201,168,76,0.25)",
          }}
        >
          <FlaskConical size={26} color="#0a0600" strokeWidth={2.5} />
        </div>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 6,
            letterSpacing: "0.01em",
          }}
        >
          Perfume Intelligence Lab
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
          Sign in to your workspace
        </p>
      </div>

      {/* Card */}
      <div
        className="glass-elevated"
        style={{ padding: 28 }}
      >
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 7 }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
              <input
                type="email"
                className="input-base"
                style={{ paddingLeft: 36 }}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Password</label>
              <a href="#" style={{ fontSize: 12, color: "#c9a84c", textDecoration: "none" }}>Forgot password?</a>
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
              <input
                type={showPassword ? "text" : "password"}
                className="input-base"
                style={{ paddingLeft: 36, paddingRight: 40 }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.3)",
                  display: "flex",
                  padding: 2,
                }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "11px 20px", marginTop: 4, fontSize: 14 }}
          >
            {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Signing in…</> : "Sign In"}
          </button>

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, fontSize: 12, color: "#ef4444" }}>
              {error}
            </div>
          )}
        </form>

        {/* Demo hint */}
        <div
          style={{
            marginTop: 18,
            padding: "10px 14px",
            background: "rgba(201,168,76,0.07)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: 8,
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.8,
          }}
        >
          <span style={{ color: "#c9a84c", fontWeight: 600 }}>Demo credentials</span><br />
          <strong style={{ color: "rgba(255,255,255,0.7)" }}>admin@pil.com</strong> / <code style={{ color: "#c9a84c" }}>admin123</code><br />
          <strong style={{ color: "rgba(255,255,255,0.7)" }}>perfumer@pil.com</strong> / <code style={{ color: "#c9a84c" }}>perfumer123</code>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
        Perfume Intelligence Lab · Enterprise Edition
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
