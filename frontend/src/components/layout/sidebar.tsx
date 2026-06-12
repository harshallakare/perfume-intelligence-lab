"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FlaskConical, Copy, BookOpen, Package, Box,
  Factory, ShieldCheck, BarChart3, Sparkles, Layers,
  Users, Settings, Brain, DollarSign, ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    section: "Workspace",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
    ],
  },
  {
    section: "Formulation",
    items: [
      { label: "Formula Builder", href: "/formulas", icon: FlaskConical },
      { label: "Accord Library", href: "/accords", icon: Layers },
      { label: "Clone Engine", href: "/clone", icon: Copy },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { label: "Perfume Library", href: "/library", icon: BookOpen },
      { label: "Olfactory Data", href: "/olfactory", icon: Brain },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Inventory", href: "/inventory", icon: Package },
      { label: "Packaging", href: "/packaging", icon: Box },
      { label: "Production", href: "/production", icon: Factory },
      { label: "IFRA Compliance", href: "/compliance", icon: ShieldCheck },
    ],
  },
  {
    section: "Business",
    items: [
      { label: "Costing", href: "/costing", icon: DollarSign },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    section: "Settings",
    items: [
      { label: "Team", href: "/team", icon: Users },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "rgba(11,11,24,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #c9a84c, #9b7b2a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FlaskConical size={16} color="#0a0600" strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 13,
                fontWeight: 700,
                color: "#e8cc7a",
                lineHeight: 1.1,
                letterSpacing: "0.02em",
              }}
            >
              Perfume
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Intelligence Lab
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "8px 8px" }}>
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="sidebar-label">{group.section}</div>
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${active ? "active" : ""}`}
                  style={{ marginBottom: 2 }}
                >
                  <Icon
                    size={15}
                    style={{
                      color: active ? "#c9a84c" : "rgba(255,255,255,0.4)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && (
                    <ChevronRight size={12} style={{ color: "#c9a84c", opacity: 0.6 }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User / Org footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #c9a84c22, #c9a84c44)",
            border: "1px solid rgba(201,168,76,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#c9a84c",
            flexShrink: 0,
          }}
        >
          A
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#ffffff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Admin User
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            admin@pilhouse.com
          </div>
        </div>
      </div>
    </aside>
  );
}
