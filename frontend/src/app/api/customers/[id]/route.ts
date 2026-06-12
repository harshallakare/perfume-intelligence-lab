import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { dbToApi } from '../route'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type ?? 'retail',
        email: body.email ?? null,
        phone: body.phone ?? null,
        company: body.company ?? null,
        gstin: body.gstin ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        notes: body.notes ?? null,
      },
    })
    return NextResponse.json(dbToApi(customer, 0))
  } catch (err) {
    console.error('[PUT /api/customers/[id]]', err)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/customers/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
