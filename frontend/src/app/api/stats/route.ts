import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "pil-default";

export async function GET() {
  try {
    const org = await prisma.organization.findFirst({ where: { slug: ORG_ID } });
    if (!org) return NextResponse.json({});

    const [
      totalMaterials,
      lowStockMaterials,
      totalFormulas,
      activeProductions,
      ifraPending,
      notifications,
      lowStockList,
      recentFormulas,
      recentProductions,
    ] = await Promise.all([
      prisma.rawMaterial.count({ where: { organizationId: org.id } }),

      prisma.rawMaterial.count({
        where: {
          organizationId: org.id,
          currentStock: { gt: 0 },
          AND: [{ minimumStock: { gt: 0 } }],
          // stock < minimum
        },
      }),

      prisma.formula.count({ where: { organizationId: org.id } }),

      prisma.productionOrder.count({
        where: {
          organizationId: org.id,
          status: { notIn: ["completed", "cancelled", "rejected", "draft"] },
        },
      }),

      prisma.formula.count({
        where: { organizationId: org.id, isIfraCompliant: null },
      }),

      prisma.notification.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),

      prisma.rawMaterial.findMany({
        where: {
          organizationId: org.id,
          minimumStock: { gt: 0 },
        },
        orderBy: { currentStock: "asc" },
        take: 5,
      }),

      prisma.formula.findMany({
        where: { organizationId: org.id },
        orderBy: { updatedAt: "desc" },
        take: 4,
        include: { _count: { select: { productions: true } } },
      }),

      prisma.productionOrder.findMany({
        where: { organizationId: org.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { formula: { select: { name: true } } },
      }),
    ]);

    // Real low-stock count: materials where currentStock < minimumStock
    const realLowStock = await prisma.rawMaterial.count({
      where: {
        organizationId: org.id,
        minimumStock: { gt: 0 },
        AND: [
          // Prisma SQLite doesn't support column comparisons directly; use raw
          { currentStock: { lt: 0 } }, // placeholder — we'll compute below
        ],
      },
    });

    // Compute low-stock properly by fetching and filtering
    const allWithMin = await prisma.rawMaterial.findMany({
      where: { organizationId: org.id, minimumStock: { gt: 0 } },
      select: { currentStock: true, minimumStock: true, name: true, unitOfMeasure: true },
    });
    const actualLowStock = allWithMin.filter((m) => m.currentStock < m.minimumStock);

    return NextResponse.json({
      total_materials: totalMaterials,
      low_stock_count: actualLowStock.length,
      total_formulas: totalFormulas,
      active_productions: activeProductions,
      ifra_pending: ifraPending,
      low_stock_materials: lowStockList
        .filter((m) => m.currentStock < m.minimumStock)
        .slice(0, 4)
        .map((m) => ({
          name: m.name,
          stock: m.currentStock,
          min: m.minimumStock,
          unit: m.unitOfMeasure,
        })),
      recent_notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        severity: n.severity,
        is_read: n.isRead,
        created_at: n.createdAt.toISOString(),
      })),
      top_formulas: recentFormulas.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.concentrationType.toUpperCase(),
        batches: f._count.productions,
        status: f.status,
      })),
      recent_productions: recentProductions.map((p) => ({
        id: p.id,
        order_number: p.orderNumber,
        formula_name: p.formula.name,
        status: p.status,
        updated_at: p.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("GET /api/stats:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
