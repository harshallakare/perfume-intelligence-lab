import { Header } from "@/components/layout/header";

export default function Page() {
  const titles: Record<string, { title: string; subtitle: string }> = {
    accords:   { title: "Accord Library",   subtitle: "Pre-built and custom fragrance accord blocks" },
    olfactory: { title: "Olfactory Data",   subtitle: "Molecule profiles, synergies & volatility curves" },
    costing:   { title: "Costing",          subtitle: "Formula cost analysis, margins & pricing tiers" },
    team:      { title: "Team",             subtitle: "Users, roles & access management" },
    settings:  { title: "Settings",         subtitle: "Organization settings, AI providers & integrations" },
  };
  const info = titles["team"] ?? { title: "team", subtitle: "" };
  return (
    <>
      <Header title={info.title} subtitle={info.subtitle} />
      <div className="page-content" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{info.title}</div>
          <div style={{ fontSize: 13 }}>Coming in the next sprint</div>
        </div>
      </div>
    </>
  );
}
