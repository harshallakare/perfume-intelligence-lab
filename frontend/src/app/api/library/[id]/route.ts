import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

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

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const row = await prisma.perfumeReference.findUniqueOrThrow({ where: { id } })
    return NextResponse.json(dbToApi(row))
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const row = await prisma.perfumeReference.update({
      where: { id },
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
    return NextResponse.json(dbToApi(row))
  } catch (err) {
    console.error('PUT /api/library/[id]:', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    await prisma.perfumeReference.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/library/[id]:', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
