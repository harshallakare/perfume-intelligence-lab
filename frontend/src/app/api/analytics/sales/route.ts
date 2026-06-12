import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "pil-default";

const CHANNEL_COLORS: Record<string, string> = {
  direct:    "#c9a84c",
  whatsapp:  "#34d399",
  retail:    "#60a5fa",
  wholesale: "#a78bfa",
  online:    "#f472b6",
};
const STATUS_COLORS: Record<string, string> = {
  draft:     "#94a3b8",
  confirmed: "#60a5fa",
  fulfilled: "#34d399",
  cancelled: "#ef4444",
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function lastNMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return {
      label: d.toLocaleString("en-US", { month: "short" }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
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
    const liveFilter = { organizationId: org.id, status: { not: "cancelled" } as const };

    const [orders, channelGroups, statusGroups, custGroups, lineGroups] = await Promise.all([
      // All non-cancelled orders for KPIs + monthly bucketing
      prisma.order.findMany({
        where: liveFilter,
        select: { orderDate: true, total: true, cogs: true, amountPaid: true },
      }),
      prisma.order.groupBy({
        by: ["channel"],
        where: liveFilter,
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { organizationId: org.id },
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ["customerId"],
        where: { ...liveFilter, customerId: { not: null } },
        _sum: { total: true },
        _count: { _all: true },
        orderBy: { _sum: { total: "desc" } },
        take: 8,
      }),
      prisma.orderLine.groupBy({
        by: ["finishedGoodId"],
        where: { order: liveFilter, finishedGoodId: { not: null } },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { lineTotal: "desc" } },
        take: 8,
      }),
    ]);

    // KPIs
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const profit = orders.reduce((s, o) => s + (o.total - o.cogs), 0);
    const orderCount = orders.length;
    const outstanding = orders.reduce((s, o) => s + (o.total - o.amountPaid), 0);
    const revenueMtd = orders.filter((o) => new Date(o.orderDate) >= mtdStart).reduce((s, o) => s + o.total, 0);
    const aov = orderCount > 0 ? revenue / orderCount : 0;
    const unitsSold = lineGroups.reduce((s, l) => s + (l._sum.quantity ?? 0), 0);

    // Monthly revenue + profit
    const revenueByMonth = months.map((m) => {
      const inMonth = orders.filter((o) => {
        const d = new Date(o.orderDate);
        return d >= m.start && d <= m.end;
      });
      return {
        month: m.label,
        revenue: Math.round(inMonth.reduce((s, o) => s + o.total, 0)),
        profit: Math.round(inMonth.reduce((s, o) => s + (o.total - o.cogs), 0)),
      };
    });

    // Best sellers — resolve product names
    const fgIds = lineGroups.map((l) => l.finishedGoodId!).filter(Boolean);
    const goods = await prisma.finishedGood.findMany({ where: { id: { in: fgIds } }, select: { id: true, name: true } });
    const goodName = Object.fromEntries(goods.map((g) => [g.id, g.name]));
    const bestSellers = lineGroups.map((l) => ({
      name: goodName[l.finishedGoodId!] ?? "Unknown",
      units: l._sum.quantity ?? 0,
      revenue: Math.round(l._sum.lineTotal ?? 0),
    }));

    // Top customers — resolve names
    const custIds = custGroups.map((c) => c.customerId!).filter(Boolean);
    const custs = await prisma.customer.findMany({ where: { id: { in: custIds } }, select: { id: true, name: true } });
    const custName = Object.fromEntries(custs.map((c) => [c.id, c.name]));
    const topCustomers = custGroups.map((c) => ({
      name: custName[c.customerId!] ?? "Unknown",
      revenue: Math.round(c._sum.total ?? 0),
      orders: c._count._all,
    }));

    const revenueByChannel = channelGroups
      .filter((g) => (g._sum.total ?? 0) > 0)
      .map((g) => ({ name: cap(g.channel), value: Math.round(g._sum.total ?? 0), color: CHANNEL_COLORS[g.channel] ?? "rgba(255,255,255,0.2)" }));

    const ordersByStatus = statusGroups.map((g) => ({
      name: cap(g.status), value: g._count._all, color: STATUS_COLORS[g.status] ?? "rgba(255,255,255,0.2)",
    }));

    return NextResponse.json({
      kpis: {
        revenue: Math.round(revenue),
        profit: Math.round(profit),
        orders: orderCount,
        aov: Math.round(aov),
        revenue_mtd: Math.round(revenueMtd),
        outstanding: Math.round(outstanding),
        units_sold: unitsSold,
      },
      revenue_by_month: revenueByMonth,
      best_sellers: bestSellers,
      top_customers: topCustomers,
      revenue_by_channel: revenueByChannel,
      orders_by_status: ordersByStatus,
    });
  } catch (err) {
    console.error("GET /api/analytics/sales:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
