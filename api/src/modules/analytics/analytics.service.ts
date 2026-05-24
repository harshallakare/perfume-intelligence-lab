import prisma from "../../lib/prisma";

export async function getDashboardStats(orgId: string) {
  const [
    totalMaterials,
    lowStockMaterials,
    totalFormulas,
    activeProduction,
    completedThisMonth,
    complianceChecks,
    formulasByStatus,
    formulasByConcentration,
    recentFormulas,
  ] = await Promise.all([
    prisma.rawMaterial.count({ where: { organizationId: orgId } }),
    // Low stock: current < minimum
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) FROM raw_materials
      WHERE organization_id = ${orgId}::uuid
        AND current_stock > 0
        AND minimum_stock > 0
        AND current_stock < minimum_stock
    `,
    prisma.formula.count({ where: { organizationId: orgId } }),
    prisma.productionOrder.count({
      where: { organizationId: orgId, status: { in: ["in_progress", "macerating", "quality_check", "scheduled"] } },
    }),
    prisma.productionOrder.count({
      where: {
        organizationId: orgId,
        status: "completed",
        completedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.complianceCheck.count({ where: { organizationId: orgId } }),
    prisma.formula.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
    }),
    prisma.formula.groupBy({
      by: ["concentrationType"],
      where: { organizationId: orgId },
      _count: true,
    }),
    prisma.formula.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, concentrationType: true, updatedAt: true },
    }),
  ]);

  return {
    overview: {
      totalMaterials,
      lowStockMaterials: Number((lowStockMaterials as [{ count: bigint }])[0]?.count ?? 0),
      totalFormulas,
      activeProduction,
      completedThisMonth,
      complianceChecks,
    },
    formulasByStatus: formulasByStatus.map((r) => ({ status: r.status, count: r._count })),
    formulasByConcentration: formulasByConcentration.map((r) => ({
      type: r.concentrationType,
      count: r._count,
    })),
    recentFormulas,
  };
}

export async function getInventoryAnalytics(orgId: string) {
  const [byType, byOdorFamily, topValueMaterials, stockAlerts] = await Promise.all([
    prisma.rawMaterial.groupBy({
      by: ["materialType"],
      where: { organizationId: orgId },
      _count: true,
      _avg: { costPerUnit: true },
    }),
    prisma.rawMaterial.groupBy({
      by: ["odorFamily"],
      where: { organizationId: orgId, odorFamily: { not: null } },
      _count: true,
    }),
    prisma.rawMaterial.findMany({
      where: { organizationId: orgId },
      orderBy: { costPerUnit: "desc" },
      take: 10,
      select: { id: true, name: true, costPerUnit: true, currentStock: true, currency: true, materialType: true },
    }),
    // Materials needing reorder
    prisma.$queryRaw<{ id: string; name: string; currentStock: number; minimumStock: number }[]>`
      SELECT id::text, name, current_stock::float as "currentStock", minimum_stock::float as "minimumStock"
      FROM raw_materials
      WHERE organization_id = ${orgId}::uuid
        AND minimum_stock > 0
        AND current_stock < minimum_stock
      ORDER BY (current_stock / NULLIF(minimum_stock, 0)) ASC
      LIMIT 20
    `,
  ]);

  return {
    byType: byType.map((r) => ({ type: r.materialType, count: r._count, avgCost: Number(r._avg.costPerUnit ?? 0) })),
    byOdorFamily: byOdorFamily.map((r) => ({ family: r.odorFamily, count: r._count })),
    topValueMaterials,
    stockAlerts,
  };
}

export async function getProductionAnalytics(orgId: string) {
  const [byStatus, volumeByMonth, qcPassRate] = await Promise.all([
    prisma.productionOrder.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
      _sum: { plannedQtyMl: true, actualQtyMl: true },
    }),
    // Volume by month (last 6 months)
    prisma.$queryRaw<{ month: string; totalMl: number; orders: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        SUM(COALESCE(actual_qty_ml, planned_qty_ml))::float AS "totalMl",
        COUNT(*)::int AS orders
      FROM production_orders
      WHERE organization_id = ${orgId}::uuid
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY 1
    `,
    // QC pass rate
    prisma.$queryRaw<[{ pass: number; fail: number; conditional: number }]>`
      SELECT
        COUNT(*) FILTER (WHERE result = 'pass')::int AS pass,
        COUNT(*) FILTER (WHERE result = 'fail')::int AS fail,
        COUNT(*) FILTER (WHERE result = 'conditional_pass')::int AS conditional
      FROM production_qc_logs pql
      JOIN production_orders po ON po.id = pql.production_order_id
      WHERE po.organization_id = ${orgId}::uuid
    `,
  ]);

  const qc = (qcPassRate as [{ pass: number; fail: number; conditional: number }])[0] ?? { pass: 0, fail: 0, conditional: 0 };
  const totalQc = qc.pass + qc.fail + qc.conditional;

  return {
    byStatus: byStatus.map((r) => ({
      status: r.status,
      count: r._count,
      plannedMl: Number(r._sum.plannedQtyMl ?? 0),
      actualMl: Number(r._sum.actualQtyMl ?? 0),
    })),
    volumeByMonth,
    qcStats: {
      ...qc,
      total: totalQc,
      passRate: totalQc > 0 ? parseFloat(((qc.pass / totalQc) * 100).toFixed(1)) : 0,
    },
  };
}
