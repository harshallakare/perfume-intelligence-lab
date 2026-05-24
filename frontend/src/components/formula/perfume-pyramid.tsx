"use client";

interface Ingredient {
  section: "top_note" | "middle_note" | "base_note" | "modifier" | "trace_molecule";
  percentage: number;
  material_name: string;
}

interface Props {
  ingredients: Ingredient[];
}

const SECTION_COLORS: Record<string, string> = {
  top_note: "#60a5fa",
  middle_note: "#a78bfa",
  base_note: "#c9a84c",
};

export function PerfumePyramid({ ingredients }: Props) {
  const topIng = ingredients.filter((i) => i.section === "top_note");
  const midIng = ingredients.filter((i) => i.section === "middle_note");
  const baseIng = ingredients.filter((i) => i.section === "base_note");

  const topPct = topIng.reduce((s, i) => s + i.percentage, 0);
  const midPct = midIng.reduce((s, i) => s + i.percentage, 0);
  const basePct = baseIng.reduce((s, i) => s + i.percentage, 0);
  const total = topPct + midPct + basePct || 1;

  const topH = Math.max(60, (topPct / total) * 160);
  const midH = Math.max(72, (midPct / total) * 160);
  const baseH = Math.max(80, (basePct / total) * 160);

  const Layer = ({
    color,
    height,
    label,
    pct,
    ingredients: ings,
    clipTop,
    clipBottom,
    zIndex,
  }: {
    color: string;
    height: number;
    label: string;
    pct: number;
    ingredients: Ingredient[];
    clipTop: number;
    clipBottom: number;
    zIndex: number;
  }) => (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        zIndex,
        overflow: "hidden",
      }}
    >
      {/* Trapezoidal shape via clip-path */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${color}30, ${color}15)`,
          clipPath: `polygon(${clipTop}% 0%, ${100 - clipTop}% 0%, ${100 - clipBottom}% 100%, ${clipBottom}% 100%)`,
          border: "none",
        }}
      />
      {/* Border overlay */}
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <polygon
          points={`${clipTop * 2},0 ${200 - clipTop * 2},0 ${200 - clipBottom * 2},100 ${clipBottom * 2},100`}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.4"
        />
      </svg>

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          paddingLeft: `${clipTop + 2}%`,
          paddingRight: `${clipTop + 2}%`,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>{pct.toFixed(1)}%</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textAlign: "center", maxWidth: "80%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ings.slice(0, 3).map((i) => i.material_name).join(", ")}
          {ings.length > 3 && ` +${ings.length - 3}`}
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "8px 0",
      }}
    >
      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {[
          { label: "Top", color: "#60a5fa" },
          { label: "Middle", color: "#a78bfa" },
          { label: "Base", color: "#c9a84c" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Pyramid layers */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
        <Layer
          color={SECTION_COLORS.top_note}
          height={topH}
          label="Top"
          pct={topPct}
          ingredients={topIng}
          clipTop={30}
          clipBottom={20}
          zIndex={3}
        />
        <Layer
          color={SECTION_COLORS.middle_note}
          height={midH}
          label="Heart"
          pct={midPct}
          ingredients={midIng}
          clipTop={20}
          clipBottom={8}
          zIndex={2}
        />
        <Layer
          color={SECTION_COLORS.base_note}
          height={baseH}
          label="Base"
          pct={basePct}
          ingredients={baseIng}
          clipTop={8}
          clipBottom={0}
          zIndex={1}
        />
      </div>

      {/* Empty state */}
      {topIng.length === 0 && midIng.length === 0 && baseIng.length === 0 && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 8 }}>
          Add ingredients to see pyramid
        </div>
      )}
    </div>
  );
}
