import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { dbToApi } from '../route'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()

    const item = await prisma.packagingItem.update({
      where: { id },
      data: {
        name: body.name,
        itemType: body.item_type,
        capacityMl: body.capacity_ml ?? null,
        unitPrice: body.unit_price ?? 0,
        currency: body.currency ?? 'USD',
        currentStock: Math.round(body.current_stock ?? 0),
        minimumStock: Math.round(body.minimum_stock ?? 0),
        supplierName: body.supplier_name ?? null,
        notes: body.notes ?? null,
      },
    })
    return NextResponse.json(dbToApi(item))
  } catch (err) {
    console.error('[PUT /api/packaging/[id]]', err)
    return NextResponse.json({ error: 'Failed to update packaging item' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    await prisma.packagingItem.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/packaging/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete packaging item' }, { status: 500 })
  }
}
