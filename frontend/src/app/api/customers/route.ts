import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const ORG_SLUG = 'pil-default'
async function getOrg() {
  return prisma.organization.findUniqueOrThrow({ where: { slug: ORG_SLUG } })
}

export async function GET() {
  try {
    const org = await getOrg()
    const customers = await prisma.customer.findMany({
      where: { organizationId: org.id },
      orderBy: { name: 'asc' },
      include: { _count: { select: { orders: true } } },
    })
    // attach lifetime spend
    const spend = await prisma.order.groupBy({
      by: ['customerId'],
      where: { organizationId: org.id, status: { not: 'cancelled' } },
      _sum: { total: true },
    })
    const spendMap = new Map(spend.map((s) => [s.customerId, s._sum.total ?? 0]))
    return NextResponse.json(customers.map((c) => dbToApi(c, spendMap.get(c.id) ?? 0)))
  } catch (err) {
    console.error('[GET /api/customers]', err)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const org = await getOrg()
    const body = await req.json()
    const customer = await prisma.customer.create({
      data: {
        organizationId: org.id,
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
    return NextResponse.json(dbToApi(customer, 0), { status: 201 })
  } catch (err) {
    console.error('[POST /api/customers]', err)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

export function dbToApi(c: any, totalSpend = 0) {
  return {
    id: c.id,
    organization_id: c.organizationId,
    name: c.name,
    type: c.type,
    email: c.email,
    phone: c.phone,
    company: c.company,
    gstin: c.gstin,
    address: c.address,
    city: c.city,
    notes: c.notes,
    order_count: c._count?.orders ?? 0,
    total_spend: totalSpend,
    created_at: c.createdAt?.toISOString() ?? '',
    updated_at: c.updatedAt?.toISOString() ?? '',
  }
}
