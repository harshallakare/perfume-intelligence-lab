import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Default org slug — single-tenant for now
const ORG_SLUG = 'pil-default'

async function getOrg() {
  return prisma.organization.findUniqueOrThrow({ where: { slug: ORG_SLUG } })
}

export async function GET() {
  try {
    const org = await getOrg()
    const materials = await prisma.rawMaterial.findMany({
      where: { organizationId: org.id },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(materials.map(dbToApi))
  } catch (err) {
    console.error('[GET /api/materials]', err)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const org = await getOrg()
    const body = await req.json()

    const material = await prisma.rawMaterial.create({
      data: {
        organizationId: org.id,
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
        density: body.density ?? null,
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

    return NextResponse.json(dbToApi(material), { status: 201 })
  } catch (err) {
    console.error('[POST /api/materials]', err)
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
  }
}

// Convert Prisma snake_case DB record to frontend RawMaterial shape
export function dbToApi(m: any) {
  return {
    id: m.id,
    organization_id: m.organizationId,
    name: m.name,
    cas_number: m.casNumber,
    material_type: m.materialType,
    odor_family: m.odorFamily,
    odor_description: m.odorDescription,
    odor_intensity: m.odorIntensity,
    volatility_class: m.volatilityClass,
    purity_percentage: m.purityPercentage,
    current_stock: m.currentStock,
    minimum_stock: m.minimumStock,
    unit_of_measure: m.unitOfMeasure,
    density: m.density,
    cost_per_unit: m.costPerUnit,
    currency: m.currency,
    supplier_name: m.supplierName,
    storage_conditions: m.storageConditions,
    is_natural: m.isNatural,
    is_allergen: m.isAllergen,
    is_restricted: m.isRestricted,
    ifra_restricted: m.ifraRestricted,
    tags: m.tags ? JSON.parse(m.tags) : [],
    created_at: m.createdAt?.toISOString() ?? '',
    updated_at: m.updatedAt?.toISOString() ?? '',
  }
}
