import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const ORG_SLUG = 'pil-default'
async function getOrg() {
  return prisma.organization.findUniqueOrThrow({ where: { slug: ORG_SLUG } })
}

interface LineInput {
  finished_good_id?: string | null
  description: string
  quantity: number
  unit_price: number
  unit_cost?: number
}

function computeTotals(lines: LineInput[], discount: number, taxPct: number) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const cogs = lines.reduce((s, l) => s + l.quantity * (l.unit_cost ?? 0), 0)
  const taxable = Math.max(0, subtotal - discount)
  const taxAmount = taxable * (taxPct / 100)
  const total = taxable + taxAmount
  return { subtotal, cogs, taxAmount, total }
}

export async function GET() {
  try {
    const org = await getOrg()
    const orders = await prisma.order.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } }, _count: { select: { lines: true } } },
    })
    return NextResponse.json(orders.map(dbToApi))
  } catch (err) {
    console.error('[GET /api/orders]', err)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const org = await getOrg()
    const body = await req.json()
    const lines: LineInput[] = Array.isArray(body.lines) ? body.lines : []

    const discount = body.discount_amount ?? 0
    const taxPct = body.tax_pct ?? 0
    const { subtotal, cogs, taxAmount, total } = computeTotals(lines, discount, taxPct)

    const count = await prisma.order.count({ where: { organizationId: org.id } })
    const orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`

    const status = body.status ?? 'draft'
    const amountPaid = body.amount_paid ?? 0
    const paymentStatus = amountPaid >= total && total > 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid'
    const applyStock = status === 'fulfilled'

    const order = await prisma.order.create({
      data: {
        organizationId: org.id,
        customerId: body.customer_id ?? null,
        orderNumber,
        status,
        channel: body.channel ?? 'direct',
        subtotal,
        discountAmount: discount,
        taxPct,
        taxAmount,
        total,
        cogs,
        amountPaid,
        paymentStatus,
        stockApplied: applyStock,
        notes: body.notes ?? null,
        lines: {
          create: lines.map((l) => ({
            finishedGoodId: l.finished_good_id ?? null,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unit_price,
            unitCost: l.unit_cost ?? 0,
            lineTotal: l.quantity * l.unit_price,
          })),
        },
      },
      include: { customer: { select: { name: true } }, _count: { select: { lines: true } } },
    })

    if (applyStock) await applyStockDelta(lines, +1)

    return NextResponse.json(dbToApi(order), { status: 201 })
  } catch (err) {
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

// Increment (dir +1) or restock (dir -1) sold counts on finished goods.
export async function applyStockDelta(lines: LineInput[], dir: 1 | -1) {
  for (const l of lines) {
    if (!l.finished_good_id) continue
    const fg = await prisma.finishedGood.findUnique({ where: { id: l.finished_good_id } })
    if (!fg) continue
    const next = Math.max(0, fg.bottlesSold + dir * l.quantity)
    await prisma.finishedGood.update({ where: { id: fg.id }, data: { bottlesSold: next } })
  }
}

export function dbToApi(o: any) {
  return {
    id: o.id,
    organization_id: o.organizationId,
    customer_id: o.customerId,
    customer_name: o.customer?.name ?? null,
    order_number: o.orderNumber,
    status: o.status,
    channel: o.channel,
    order_date: o.orderDate?.toISOString() ?? '',
    subtotal: o.subtotal,
    discount_amount: o.discountAmount,
    tax_pct: o.taxPct,
    tax_amount: o.taxAmount,
    total: o.total,
    cogs: o.cogs,
    profit: o.total - o.cogs,
    amount_paid: o.amountPaid,
    payment_status: o.paymentStatus,
    stock_applied: o.stockApplied,
    notes: o.notes,
    line_count: o._count?.lines ?? (o.lines?.length ?? 0),
    lines: o.lines?.map(lineToApi),
    created_at: o.createdAt?.toISOString() ?? '',
    updated_at: o.updatedAt?.toISOString() ?? '',
  }
}

export function lineToApi(l: any) {
  return {
    id: l.id,
    finished_good_id: l.finishedGoodId,
    description: l.description,
    quantity: l.quantity,
    unit_price: l.unitPrice,
    unit_cost: l.unitCost,
    line_total: l.lineTotal,
  }
}
