import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "pil-default";

const FAMILY_COLORS: Record<string, string> = {
  oriental:  "#c9a84c",
  woody:     "#60a5fa",
  floral:    "#f472b6",
  fresh:     "#34d399",
  citrus:    "#facc15",
  aquatic:   "#22d3ee",
  leather:   "#a78bfa",
  gourmand:  "#fb923c",
  fougere:   "#86efac",
  chypre:    "#94a3b8",
  musk:      "#e2e8f0",
  amber:     "#fbbf24",
  powdery:   "#d8b4fe",
  fruity:    "#f9a8d4",
  tobacco:   "#92400e",
  green:     "#4ade80",
};

/** Last N months labels e.g. ["Dec", "Jan", "Feb"] */
function lastNMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return {
      label: d.toLocaleString("en-US", { month: "short" }),
      year:  d.getFullYear(),
      month: d.getMonth() + 1, // 1-12
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end:   new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    };
  });
}

export async function GET() {
  try {
    const org = await prisma.organization.findFirst({ where: { slug: ORG_ID } });
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const now = new Date();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const months = lastNMonths(6);

    const [
      totalFormulas,
      formulasMtd,
      totalMaterials,
      activeProductions,
      productionsMtd,
      // Top materials by ingredient usage
      topMaterialsRaw,
      // Formulas by olfactory family
      familyGroups,
      // All formulas for per-month grouping
      allFormulas,
      // All productions for per-month grouping
      allProductions,
    ] = await Promise.all([
      prisma.formula.count({ where: { organizationId: org.id } }),

      prisma.formula.count({
        where: { organizationId: org.id, createdAt: { gte: mtdStart } },
      }),

      prisma.rawMaterial.count({ where: { organizationId: org.id } }),

      prisma.productionOrder.count({
        where: {
          organizationId: org.id,
          status: { notIn: ["completed", "cancelled", "rejected", "draft"] },
        },
      }),

      prisma.productionOrder.count({
        where: { organizationId: org.id, createdAt: { gte: mtdStart } },
      }),

      // Group ingredients by rawMaterialId to find most-used materials
      prisma.formulaIngredient.groupBy({
        by: ["rawMaterialId"],
        where: { formula: { organizationId: org.id } },
        _count: { rawMaterialId: true },
        orderBy: { _count: { rawMaterialId: "desc" } },
        take: 8,
      }),

      // Group formulas by olfactory family
      prisma.formula.groupBy({
        by: ["olfactoryFamily"],
        where: { organizationId: org.id },
        _count: { olfactoryFamily: true },
        orderBy: { _count: { olfactoryFamily: "desc" } },
      }),

      // All formulas for month bucketing
      prisma.formula.findMany({
        where: { organizationId: org.id },
        select: { createdAt: true },
      }),

      // All productions for month bucketing
      prisma.productionOrder.findMany({
        where: { organizationId: org.id },
        select: { createdAt: true, status: true },
      }),
    ]);

    // Resolve raw material names for top materials
    const materialIds = topMaterialsRaw.map((r) => r.rawMaterialId);
    const materials = await prisma.rawMaterial.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, name: true },
    });
    const matNameMap = Object.fromEntries(materials.map((m) => [m.id, m.name]));

    const topMaterials = topMaterialsRaw.map((r) => ({
      name: matNameMap[r.rawMaterialId] ?? "Unknown",
      uses: r._count.rawMaterialId,
    }));

    // Formulas by olfactory family (for pie chart)
    const formulasByFamily = familyGroups
      .filter((g) => g.olfactoryFamily != null)
      .map((g) => ({
        name:  (g.olfactoryFamily ?? "other").charAt(0).toUpperCase() + (g.olfactoryFamily ?? "other").slice(1),
        value: g._count.olfactoryFamily,
        color: FAMILY_COLORS[g.olfactoryFamily?.toLowerCase() ?? ""] ?? "rgba(255,255,255,0.2)",
      }));

    // If some formulas have no olfactory family, add an "Unspecified" bucket
    const familiedCount = familyGroups.filter((g) => g.olfactoryFamily != null).reduce((s, g) => s + g._count.olfactoryFamily, 0);
    if (totalFormulas > familiedCount) {
      formulasByFamily.push({ name: "Unspecified", value: totalFormulas - familiedCount, color: "rgba(255,255,255,0.15)" });
    }

    // Per-month formula creation
    const formulasByMonth = months.map((m) => ({
      month: m.label,
      count: allFormulas.filter((f) => {
        const d = new Date(f.createdAt);
        return d >= m.start && d <= m.end;
      }).length,
    }));

    // Per-month production orders
    const productionsByMonth = months.map((m) => ({
      month: m.label,
      count: allProductions.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= m.start && d <= m.end;
      }).length,
      completed: allProductions.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= m.start && d <= m.end && p.status === "completed";
      }).length,
    }));

    return NextResponse.json({
      kpis: {
        total_formulas:       totalFormulas,
        formulas_mtd:         formulasMtd,
        total_materials:      totalMaterials,
        active_productions:   activeProductions,
        productions_mtd:      productionsMtd,
      },
      top_materials:      topMaterials,
      formulas_by_family: formulasByFamily,
      formulas_by_month:  formulasByMonth,
      productions_by_month: productionsByMonth,
    });
  } catch (err) {
    console.error("GET /api/analytics:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
