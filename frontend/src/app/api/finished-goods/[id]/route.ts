import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { dbToApi } from '../route'

// Edit a product/lot — pricing, cost components, yield, name.
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()

    const material = body.material_cost ?? null
    const packaging = body.packaging_cost ?? null
    const labor = body.labor_cost ?? null
    const batch = (material ?? 0) + (packaging ?? 0) + (labor ?? 0)

    const existing = await prisma.finishedGood.findUniqueOrThrow({ where: { id } })
    const bottles = body.bottles_filled ?? existing.bottlesFilled
    const unit = bottles > 0 ? batch / bottles : 0

    const good = await prisma.finishedGood.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        plannedBottles: body.planned_bottles ?? existing.plannedBottles,
        materialCost: material,
        packagingCost: packaging,
        laborCost: labor,
        batchCost: batch || null,
        unitCost: unit || null,
        sellPrice: body.sell_price ?? null,
        notes: body.notes ?? existing.notes,
      },
    })
    return NextResponse.json(dbToApi(good))
  } catch (err) {
    console.error('[PUT /api/finished-goods/[id]]', err)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    await prisma.finishedGood.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/finished-goods/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
