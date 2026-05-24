"use client";

import { Search, Bell, Plus, ChevronDown, AlertTriangle, CheckCircle, Info, AlertCircle, X, Check } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  severity: string;
  created_at: string;
}

const SEV_ICON: Record<string, React.ElementType> = {
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const SEV_COLOR: Record<string, string> = {
  warning: "#eab308",
  error: "#ef4444",
  success: "#22c55e",
  info: "#60a5fa",
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const [searchFocus, setSearchFocus] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter((n) => !n.is_read);

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mark_all_read: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(5,5,15,0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Page title */}
      <div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 600, color: "#ffffff", letterSpacing: "0.01em" }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{subtitle}</p>}
      </div>

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={14} style={{ position: "absolute", left: 10, color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search…"
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            style={{
              width: searchFocus ? 220 : 160,
              padding: "6px 12px 6px 30px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${searchFocus ? "#c9a84c" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8,
              color: "#ffffff",
              fontSize: 13,
              outline: "none",
              transition: "all 0.2s ease",
              boxShadow: searchFocus ? "0 0 0 3px rgba(201,168,76,0.1)" : "none",
            }}
          />
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: notifOpen ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${notifOpen ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative", transition: "all 0.15s",
            }}
          >
            <Bell size={15} color={notifOpen ? "#c9a84c" : "rgba(255,255,255,0.5)"} />
            {unread.length > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 6,
                width: unread.length > 9 ? 14 : 8,
                height: 8,
                borderRadius: 99,
                background: "#ef4444",
                fontSize: 9,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}>
                {unread.length > 9 ? "9+" : ""}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: 360,
                background: "rgba(12,12,24,0.97)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                backdropFilter: "blur(20px)",
                overflow: "hidden",
                zIndex: 100,
              }}
            >
              {/* Header */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={14} style={{ color: "#c9a84c" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>Notifications</span>
                  {unread.length > 0 && (
                    <span style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99 }}>
                      {unread.length} new
                    </span>
                  )}
                </div>
                {unread.length > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
                  >
                    <Check size={11} /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = SEV_ICON[n.severity] ?? Info;
                    const color = SEV_COLOR[n.severity] ?? "#60a5fa";
                    return (
                      <div
                        key={n.id}
                        onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          cursor: n.link ? "pointer" : "default",
                          background: n.is_read ? "transparent" : `${color}06`,
                          display: "flex",
                          gap: 12,
                          transition: "background 0.15s",
                        }}
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          background: `${color}15`,
                          border: `1px solid ${color}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon size={13} style={{ color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                            <div style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 600, color: n.is_read ? "rgba(255,255,255,0.6)" : "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {n.title}
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{timeAgo(n.created_at)}</div>
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{n.message}</div>
                        </div>
                        {!n.is_read && (
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 4 }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                <button
                  onClick={() => setNotifOpen(false)}
                  style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        {action && (
          <button className="btn-primary" onClick={action.onClick} style={{ height: 34 }}>
            <Plus size={14} />
            {action.label}
          </button>
        )}

        {/* User chip */}
        <div ref={userRef} style={{ position: "relative" }}>
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 10px 4px 4px",
              background: userMenuOpen ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${userMenuOpen ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: "linear-gradient(135deg, #c9a84c33, #c9a84c66)",
              border: "1px solid rgba(201,168,76,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#c9a84c",
            }}>
              A
            </div>
            <ChevronDown size={12} color="rgba(255,255,255,0.4)" style={{ transition: "transform 0.15s", transform: userMenuOpen ? "rotate(180deg)" : "none" }} />
          </button>

          {userMenuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 180,
              background: "rgba(12,12,24,0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              backdropFilter: "blur(20px)",
              overflow: "hidden",
              zIndex: 100,
            }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>Admin User</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>admin@pil.com</div>
              </div>
              {[
                { label: "Settings", href: "/settings" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  style={{ display: "block", padding: "9px 14px", fontSize: 13, color: "rgba(255,255,255,0.7)", textDecoration: "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {item.label}
                </a>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%", padding: "9px 14px", fontSize: 13,
                    color: "#ef4444", background: "none", border: "none",
                    cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 6,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <X size={12} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
