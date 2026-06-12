import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const ORG_SLUG = 'pil-default'

async function getOrg() {
  return prisma.organization.findUniqueOrThrow({ where: { slug: ORG_SLUG } })
}

export async function GET() {
  try {
    const org = await getOrg()
    const goods = await prisma.finishedGood.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    })
    // Revenue realised per lot = sum of non-cancelled order line totals
    const revenue = await prisma.orderLine.groupBy({
      by: ['finishedGoodId'],
      where: { finishedGoodId: { in: goods.map((g) => g.id) }, order: { status: { not: 'cancelled' } } },
      _sum: { lineTotal: true, quantity: true },
    })
    const revMap = new Map(revenue.map((r) => [r.finishedGoodId, r]))
    return NextResponse.json(goods.map((g) => dbToApi(g, revMap.get(g.id))))
  } catch (err) {
    console.error('[GET /api/finished-goods]', err)
    return NextResponse.json({ error: 'Failed to fetch finished goods' }, { status: 500 })
  }
}

// Commit a produced batch to stock. If a packaging item is referenced, decrement
// its stock by the number of bottles filled (capped at available stock).
export async function POST(req: NextRequest) {
  try {
    const org = await getOrg()
    const body = await req.json()

    const bottlesFilled = Math.max(0, Math.round(body.bottles_filled ?? 0))
    let bottlesUsed = 0

    // Decrement packaging stock if a bottle SKU was selected
    if (body.packaging_id) {
      const pkg = await prisma.packagingItem.findUnique({ where: { id: body.packaging_id } })
      if (pkg && pkg.organizationId === org.id) {
        bottlesUsed = Math.min(bottlesFilled, pkg.currentStock)
        await prisma.packagingItem.update({
          where: { id: pkg.id },
          data: { currentStock: pkg.currentStock - bottlesUsed },
        })
      }
    }

    const good = await prisma.finishedGood.create({
      data: {
        organizationId: org.id,
        name: body.name ?? 'Untitled batch',
        perfumeType: body.perfume_type ?? 'edp',
        batchVolumeMl: body.batch_volume_ml ?? 0,
        bottleSizeMl: body.bottle_size_ml ?? 0,
        bottlesFilled,
        bottlesUsed,
        plannedBottles: body.planned_bottles ?? null,
        leftoverMl: body.leftover_ml ?? 0,
        oilMl: body.oil_ml ?? 0,
        alcoholMl: body.alcohol_ml ?? 0,
        fixativeMl: body.fixative_ml ?? 0,
        materialCost: body.material_cost ?? null,
        packagingCost: body.packaging_cost ?? null,
        laborCost: body.labor_cost ?? null,
        unitCost: body.unit_cost ?? null,
        batchCost: body.batch_cost ?? null,
        sellPrice: body.sell_price ?? null,
        packagingId: body.packaging_id ?? null,
        notes: body.notes ?? null,
      },
    })

    return NextResponse.json({ ...dbToApi(good), bottles_used: bottlesUsed }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/finished-goods]', err)
    return NextResponse.json({ error: 'Failed to commit finished good' }, { status: 500 })
  }
}

export function dbToApi(g: any, rev?: { _sum: { lineTotal: number | null; quantity: number | null } }) {
  return {
    id: g.id,
    organization_id: g.organizationId,
    name: g.name,
    perfume_type: g.perfumeType,
    batch_volume_ml: g.batchVolumeMl,
    bottle_size_ml: g.bottleSizeMl,
    planned_bottles: g.plannedBottles,
    bottles_filled: g.bottlesFilled,
    bottles_used: g.bottlesUsed,
    bottles_sold: g.bottlesSold ?? 0,
    leftover_ml: g.leftoverMl,
    oil_ml: g.oilMl,
    alcohol_ml: g.alcoholMl,
    fixative_ml: g.fixativeMl,
    material_cost: g.materialCost,
    packaging_cost: g.packagingCost,
    labor_cost: g.laborCost,
    unit_cost: g.unitCost,
    batch_cost: g.batchCost,
    sell_price: g.sellPrice,
    packaging_id: g.packagingId,
    notes: g.notes,
    revenue: rev?._sum.lineTotal ?? 0,
    qty_sold_orders: rev?._sum.quantity ?? 0,
    created_at: g.createdAt?.toISOString() ?? '',
    updated_at: g.updatedAt?.toISOString() ?? '',
  }
}
