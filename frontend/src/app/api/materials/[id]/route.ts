import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { dbToApi } from '../route'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/materials/[id]'>) {
  try {
    const { id } = await ctx.params
    const material = await prisma.rawMaterial.findUniqueOrThrow({ where: { id } })
    return NextResponse.json(dbToApi(material))
  } catch (err) {
    console.error('[GET /api/materials/[id]]', err)
    return NextResponse.json({ error: 'Material not found' }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/materials/[id]'>) {
  try {
    const { id } = await ctx.params
    const body = await req.json()

    const material = await prisma.rawMaterial.update({
      where: { id },
      data: {
        name: body.name,
        casNumber: body.cas_number ?? null,
        materialType: body.material_type,
        odorFamily: body.odor_family ?? null,
        odorDescription: body.odor_description ?? null,
        odorIntensity: body.odor_intensity ?? null,
        volatilityClass: body.volatility_class ?? null,
        purityPercentage: body.purity_percentage ?? null,
        currentStock: body.current_stock ?? 0,
        minimumStock: body.minimum_stock ?? 0,
        unitOfMeasure: body.unit_of_measure ?? 'g',
        costPerUnit: body.cost_per_unit ?? 0,
        currency: body.currency ?? 'USD',
        supplierName: body.supplier_name ?? null,
        storageConditions: body.storage_conditions ?? null,
        isNatural: body.is_natural ?? false,
        isAllergen: body.is_allergen ?? false,
        isRestricted: body.is_restricted ?? false,
        ifraRestricted: body.ifra_restricted ?? false,
      },
    })

    return NextResponse.json(dbToApi(material))
  } catch (err) {
    console.error('[PUT /api/materials/[id]]', err)
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/materials/[id]'>) {
  try {
    const { id } = await ctx.params

    // Check if used in any formula before deleting
    const usageCount = await prisma.formulaIngredient.count({ where: { rawMaterialId: id } })
    if (usageCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this material is used in ${usageCount} formula ingredient${usageCount > 1 ? 's' : ''}. Remove it from all formulas first.` },
        { status: 409 }
      )
    }

    await prisma.rawMaterial.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/materials/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
  }
}
