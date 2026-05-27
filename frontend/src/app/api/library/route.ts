import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function dbToApi(r: any) {
  return {
    id:              r.id,
    name:            r.name,
    brand:           r.brand,
    perfumer:        r.perfumer ?? null,
    year:            r.year ?? null,
    concentration:   r.concentration ?? null,
    category:        r.category,
    olfactory_family: r.olfactoryFamily ?? null,
    gender_target:   r.genderTarget ?? null,
    top_notes:       JSON.parse(r.topNotes    || '[]'),
    middle_notes:    JSON.parse(r.middleNotes || '[]'),
    base_notes:      JSON.parse(r.baseNotes   || '[]'),
    projection:      r.projection ?? null,
    longevity_hrs:   r.longevityHrs ?? null,
    season:          r.season ?? null,
    occasion:        r.occasion ?? null,
    price_tier:      r.priceTier ?? null,
    description:     r.description ?? null,
    community_score: r.communityScore ?? null,
    created_at:      r.createdAt.toISOString(),
    updated_at:      r.updatedAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const family   = searchParams.get('family')
    const gender   = searchParams.get('gender')
    const conc     = searchParams.get('concentration')
    const q        = searchParams.get('q')

    const where: any = {}
    if (category && category !== 'all') where.category = category
    if (family   && family   !== 'all') where.olfactoryFamily = family
    if (gender   && gender   !== 'all') where.genderTarget = gender
    if (conc     && conc     !== 'all') where.concentration = conc
    if (q) where.OR = [
      { name:  { contains: q } },
      { brand: { contains: q } },
    ]

    const rows = await prisma.perfumeReference.findMany({
      where,
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(rows.map(dbToApi))
  } catch (err) {
    console.error('GET /api/library:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const row = await prisma.perfumeReference.create({
      data: {
        name:           body.name,
        brand:          body.brand,
        perfumer:       body.perfumer ?? null,
        year:           body.year ?? null,
        concentration:  body.concentration ?? null,
        category:       body.category ?? 'designer',
        olfactoryFamily: body.olfactory_family ?? null,
        genderTarget:   body.gender_target ?? null,
        topNotes:       JSON.stringify(body.top_notes    ?? []),
        middleNotes:    JSON.stringify(body.middle_notes ?? []),
        baseNotes:      JSON.stringify(body.base_notes   ?? []),
        projection:     body.projection     ?? null,
        longevityHrs:   body.longevity_hrs  ?? null,
        season:         body.season         ?? null,
        occasion:       body.occasion       ?? null,
        priceTier:      body.price_tier     ?? null,
        description:    body.description    ?? null,
        communityScore: body.community_score ?? null,
      },
    })
    return NextResponse.json(dbToApi(row), { status: 201 })
  } catch (err) {
    console.error('POST /api/library:', err)
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}
