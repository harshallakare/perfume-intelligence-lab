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
    return NextResponse.json(goods.map(dbToApi))
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
        leftoverMl: body.leftover_ml ?? 0,
        oilMl: body.oil_ml ?? 0,
        alcoholMl: body.alcohol_ml ?? 0,
        fixativeMl: body.fixative_ml ?? 0,
        unitCost: body.unit_cost ?? null,
        batchCost: body.batch_cost ?? null,
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

export function dbToApi(g: any) {
  return {
    id: g.id,
    organization_id: g.organizationId,
    name: g.name,
    perfume_type: g.perfumeType,
    batch_volume_ml: g.batchVolumeMl,
    bottle_size_ml: g.bottleSizeMl,
    bottles_filled: g.bottlesFilled,
    bottles_used: g.bottlesUsed,
    leftover_ml: g.leftoverMl,
    oil_ml: g.oilMl,
    alcohol_ml: g.alcoholMl,
    fixative_ml: g.fixativeMl,
    unit_cost: g.unitCost,
    batch_cost: g.batchCost,
    packaging_id: g.packagingId,
    notes: g.notes,
    created_at: g.createdAt?.toISOString() ?? '',
  }
}
