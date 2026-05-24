import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const dbUrl = `file:${path.join(process.cwd(), 'prisma', 'pil.db')}`
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  // ── Organization ───────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'pil-default' },
    update: {},
    create: { name: 'Perfume Intelligence Lab', slug: 'pil-default', plan: 'pro', isActive: true },
  })
  console.log('Org:', org.id)

  // ── Raw Materials ──────────────────────────────────────────────────────
  const materialDefs = [
    { name: 'ISO E Super',               casNumber: '54464-57-2',  materialType: 'aroma_chemical', odorFamily: 'woody',    odorIntensity: 8,  volatilityClass: 'M', purityPercentage: 99.5, currentStock: 2450, minimumStock: 500,  costPerUnit: 0.08,  supplierName: 'IFF',           isNatural: false, isAllergen: false, isRestricted: false, ifraRestricted: false },
    { name: 'Ambroxan',                  casNumber: '3238-14-4',   materialType: 'aroma_chemical', odorFamily: 'amber',    odorIntensity: 7,  volatilityClass: 'B', purityPercentage: 99.0, currentStock: 12,   minimumStock: 50,   costPerUnit: 2.40,  supplierName: 'Symrise',       isNatural: false, isAllergen: false, isRestricted: false, ifraRestricted: false },
    { name: 'Rose Absolute (Bulgaria)',  casNumber: '8007-01-0',   materialType: 'absolute',       odorFamily: 'floral',   odorIntensity: 9,  volatilityClass: 'M', purityPercentage: 100,  currentStock: 8,    minimumStock: 25,   costPerUnit: 18.50, supplierName: 'Elan Natural',  isNatural: true,  isAllergen: true,  isRestricted: false, ifraRestricted: true  },
    { name: 'Hedione HC',                casNumber: '24851-98-7',  materialType: 'aroma_chemical', odorFamily: 'floral',   odorIntensity: 4,  volatilityClass: 'M', purityPercentage: 99.0, currentStock: 1800, minimumStock: 200,  costPerUnit: 0.35,  supplierName: 'Givaudan',      isNatural: false, isAllergen: false, isRestricted: false, ifraRestricted: false },
    { name: 'Vetiver Essential Oil',     casNumber: '8016-96-4',   materialType: 'essential_oil',  odorFamily: 'woody',    odorIntensity: 7,  volatilityClass: 'B', purityPercentage: 100,  currentStock: 45,   minimumStock: 100,  costPerUnit: 3.20,  supplierName: 'Bontoux',       isNatural: true,  isAllergen: false, isRestricted: false, ifraRestricted: false },
    { name: 'Dihydromyrcenol',           casNumber: '18479-58-8',  materialType: 'aroma_chemical', odorFamily: 'fresh',    odorIntensity: 8,  volatilityClass: 'T', purityPercentage: 99.5, currentStock: 3200, minimumStock: 300,  costPerUnit: 0.12,  supplierName: 'Firmenich',     isNatural: false, isAllergen: false, isRestricted: false, ifraRestricted: false },
    { name: 'Iris Butter',               casNumber: '90028-63-0',  materialType: 'absolute',       odorFamily: 'powdery',  odorIntensity: 8,  volatilityClass: 'M', purityPercentage: 100,  currentStock: 3,    minimumStock: 15,   costPerUnit: 85.00, supplierName: 'Robertet',      isNatural: true,  isAllergen: false, isRestricted: false, ifraRestricted: false },
    { name: 'Ethylene Brassylate',       casNumber: '105-95-3',    materialType: 'musk',           odorFamily: 'musk',     odorIntensity: 6,  volatilityClass: 'B', purityPercentage: 99.0, currentStock: 870,  minimumStock: 150,  costPerUnit: 0.55,  supplierName: 'IFF',           isNatural: false, isAllergen: false, isRestricted: false, ifraRestricted: false },
    { name: 'Linalool (Synthetic)',      casNumber: '78-70-6',     materialType: 'aroma_chemical', odorFamily: 'floral',   odorIntensity: 6,  volatilityClass: 'T', purityPercentage: 99.5, currentStock: 4100, minimumStock: 500,  costPerUnit: 0.09,  supplierName: 'Givaudan',      isNatural: false, isAllergen: true,  isRestricted: false, ifraRestricted: true  },
    { name: 'Oud Absolute (Bangladesh)', casNumber: null,          materialType: 'absolute',       odorFamily: 'woody',    odorIntensity: 10, volatilityClass: 'B', purityPercentage: 100,  currentStock: 22,   minimumStock: 10,   costPerUnit: 120.00,supplierName: 'Arabian Oud',   isNatural: true,  isAllergen: false, isRestricted: false, ifraRestricted: false },
  ]
  const matMap: Record<string, string> = {}
  for (const m of materialDefs) {
    const rec = await prisma.rawMaterial.upsert({
      where: { organizationId_name: { organizationId: org.id, name: m.name } },
      update: { casNumber: m.casNumber, materialType: m.materialType as any, odorFamily: m.odorFamily as any, odorIntensity: m.odorIntensity, volatilityClass: m.volatilityClass, purityPercentage: m.purityPercentage, currentStock: m.currentStock, minimumStock: m.minimumStock, costPerUnit: m.costPerUnit, supplierName: m.supplierName, isNatural: m.isNatural, isAllergen: m.isAllergen, isRestricted: m.isRestricted, ifraRestricted: m.ifraRestricted },
      create: { organizationId: org.id, name: m.name, casNumber: m.casNumber, materialType: m.materialType as any, odorFamily: m.odorFamily as any, odorIntensity: m.odorIntensity, volatilityClass: m.volatilityClass, purityPercentage: m.purityPercentage, currentStock: m.currentStock, minimumStock: m.minimumStock, costPerUnit: m.costPerUnit, supplierName: m.supplierName, isNatural: m.isNatural, isAllergen: m.isAllergen, isRestricted: m.isRestricted, ifraRestricted: m.ifraRestricted, currency: 'USD', unitOfMeasure: 'g' },
    })
    matMap[m.name] = rec.id
  }
  console.log(`Seeded ${materialDefs.length} raw materials`)

  // ── Formulas ───────────────────────────────────────────────────────────
  const formulaDefs = [
    {
      name: 'Dark Amber Oud', internalCode: 'PIL-F-001', concentrationType: 'edp',
      status: 'approved', olfactoryFamily: 'woody', genderTarget: 'masculine',
      totalFragrancePct: 22.4, costPerMl: 0.42, version: 4, isIfraCompliant: true,
      description: 'Rich, dark oriental with dominant oud and amber accord',
      ingredients: [
        { mat: 'Oud Absolute (Bangladesh)', section: 'base_note',   pct: 8.0,  sortOrder: 1 },
        { mat: 'Ambroxan',                  section: 'base_note',   pct: 5.0,  sortOrder: 2 },
        { mat: 'ISO E Super',               section: 'middle_note', pct: 4.0,  sortOrder: 3 },
        { mat: 'Rose Absolute (Bulgaria)',  section: 'middle_note', pct: 2.5,  sortOrder: 4 },
        { mat: 'Vetiver Essential Oil',     section: 'base_note',   pct: 1.8,  sortOrder: 5 },
        { mat: 'Ethylene Brassylate',       section: 'base_note',   pct: 1.1,  sortOrder: 6 },
      ],
    },
    {
      name: 'Midnight Leather', internalCode: 'PIL-F-002', concentrationType: 'parfum',
      status: 'locked', olfactoryFamily: 'leather', genderTarget: 'masculine',
      totalFragrancePct: 31.2, costPerMl: 0.78, version: 2, isIfraCompliant: true,
      description: 'Dark smoky leather built on vetiver and oud foundation',
      ingredients: [
        { mat: 'Vetiver Essential Oil',     section: 'base_note',   pct: 10.0, sortOrder: 1 },
        { mat: 'Oud Absolute (Bangladesh)', section: 'base_note',   pct: 8.0,  sortOrder: 2 },
        { mat: 'Ambroxan',                  section: 'base_note',   pct: 6.0,  sortOrder: 3 },
        { mat: 'ISO E Super',               section: 'middle_note', pct: 4.2,  sortOrder: 4 },
        { mat: 'Ethylene Brassylate',       section: 'base_note',   pct: 3.0,  sortOrder: 5 },
      ],
    },
    {
      name: 'Rose de Mai Clone', internalCode: 'PIL-F-003', concentrationType: 'edp',
      status: 'draft', olfactoryFamily: 'floral', genderTarget: 'feminine',
      totalFragrancePct: 18.8, costPerMl: 0.35, version: 1, isIfraCompliant: null,
      description: 'Attempt to clone a classic floral rose with modern longevity',
      ingredients: [
        { mat: 'Rose Absolute (Bulgaria)',  section: 'middle_note', pct: 8.0,  sortOrder: 1 },
        { mat: 'Hedione HC',                section: 'middle_note', pct: 5.0,  sortOrder: 2 },
        { mat: 'Linalool (Synthetic)',      section: 'top_note',    pct: 3.0,  sortOrder: 3 },
        { mat: 'Ethylene Brassylate',       section: 'base_note',   pct: 1.8,  sortOrder: 4 },
        { mat: 'Ambroxan',                  section: 'base_note',   pct: 1.0,  sortOrder: 5 },
      ],
    },
    {
      name: 'Aqua Metallica', internalCode: 'PIL-F-004', concentrationType: 'edt',
      status: 'approved', olfactoryFamily: 'fresh', genderTarget: 'unisex',
      totalFragrancePct: 12.5, costPerMl: 0.18, version: 3, isIfraCompliant: true,
      description: 'Fresh aquatic fougère with clean metallic iris heart',
      ingredients: [
        { mat: 'Dihydromyrcenol',           section: 'top_note',    pct: 5.0,  sortOrder: 1 },
        { mat: 'Linalool (Synthetic)',      section: 'top_note',    pct: 2.5,  sortOrder: 2 },
        { mat: 'Hedione HC',                section: 'middle_note', pct: 2.0,  sortOrder: 3 },
        { mat: 'Iris Butter',               section: 'middle_note', pct: 1.5,  sortOrder: 4 },
        { mat: 'Ethylene Brassylate',       section: 'base_note',   pct: 1.5,  sortOrder: 5 },
      ],
    },
    {
      name: 'Santal Dream', internalCode: 'PIL-F-005', concentrationType: 'extrait',
      status: 'under_review', olfactoryFamily: 'woody', genderTarget: 'unisex',
      totalFragrancePct: 38.0, costPerMl: 1.20, version: 1, isIfraCompliant: false,
      description: 'Creamy sandalwood-forward extrait with powdery iris and musk foundation',
      ingredients: [
        { mat: 'ISO E Super',               section: 'base_note',   pct: 12.0, sortOrder: 1 },
        { mat: 'Iris Butter',               section: 'middle_note', pct: 8.0,  sortOrder: 2 },
        { mat: 'Ambroxan',                  section: 'base_note',   pct: 8.0,  sortOrder: 3 },
        { mat: 'Vetiver Essential Oil',     section: 'base_note',   pct: 5.0,  sortOrder: 4 },
        { mat: 'Ethylene Brassylate',       section: 'base_note',   pct: 3.0,  sortOrder: 5 },
        { mat: 'Linalool (Synthetic)',      section: 'top_note',    pct: 2.0,  sortOrder: 6 },
      ],
    },
    {
      name: 'Amber Attar Base', internalCode: 'PIL-F-006', concentrationType: 'attar',
      status: 'approved', olfactoryFamily: 'amber', genderTarget: 'unisex',
      totalFragrancePct: 100, costPerMl: 2.80, version: 2, isIfraCompliant: true,
      description: 'Pure attar base — no alcohol carrier, oil-based amber accord for Middle Eastern market',
      ingredients: [
        { mat: 'Ambroxan',                  section: 'base_note',   pct: 35.0, sortOrder: 1 },
        { mat: 'Oud Absolute (Bangladesh)', section: 'base_note',   pct: 30.0, sortOrder: 2 },
        { mat: 'Rose Absolute (Bulgaria)',  section: 'middle_note', pct: 20.0, sortOrder: 3 },
        { mat: 'Ethylene Brassylate',       section: 'base_note',   pct: 15.0, sortOrder: 4 },
      ],
    },
  ]

  const formulaMap: Record<string, string> = {}
  for (const f of formulaDefs) {
    const existing = await prisma.formula.findFirst({
      where: { organizationId: org.id, name: f.name },
    })
    let formula
    if (existing) {
      formula = await prisma.formula.update({
        where: { id: existing.id },
        data: {
          internalCode: f.internalCode, concentrationType: f.concentrationType as any,
          status: f.status as any, olfactoryFamily: f.olfactoryFamily as any,
          genderTarget: f.genderTarget, totalFragrancePct: f.totalFragrancePct,
          costPerMl: f.costPerMl, version: f.version, isIfraCompliant: f.isIfraCompliant,
          description: f.description,
        },
      })
    } else {
      formula = await prisma.formula.create({
        data: {
          organizationId: org.id, name: f.name, internalCode: f.internalCode,
          concentrationType: f.concentrationType as any, status: f.status as any,
          olfactoryFamily: f.olfactoryFamily as any, genderTarget: f.genderTarget,
          totalFragrancePct: f.totalFragrancePct, costPerMl: f.costPerMl,
          version: f.version, isIfraCompliant: f.isIfraCompliant, description: f.description,
        },
      })
    }
    formulaMap[f.name] = formula.id

    // Seed ingredients (delete + recreate for idempotency)
    await prisma.formulaIngredient.deleteMany({ where: { formulaId: formula.id } })
    for (const ing of f.ingredients) {
      const matId = matMap[ing.mat]
      if (!matId) continue
      await prisma.formulaIngredient.create({
        data: {
          formulaId: formula.id, rawMaterialId: matId,
          section: ing.section as any, percentage: ing.pct, sortOrder: ing.sortOrder,
        },
      })
    }

    // Seed initial version snapshot if none exists
    const versionCount = await prisma.formulaVersion.count({ where: { formulaId: formula.id } })
    if (versionCount === 0) {
      await prisma.formulaVersion.create({
        data: {
          formulaId: formula.id,
          versionNum: f.version,
          snapshot: JSON.stringify({ name: f.name, status: f.status, totalFragrancePct: f.totalFragrancePct, ingredients: f.ingredients }),
          changeNote: 'Initial seed version',
        },
      })
    }
  }
  console.log(`Seeded ${formulaDefs.length} formulas`)

  // ── Production Orders ──────────────────────────────────────────────────
  const prodDefs = [
    { formulaName: 'Dark Amber Oud',     orderNumber: 'PIL-PO-2026-001', batchNumber: 'BATCH-001', status: 'macerating',    requestedBottles: 100, bottleSizeMl: 50,  assignedTo: 'Master Perfumer',  scheduledStart: '2026-05-18', macerationEndsAt: '2026-05-28' },
    { formulaName: 'Midnight Leather',   orderNumber: 'PIL-PO-2026-002', batchNumber: 'BATCH-002', status: 'quality_check', requestedBottles: 50,  bottleSizeMl: 100, assignedTo: 'Senior Perfumer',  scheduledStart: '2026-05-15', qcResult: 'pending' },
    { formulaName: 'Aqua Metallica',     orderNumber: 'PIL-PO-2026-003', batchNumber: 'BATCH-003', status: 'completed',     requestedBottles: 200, bottleSizeMl: 50,  assignedTo: 'Production Team',  scheduledStart: '2026-05-10', qcResult: 'pass' },
    { formulaName: 'Amber Attar Base',   orderNumber: 'PIL-PO-2026-004', batchNumber: 'BATCH-004', status: 'in_progress',   requestedBottles: 30,  bottleSizeMl: 12,  assignedTo: 'Master Perfumer',  scheduledStart: '2026-05-21' },
    { formulaName: 'Rose de Mai Clone',  orderNumber: 'PIL-PO-2026-005', batchNumber: 'BATCH-005', status: 'scheduled',     requestedBottles: 75,  bottleSizeMl: 50,  assignedTo: 'Senior Perfumer',  scheduledStart: '2026-05-28' },
  ]

  for (const p of prodDefs) {
    const fId = formulaMap[p.formulaName]
    if (!fId) continue
    const existing = await prisma.productionOrder.findFirst({ where: { organizationId: org.id, orderNumber: p.orderNumber } })
    if (!existing) {
      await prisma.productionOrder.create({
        data: {
          organizationId: org.id, formulaId: fId,
          orderNumber: p.orderNumber, batchNumber: p.batchNumber,
          status: p.status as any,
          requestedBottles: p.requestedBottles, bottleSizeMl: p.bottleSizeMl,
          plannedQtyMl: p.requestedBottles * p.bottleSizeMl,
          assignedTo: p.assignedTo,
          scheduledStart: p.scheduledStart ? new Date(p.scheduledStart) : null,
          macerationEndsAt: (p as any).macerationEndsAt ? new Date((p as any).macerationEndsAt) : null,
          qcResult: (p as any).qcResult ?? null,
        },
      })
    }
  }
  console.log(`Seeded ${prodDefs.length} production orders`)

  // ── Notifications ──────────────────────────────────────────────────────
  const notifDefs = [
    { type: 'low_stock',           severity: 'warning', title: 'Ambroxan running low',            message: 'Ambroxan stock is at 12g — below the 50g minimum threshold.',    link: '/inventory' },
    { type: 'low_stock',           severity: 'warning', title: 'Rose Absolute below minimum',     message: 'Rose Absolute (Bulgaria) stock at 8g, minimum is 25g.',           link: '/inventory' },
    { type: 'low_stock',           severity: 'error',   title: 'Iris Butter critical',            message: 'Iris Butter at 3g — critically below the 15g minimum. Reorder urgently.', link: '/inventory' },
    { type: 'ifra_breach',         severity: 'error',   title: 'IFRA violation — Santal Dream',   message: 'Santal Dream (v1) exceeds IFRA Cat 4 limits. Review before locking.', link: '/compliance' },
    { type: 'production_complete', severity: 'success', title: 'Aqua Metallica batch done',       message: 'PIL-PO-2026-003 passed QC. 200×50ml bottles ready for filling.',   link: '/production' },
  ]

  const existingCount = await prisma.notification.count({ where: { organizationId: org.id } })
  if (existingCount === 0) {
    for (const n of notifDefs) {
      await prisma.notification.create({
        data: { organizationId: org.id, type: n.type, severity: n.severity, title: n.title, message: n.message, link: n.link },
      })
    }
    console.log(`Seeded ${notifDefs.length} notifications`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
