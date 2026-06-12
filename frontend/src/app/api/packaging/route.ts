import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const ORG_SLUG = 'pil-default'

async function getOrg() {
  return prisma.organization.findUniqueOrThrow({ where: { slug: ORG_SLUG } })
}

export async function GET() {
  try {
    const org = await getOrg()
    const items = await prisma.packagingItem.findMany({
      where: { organizationId: org.id },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(items.map(dbToApi))
  } catch (err) {
    console.error('[GET /api/packaging]', err)
    return NextResponse.json({ error: 'Failed to fetch packaging items' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const org = await getOrg()
    const body = await req.json()

    const item = await prisma.packagingItem.create({
      data: {
        organizationId: org.id,
        name: body.name,
        itemType: body.item_type ?? 'bottle',
        capacityMl: body.capacity_ml ?? null,
        unitPrice: body.unit_price ?? 0,
        currency: body.currency ?? 'USD',
        currentStock: Math.round(body.current_stock ?? 0),
        minimumStock: Math.round(body.minimum_stock ?? 0),
        supplierName: body.supplier_name ?? null,
        notes: body.notes ?? null,
      },
    })
    return NextResponse.json(dbToApi(item), { status: 201 })
  } catch (err) {
    console.error('[POST /api/packaging]', err)
    return NextResponse.json({ error: 'Failed to create packaging item' }, { status: 500 })
  }
}

export function dbToApi(p: any) {
  return {
    id: p.id,
    organization_id: p.organizationId,
    name: p.name,
    item_type: p.itemType,
    capacity_ml: p.capacityMl,
    unit_price: p.unitPrice,
    currency: p.currency,
    current_stock: p.currentStock,
    minimum_stock: p.minimumStock,
    supplier_name: p.supplierName,
    notes: p.notes,
    created_at: p.createdAt?.toISOString() ?? '',
    updated_at: p.updatedAt?.toISOString() ?? '',
  }
}
