import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { dbToApi, applyStockDelta } from '../route'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const order = await prisma.order.findUniqueOrThrow({
      where: { id },
      include: { customer: { select: { name: true } }, lines: true, _count: { select: { lines: true } } },
    })
    return NextResponse.json(dbToApi(order))
  } catch (err) {
    console.error('[GET /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
}

// Update status / payment. Applies or reverses finished-good stock on transitions.
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const existing = await prisma.order.findUniqueOrThrow({ where: { id }, include: { lines: true } })

    const status = body.status ?? existing.status
    const amountPaid = body.amount_paid ?? existing.amountPaid
    const paymentStatus = amountPaid >= existing.total && existing.total > 0
      ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid'

    const lineInputs = existing.lines.map((l) => ({
      finished_good_id: l.finishedGoodId, description: l.description,
      quantity: l.quantity, unit_price: l.unitPrice, unit_cost: l.unitCost,
    }))

    let stockApplied = existing.stockApplied
    // Fulfilling for the first time → deduct stock
    if (status === 'fulfilled' && !existing.stockApplied) {
      await applyStockDelta(lineInputs, +1); stockApplied = true
    }
    // Cancelling a previously-fulfilled order → restock
    if (status === 'cancelled' && existing.stockApplied) {
      await applyStockDelta(lineInputs, -1); stockApplied = false
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status, amountPaid, paymentStatus, stockApplied, notes: body.notes ?? existing.notes },
      include: { customer: { select: { name: true } }, lines: true, _count: { select: { lines: true } } },
    })
    return NextResponse.json(dbToApi(order))
  } catch (err) {
    console.error('[PUT /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const existing = await prisma.order.findUniqueOrThrow({ where: { id }, include: { lines: true } })
    if (existing.stockApplied) {
      await applyStockDelta(existing.lines.map((l) => ({
        finished_good_id: l.finishedGoodId, description: l.description,
        quantity: l.quantity, unit_price: l.unitPrice, unit_cost: l.unitCost,
      })), -1)
    }
    await prisma.order.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
