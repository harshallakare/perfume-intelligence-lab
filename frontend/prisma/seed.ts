import path from 'node:path'
import { scryptSync, randomBytes } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const dbUrl = `file:${path.join(process.cwd(), 'prisma', 'pil.db')}`
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(plain, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex')
  return `${salt}:${hash}`
}

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

  // ── User Credentials ──────────────────────────────────────────────────
  const defaultUsers = [
    { email: 'admin@pil.com',    name: 'Admin User',      role: 'admin',    password: 'admin123'    },
    { email: 'perfumer@pil.com', name: 'Master Perfumer', role: 'perfumer', password: 'perfumer123' },
    { email: 'viewer@pil.com',   name: 'Viewer',          role: 'viewer',   password: 'viewer123'   },
  ]
  for (const u of defaultUsers) {
    const existing = await prisma.userCredential.findUnique({ where: { email: u.email } })
    if (!existing) {
      await prisma.userCredential.create({
        data: { email: u.email, name: u.name, role: u.role, passwordHash: hashPassword(u.password) },
      })
      console.log(`Created credential: ${u.email}`)
    }
  }

  // ── Perfume Reference Library ──────────────────────────────────────────
  const libraryDefs = [
    // ── Designer ──────────────────────────────────────────────────────────
    { name: "Chanel No.5", brand: "Chanel", perfumer: "Ernest Beaux", year: 1921, concentration: "edp", category: "designer", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Aldehydes","Ylang-ylang","Neroli","Bergamot"], middleNotes: ["Jasmine","Rose","Iris","Lily of the Valley"], baseNotes: ["Vetiver","Sandalwood","Vanilla","Musk","Civet"], projection: 7.5, longevityHrs: 14, season: "all", occasion: "special", priceTier: "luxury", communityScore: 9.2, description: "The world's most iconic fragrance — a luminous aldehyde floral of unprecedented elegance." },
    { name: "Chanel Coco Mademoiselle", brand: "Chanel", perfumer: "Jacques Polge", year: 2001, concentration: "edp", category: "designer", olfactoryFamily: "oriental", genderTarget: "feminine", topNotes: ["Orange","Bergamot","Grapefruit"], middleNotes: ["Rose","Jasmine","Mimosa","Ylang-ylang"], baseNotes: ["Patchouli","Vetiver","Oakmoss","White Musk","Vanilla"], projection: 8.5, longevityHrs: 12, season: "all", occasion: "business", priceTier: "luxury", communityScore: 9.0, description: "A bold modern oriental with dazzling citrus and a dark patchouli foundation." },
    { name: "Chanel Bleu de Chanel", brand: "Chanel", perfumer: "Olivier Polge", year: 2014, concentration: "edp", category: "designer", olfactoryFamily: "woody", genderTarget: "masculine", topNotes: ["Citrus","Grapefruit","Mint"], middleNotes: ["Ginger","Nutmeg","Jasmine","Iso E Super"], baseNotes: ["Labdanum","Vetiver","Cedarwood","Sandalwood"], projection: 8.0, longevityHrs: 9, season: "all", occasion: "business", priceTier: "luxury", communityScore: 8.8, description: "A sophisticated aromatic woody with Iso E Super cedar depth and citrus radiance." },
    { name: "Chanel Chance EDP", brand: "Chanel", perfumer: "Jacques Polge", year: 2002, concentration: "edp", category: "designer", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Pineapple","Citrus"], middleNotes: ["Jasmine","Iris","Pink Pepper"], baseNotes: ["Patchouli","Vetiver","Amber","White Musk"], projection: 7.0, longevityHrs: 8, season: "spring", occasion: "casual", priceTier: "luxury", communityScore: 8.5, description: "A fresh floral chance encounter — luminous, joyful and softly sensual." },
    { name: "Dior Sauvage EDP", brand: "Dior", perfumer: "François Demachy", year: 2018, concentration: "edp", category: "designer", olfactoryFamily: "fresh", genderTarget: "masculine", topNotes: ["Bergamot","Sichuan Pepper"], middleNotes: ["Lavender","Pink Pepper","Vetiver","Patchouli"], baseNotes: ["Ambroxan","Labdanum","Vanilla"], projection: 9.0, longevityHrs: 10, season: "all", occasion: "casual", priceTier: "premium", communityScore: 8.9, description: "Wild, powerful and magnetic — a fresh spicy built on a dominant Ambroxan base." },
    { name: "Dior J'adore", brand: "Dior", perfumer: "Calice Becker", year: 1999, concentration: "edp", category: "designer", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Champagne Mango","Pear","Melon","Magnolia"], middleNotes: ["Rose","Jasmine","Violet","Orchid","Lily of the Valley"], baseNotes: ["Musk","Blackberry","Vanilla","Sandalwood"], projection: 8.0, longevityHrs: 10, season: "summer", occasion: "special", priceTier: "luxury", communityScore: 8.7, description: "A luscious golden floral — modern femininity at its most opulent." },
    { name: "Dior Miss Dior", brand: "Dior", perfumer: "François Demachy", year: 2017, concentration: "edp", category: "designer", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Calabrian Bergamot","Peony"], middleNotes: ["Grasse Rose","Damascus Rose"], baseNotes: ["Patchouli","Sandalwood","White Musk"], projection: 7.5, longevityHrs: 8, season: "spring", occasion: "casual", priceTier: "luxury", communityScore: 8.3, description: "A romantic rose garden — fresh, feminine, and eternally chic." },
    { name: "Dior Fahrenheit", brand: "Dior", perfumer: "Jean-Louis Sieuzac", year: 1988, concentration: "edt", category: "designer", olfactoryFamily: "woody", genderTarget: "masculine", topNotes: ["Mandarin","Hawthorn","Lavender"], middleNotes: ["Violet","Nutmeg","Cedar","Carnation"], baseNotes: ["Leather","Benzyl benzoate","Vetiver","Sandalwood","Amber"], projection: 8.5, longevityHrs: 12, season: "fall", occasion: "evening", priceTier: "premium", communityScore: 8.6, description: "A singular leathery-gasoline marvel — bold, warm, and utterly unforgettable." },
    { name: "YSL Black Opium", brand: "Yves Saint Laurent", perfumer: "Nathalie Lorson", year: 2014, concentration: "edp", category: "designer", olfactoryFamily: "gourmand", genderTarget: "feminine", topNotes: ["Pink Pepper","Pear","Mandarin Orange"], middleNotes: ["Coffee","Jasmine"], baseNotes: ["Vanilla","Patchouli","White Musk","Cedar"], projection: 8.5, longevityHrs: 10, season: "fall", occasion: "evening", priceTier: "premium", communityScore: 9.0, description: "An addictive coffee and vanilla gourmand wrapped in dark, sensual spice." },
    { name: "YSL La Nuit de l'Homme", brand: "Yves Saint Laurent", perfumer: "Anne Flipo", year: 2009, concentration: "edt", category: "designer", olfactoryFamily: "oriental", genderTarget: "masculine", topNotes: ["Cardamom","Bergamot"], middleNotes: ["Cedar","Lavender"], baseNotes: ["Vetiver","Coumarin","Caraway"], projection: 7.5, longevityHrs: 8, season: "fall", occasion: "evening", priceTier: "premium", communityScore: 8.8, description: "A seductive oriental fougère — spiced cardamom over a magnetic cedar base." },
    { name: "YSL Libre", brand: "Yves Saint Laurent", perfumer: "Anne Flipo", year: 2019, concentration: "edp", category: "designer", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Mandarin Orange","Petitgrain","Lavender"], middleNotes: ["Lavender","Jasmine Sambac","Orange Blossom"], baseNotes: ["Vanilla","Ambergris","Musk"], projection: 8.0, longevityHrs: 10, season: "all", occasion: "business", priceTier: "premium", communityScore: 8.6, description: "A bold lavender-vanilla fougère that smashes gender conventions with grace." },
    { name: "Guerlain Shalimar", brand: "Guerlain", perfumer: "Jacques Guerlain", year: 1925, concentration: "edp", category: "designer", olfactoryFamily: "oriental", genderTarget: "feminine", topNotes: ["Bergamot","Lemon","Citrus"], middleNotes: ["Rose","Jasmine","Iris"], baseNotes: ["Vanilla","Opoponax","Tonka Bean","Musk","Civet"], projection: 8.0, longevityHrs: 16, season: "fall", occasion: "special", priceTier: "luxury", communityScore: 9.1, description: "The definitive oriental — a century of sensuality, powder, and vanilla incense." },
    { name: "Guerlain L'Homme Idéal", brand: "Guerlain", perfumer: "Thierry Wasser", year: 2014, concentration: "edp", category: "designer", olfactoryFamily: "oriental", genderTarget: "masculine", topNotes: ["Almond","Bergamot","Lemon"], middleNotes: ["Lavender","Iris"], baseNotes: ["Tonka Bean","Vanilla","Leather","Sandalwood"], projection: 7.5, longevityHrs: 9, season: "fall", occasion: "evening", priceTier: "premium", communityScore: 8.5, description: "Warm, sweet almond and leather — a perfectly sculpted masculine ideal." },
    { name: "Lancôme La Vie Est Belle", brand: "Lancôme", perfumer: "Dominique Ropion", year: 2012, concentration: "edp", category: "designer", olfactoryFamily: "gourmand", genderTarget: "feminine", topNotes: ["Black Currant","Pear"], middleNotes: ["Iris","Jasmine","Orange Blossom"], baseNotes: ["Patchouli","Vanilla","Praline","Sandalwood"], projection: 8.0, longevityHrs: 10, season: "all", occasion: "casual", priceTier: "premium", communityScore: 8.7, description: "A joyful iris-praline accord that defined the modern floral gourmand category." },
    { name: "Armani Acqua di Gio", brand: "Giorgio Armani", perfumer: "Alberto Morillas", year: 1996, concentration: "edt", category: "designer", olfactoryFamily: "aquatic", genderTarget: "masculine", topNotes: ["Lime","Lemon","Bergamot","Jasmine","Pineapple","Neroli"], middleNotes: ["Calone","Jasmine","Rosemary","Rose"], baseNotes: ["Oakmoss","Patchouli","Musk","Cedarwood","Amber"], projection: 7.5, longevityHrs: 6, season: "summer", occasion: "casual", priceTier: "mid", communityScore: 8.4, description: "The original aquatic archetype — refreshing Mediterranean sea spray in a bottle." },
    { name: "Armani Acqua di Gio Profumo", brand: "Giorgio Armani", perfumer: "Alberto Morillas", year: 2015, concentration: "parfum", category: "designer", olfactoryFamily: "aquatic", genderTarget: "masculine", topNotes: ["Bergamot","Sea Notes"], middleNotes: ["Incense","Sage","Geranium"], baseNotes: ["Patchouli","Mineral Amber","Woody Notes"], projection: 8.5, longevityHrs: 12, season: "summer", occasion: "business", priceTier: "premium", communityScore: 9.1, description: "Acqua di Gio reborn — incense replaces Calone for a darker, more meditative marine." },
    { name: "Armani Sì", brand: "Giorgio Armani", perfumer: "Christine Nagel", year: 2013, concentration: "edp", category: "designer", olfactoryFamily: "chypre", genderTarget: "feminine", topNotes: ["Black Currant","Mandarin"], middleNotes: ["Freesia","Rose","Neroli"], baseNotes: ["Cassis","Vanilla","Ambroxan","White Musk"], projection: 7.5, longevityHrs: 8, season: "spring", occasion: "business", priceTier: "premium", communityScore: 8.4, description: "A modern neo-chypre — cassis and ambroxan in effortless modern femininity." },
    { name: "Paco Rabanne 1 Million", brand: "Paco Rabanne", perfumer: "Christophe Raynaud", year: 2008, concentration: "edt", category: "designer", olfactoryFamily: "oriental", genderTarget: "masculine", topNotes: ["Blood Mandarin","Grapefruit","Mint"], middleNotes: ["Rose","Cinnamon","Spices"], baseNotes: ["Leather","Amber","Patchouli","Woody Notes"], projection: 9.0, longevityHrs: 8, season: "fall", occasion: "evening", priceTier: "mid", communityScore: 8.5, description: "Brash, golden, unapologetic — blood orange and leather for the modern dandy." },
    { name: "Paco Rabanne Olympéa", brand: "Paco Rabanne", perfumer: "Anne Flipo", year: 2015, concentration: "edp", category: "designer", olfactoryFamily: "oriental", genderTarget: "feminine", topNotes: ["Green Mandarin","Ginger"], middleNotes: ["Jasmine","Ambergris"], baseNotes: ["Vanilla","Sandalwood","White Musk","Cashmere Wood"], projection: 8.5, longevityHrs: 10, season: "fall", occasion: "evening", priceTier: "mid", communityScore: 8.6, description: "Divine vanilla and salted ambergris — a modern goddess in golden bottle." },
    { name: "Versace Eros", brand: "Versace", perfumer: "Dora Baghriche", year: 2012, concentration: "edt", category: "designer", olfactoryFamily: "oriental", genderTarget: "masculine", topNotes: ["Mint","Apple","Lemon"], middleNotes: ["Tonka Bean","Geranium","Ambroxan"], baseNotes: ["Vanilla","Vetiver","Oakmoss","Cedarwood"], projection: 9.0, longevityHrs: 8, season: "fall", occasion: "evening", priceTier: "mid", communityScore: 8.6, description: "Minty tonka and ambroxan in a powerhouse of projection — the god of desire." },
    { name: "Calvin Klein CK One", brand: "Calvin Klein", perfumer: "Alberto Morillas", year: 1994, concentration: "edt", category: "designer", olfactoryFamily: "citrus", genderTarget: "unisex", topNotes: ["Bergamot","Green Tea","Cardamom","Pineapple","Papaya"], middleNotes: ["Rose","Jasmine","Violet","Orris","Lily of the Valley","Nutmeg"], baseNotes: ["Amber","Musk","Sandalwood","Cedar"], projection: 6.0, longevityHrs: 5, season: "summer", occasion: "casual", priceTier: "budget", communityScore: 8.0, description: "The fragrance that defined 90s minimalism and launched the unisex category." },
    { name: "Viktor & Rolf Flowerbomb", brand: "Viktor & Rolf", perfumer: "Carlos Benaim", year: 2005, concentration: "edp", category: "designer", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Bergamot","Tea","Osmanthus"], middleNotes: ["Freesia","Cattleya Orchid","Patchouli","Jasmine","Rose"], baseNotes: ["Musk","Vanilla"], projection: 8.5, longevityHrs: 10, season: "fall", occasion: "special", priceTier: "premium", communityScore: 8.9, description: "A floral explosion — lush, opulent and deliciously overwhelming." },
    { name: "Thierry Mugler Angel", brand: "Mugler", perfumer: "Olivier Cresp", year: 1992, concentration: "edp", category: "designer", olfactoryFamily: "gourmand", genderTarget: "feminine", topNotes: ["Bergamot","Melon","Coconut","Cotton Candy"], middleNotes: ["Honey","Apricot","Blackberry","Peach"], baseNotes: ["Patchouli","Chocolate","Tonka Bean","Vanilla","Caramel"], projection: 9.5, longevityHrs: 14, season: "fall", occasion: "evening", priceTier: "premium", communityScore: 8.7, description: "The original gourmand — dark patchouli and candy sweetness in perfect dissonance." },
    { name: "Thierry Mugler Alien", brand: "Mugler", perfumer: "Dominique Ropion", year: 2005, concentration: "edp", category: "designer", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Jasmine Sambac"], middleNotes: ["Cashmeran Wood"], baseNotes: ["White Amber","Woody Notes"], projection: 9.5, longevityHrs: 14, season: "all", occasion: "special", priceTier: "premium", communityScore: 8.8, description: "A sci-fi jasmine on a solar amber base — otherworldly and magnetic." },
    { name: "Issey Miyake L'Eau d'Issey", brand: "Issey Miyake", perfumer: "Jacques Cavallier", year: 1992, concentration: "edt", category: "designer", olfactoryFamily: "aquatic", genderTarget: "feminine", topNotes: ["Cyclamen","Rose","Lotus","Freesia"], middleNotes: ["Carnation","Peony","Lily"], baseNotes: ["Sandalwood","Musk","Cedar","Amber"], projection: 6.5, longevityHrs: 6, season: "spring", occasion: "casual", priceTier: "mid", communityScore: 8.2, description: "A watery lotus dream — the fragrance of a spring rainstorm." },
    { name: "Davidoff Cool Water", brand: "Davidoff", perfumer: "Pierre Bourdon", year: 1988, concentration: "edt", category: "designer", olfactoryFamily: "aquatic", genderTarget: "masculine", topNotes: ["Mint","Aquatic Notes","Lavender"], middleNotes: ["Jasmine","Geranium","Sandalwood","Neroli","Tobacco"], baseNotes: ["Oakmoss","Cedarwood","Musk","Amber","Calone"], projection: 7.0, longevityHrs: 6, season: "summer", occasion: "casual", priceTier: "budget", communityScore: 8.0, description: "The archetypal aquatic — fresh water mint and cedarwood in an iconic blue bottle." },
    { name: "Dolce & Gabbana Light Blue", brand: "Dolce & Gabbana", perfumer: "Olivier Cresp", year: 2001, concentration: "edt", category: "designer", olfactoryFamily: "citrus", genderTarget: "feminine", topNotes: ["Sicilian Lemon","Apple","Cedar","Bellflower"], middleNotes: ["Bamboo","Jasmine","White Rose"], baseNotes: ["Cedarwood","Musk","Amber"], projection: 7.0, longevityHrs: 6, season: "summer", occasion: "casual", priceTier: "mid", communityScore: 8.3, description: "Sun, sea, and Sicilian citrus — the quintessential Mediterranean summer fragrance." },
    { name: "Tom Ford Black Orchid", brand: "Tom Ford", perfumer: "David Apel", year: 2006, concentration: "edp", category: "designer", olfactoryFamily: "floral", genderTarget: "unisex", topNotes: ["Truffle","Ylang-ylang","Bergamot","Black Currant"], middleNotes: ["Black Orchid","Spices","Gardenia","Lotus Wood"], baseNotes: ["Black Truffle","Vetiver","Sandalwood","Dark Chocolate","Patchouli"], projection: 8.5, longevityHrs: 12, season: "fall", occasion: "evening", priceTier: "luxury", communityScore: 8.9, description: "Dark, opulent, perverse — truffle and black orchid redefine luxury." },
    { name: "Tom Ford Tobacco Vanille", brand: "Tom Ford", perfumer: "Unknown", year: 2007, concentration: "edp", category: "designer", olfactoryFamily: "oriental", genderTarget: "unisex", topNotes: ["Tobacco Leaf","Spices"], middleNotes: ["Tobacco Blossom","Jasmine","Cacao"], baseNotes: ["Vanilla","Tonka Bean","Dry Fruits","Wood Sap"], projection: 7.5, longevityHrs: 14, season: "fall", occasion: "evening", priceTier: "luxury", communityScore: 9.2, description: "The definitive tobacco fragrance — rich, creamy vanilla smoke in a private club." },
    { name: "Tom Ford Oud Wood", brand: "Tom Ford", perfumer: "Pierre Negrin", year: 2007, concentration: "edp", category: "designer", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Rosewood","Cardamom","Sichuan Pepper"], middleNotes: ["Oud","Sandalwood","Vetiver","Amber"], baseNotes: ["Tonka Bean","Vanilla"], projection: 7.5, longevityHrs: 10, season: "fall", occasion: "business", priceTier: "luxury", communityScore: 8.8, description: "The accessible oud landmark — a perfectly balanced woody spice made for the West." },
    { name: "Hermès Terre d'Hermès", brand: "Hermès", perfumer: "Jean-Claude Ellena", year: 2006, concentration: "edt", category: "designer", olfactoryFamily: "woody", genderTarget: "masculine", topNotes: ["Orange","Grapefruit"], middleNotes: ["Flint","Pepper"], baseNotes: ["Vetiver","Cedar","Benzoin","Patchouli"], projection: 7.5, longevityHrs: 9, season: "fall", occasion: "business", priceTier: "luxury", communityScore: 9.0, description: "A mineral woody masterpiece — earth, flint, and mineral cedar distilled to perfection." },
    { name: "Jean Paul Gaultier Le Male", brand: "Jean Paul Gaultier", perfumer: "Francis Kurkdjian", year: 1995, concentration: "edt", category: "designer", olfactoryFamily: "fougere", genderTarget: "masculine", topNotes: ["Mint","Bergamot","Cardamom"], middleNotes: ["Lavender","Cumin","Cinnamon","Orange Blossom"], baseNotes: ["Vanilla","Tonka Bean","Musk","Sandalwood"], projection: 8.5, longevityHrs: 8, season: "fall", occasion: "evening", priceTier: "mid", communityScore: 8.7, description: "A homoerotic fougère — lavender and vanilla tension in an iconic torso bottle." },
    { name: "Burberry Mr. Burberry EDP", brand: "Burberry", perfumer: "Francis Kurkdjian", year: 2018, concentration: "edp", category: "designer", olfactoryFamily: "woody", genderTarget: "masculine", topNotes: ["Cardamom","Grapefruit"], middleNotes: ["Sage","Hedione","Cedar"], baseNotes: ["Sandalwood","Vetiver","Ambergris"], projection: 7.0, longevityHrs: 8, season: "all", occasion: "casual", priceTier: "mid", communityScore: 8.2, description: "Cool sage and sandalwood ease — quietly confident British masculinity." },

    // ── Niche ──────────────────────────────────────────────────────────────
    { name: "Aventus", brand: "Creed", perfumer: "Olivier Creed", year: 2010, concentration: "edp", category: "niche", olfactoryFamily: "chypre", genderTarget: "masculine", topNotes: ["Pineapple","Bergamot","Black Currant","Apple"], middleNotes: ["Birch","Moroccan Jasmine","Rose","Dry Birch"], baseNotes: ["Oakmoss","Ambergris","Vanilla","Musk"], projection: 8.5, longevityHrs: 12, season: "all", occasion: "business", priceTier: "ultra", communityScore: 9.5, description: "The modern legend — Napoleon's triumph reborn as smoky birch pineapple perfection." },
    { name: "Green Irish Tweed", brand: "Creed", perfumer: "Pierre Bourdon", year: 1985, concentration: "edt", category: "niche", olfactoryFamily: "fougere", genderTarget: "masculine", topNotes: ["Lemon Verbena","Violet Leaves"], middleNotes: ["Iris","Sandalwood"], baseNotes: ["Ambergris","White Musk"], projection: 7.5, longevityHrs: 10, season: "spring", occasion: "casual", priceTier: "ultra", communityScore: 9.1, description: "Fresh-cut grass and iris in an emerald fougère that inspired a thousand imitations." },
    { name: "Millesime Imperial", brand: "Creed", perfumer: "Olivier Creed", year: 1995, concentration: "edp", category: "niche", olfactoryFamily: "aquatic", genderTarget: "unisex", topNotes: ["Iris","Bergamot","Lemon"], middleNotes: ["Melon","Seawater","Musk"], baseNotes: ["Ambergris","Musk","Sandalwood"], projection: 7.5, longevityHrs: 9, season: "summer", occasion: "casual", priceTier: "ultra", communityScore: 9.0, description: "Royal sea spray on ambergris — the cleanest, most aristocratic aquatic ever made." },
    { name: "Santal 33", brand: "Le Labo", perfumer: "Frank Voelkl", year: 2011, concentration: "edp", category: "niche", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Cardamom","Iris","Violet","Papyrus"], middleNotes: ["Ambrette","Australian Sandalwood"], baseNotes: ["Cedarwood","Leather","Sandalwood","Amber"], projection: 7.5, longevityHrs: 10, season: "all", occasion: "casual", priceTier: "ultra", communityScore: 9.0, description: "The olfactory signature of downtown cool — smoky sandalwood and leather for the generation." },
    { name: "Rose 31", brand: "Le Labo", perfumer: "Daphne Bugey", year: 2006, concentration: "edp", category: "niche", olfactoryFamily: "floral", genderTarget: "unisex", topNotes: ["Rose","Cumin"], middleNotes: ["Geranium","Olive Tree","Clove","Cedarwood"], baseNotes: ["Guaiac Wood","Cistus","Musk","Ambergris"], projection: 7.0, longevityHrs: 9, season: "all", occasion: "casual", priceTier: "ultra", communityScore: 8.7, description: "Rose reimagined as masculine — cumin, olive, and guaiac strip away every cliché." },
    { name: "Another 13", brand: "Le Labo", perfumer: "Frank Voelkl", year: 2010, concentration: "edp", category: "niche", olfactoryFamily: "musk", genderTarget: "unisex", topNotes: ["Ambrette Seed"], middleNotes: ["Ambrox","Hyacinth"], baseNotes: ["Musk","Moss"], projection: 6.5, longevityHrs: 8, season: "all", occasion: "casual", priceTier: "ultra", communityScore: 8.8, description: "Skin as fragrance — a whisper of musk and ambrox that becomes indistinguishable from you." },
    { name: "Gypsy Water", brand: "Byredo", perfumer: "Jérôme Epinette", year: 2008, concentration: "edp", category: "niche", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Bergamot","Lemon","Pepper","Juniper Berries"], middleNotes: ["Incense","Orris","Pine Needles"], baseNotes: ["Sandalwood","Vanilla","Amber"], projection: 7.5, longevityHrs: 8, season: "all", occasion: "casual", priceTier: "ultra", communityScore: 8.9, description: "Pine forest, incense, and vanilla — wanderer spirit in a nomadic woody." },
    { name: "Bal d'Afrique", brand: "Byredo", perfumer: "Jérôme Epinette", year: 2009, concentration: "edp", category: "niche", olfactoryFamily: "floral", genderTarget: "unisex", topNotes: ["Neroli","Bergamot","African Marigold"], middleNotes: ["Violet","Cyclamen"], baseNotes: ["Musk","Woody Notes","Cedarwood","Vetiver"], projection: 7.0, longevityHrs: 9, season: "spring", occasion: "casual", priceTier: "ultra", communityScore: 8.8, description: "Sun-drenched African marigold and violet over creamy woods — joyful and warm." },
    { name: "Mojave Ghost", brand: "Byredo", perfumer: "Jérôme Epinette", year: 2014, concentration: "edp", category: "niche", olfactoryFamily: "floral", genderTarget: "unisex", topNotes: ["Ambrette","Sapodilla"], middleNotes: ["Violet","Magnolia","Nectarine"], baseNotes: ["Cedarwood","Sandalwood","Amberwood","Musk"], projection: 7.0, longevityHrs: 8, season: "spring", occasion: "casual", priceTier: "ultra", communityScore: 8.7, description: "Arid floral of the Mojave — ghostly ambrette and magnolia on dry desert wood." },
    { name: "Tam Dao", brand: "Diptyque", perfumer: "Fabrice Pellegrin", year: 2003, concentration: "edt", category: "niche", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Cypress","Rosewood","Green Notes"], middleNotes: ["Sandalwood","Milk Accord","Cedar"], baseNotes: ["White Musk","Sandalwood"], projection: 6.5, longevityHrs: 7, season: "all", occasion: "casual", priceTier: "luxury", communityScore: 8.6, description: "Vietnamese sandalwood bathed in milky cypress — serene and meditative." },
    { name: "Philosykos", brand: "Diptyque", perfumer: "Olivia Giacobetti", year: 1996, concentration: "edt", category: "niche", olfactoryFamily: "green", genderTarget: "unisex", topNotes: ["Fig Leaves","Fig Tree"], middleNotes: ["Fig Tree","Cedarwood"], baseNotes: ["White Cedar","Fig Wood","Musk"], projection: 6.5, longevityHrs: 7, season: "summer", occasion: "casual", priceTier: "luxury", communityScore: 8.7, description: "A fig tree in its entirety — leaf, sap, bark, and fruit distilled to pure green clarity." },
    { name: "Replica Jazz Club", brand: "Maison Margiela", perfumer: "Aliénor Massenet", year: 2013, concentration: "edt", category: "niche", olfactoryFamily: "oriental", genderTarget: "unisex", topNotes: ["Rum","Pink Pepper","Neroli"], middleNotes: ["Vetiver","Clary Sage"], baseNotes: ["Musk","Vanilla","Benzoin"], projection: 7.5, longevityHrs: 8, season: "fall", occasion: "evening", priceTier: "luxury", communityScore: 9.0, description: "Rum, tobacco, and vanilla in a smoky New York jazz club at midnight." },
    { name: "Replica By the Fireplace", brand: "Maison Margiela", perfumer: "Aliénor Massenet", year: 2015, concentration: "edt", category: "niche", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Pink Pepper","Orange","Cloves"], middleNotes: ["Chestnuts","Guaiac Wood","Peru Balsam"], baseNotes: ["Vanilla","Cashmeran","Musk"], projection: 7.0, longevityHrs: 8, season: "fall", occasion: "casual", priceTier: "luxury", communityScore: 9.1, description: "Crackling wood fire, roasting chestnuts — the smell of a perfect winter evening." },
    { name: "Replica Beach Walk", brand: "Maison Margiela", perfumer: "Aliénor Massenet", year: 2017, concentration: "edt", category: "niche", olfactoryFamily: "citrus", genderTarget: "unisex", topNotes: ["Bergamot","Lemon","Pink Pepper"], middleNotes: ["Coconut Milk","Ylang-ylang"], baseNotes: ["Sandalwood","Musk","Cedarwood"], projection: 6.5, longevityHrs: 6, season: "summer", occasion: "casual", priceTier: "luxury", communityScore: 8.8, description: "Sunscreen, sea salt, and warm skin — a holiday memory crystallized." },
    { name: "Portrait of a Lady", brand: "Frederic Malle", perfumer: "Dominique Ropion", year: 2010, concentration: "edp", category: "niche", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Rose","Blackcurrant","Raspberry"], middleNotes: ["Patchouli","Sandalwood","Cinnamon"], baseNotes: ["Frankincense","Benzoin","Musk"], projection: 9.0, longevityHrs: 12, season: "fall", occasion: "special", priceTier: "ultra", communityScore: 9.3, description: "A rose of impossible richness — patchouli and incense lift the heart to stratospheric beauty." },
    { name: "Musc Ravageur", brand: "Frederic Malle", perfumer: "Maurice Roucel", year: 2000, concentration: "edp", category: "niche", olfactoryFamily: "oriental", genderTarget: "unisex", topNotes: ["Bergamot","Mandarin","Lavender"], middleNotes: ["Spices","Cinnamon","Clove"], baseNotes: ["Vanilla","Musk","Sandalwood","Amber"], projection: 9.0, longevityHrs: 14, season: "fall", occasion: "evening", priceTier: "ultra", communityScore: 9.2, description: "Raw carnality — sweet vanilla musk and spice in sensual, prowling disarray." },
    { name: "Ambre Sultan", brand: "Serge Lutens", perfumer: "Christopher Sheldrake", year: 2000, concentration: "edp", category: "niche", olfactoryFamily: "amber", genderTarget: "unisex", topNotes: ["Oregano","Bay Leaves","Angelica"], middleNotes: ["Coriander","Mastic"], baseNotes: ["Amber","Benzoin","Vanilla","Sandalwood"], projection: 8.0, longevityHrs: 14, season: "fall", occasion: "evening", priceTier: "luxury", communityScore: 9.1, description: "The amber absolute — dry herbs and resinous benzoin in a Moroccan souk at dusk." },
    { name: "Layton", brand: "Parfums de Marly", perfumer: "Hamid Merati-Kashani", year: 2016, concentration: "edp", category: "niche", olfactoryFamily: "oriental", genderTarget: "unisex", topNotes: ["Apple","Bergamot","Lavender"], middleNotes: ["Jasmine","Vanilla","Geranium"], baseNotes: ["Sandalwood","Pepper","Woody Notes"], projection: 9.5, longevityHrs: 12, season: "all", occasion: "special", priceTier: "ultra", communityScore: 9.4, description: "Monster projection, Herculean longevity — creamy lavender and vanilla that commands a room." },
    { name: "Pegasus", brand: "Parfums de Marly", perfumer: "Hamid Merati-Kashani", year: 2011, concentration: "edp", category: "niche", olfactoryFamily: "fougere", genderTarget: "masculine", topNotes: ["Bergamot","Heliotrope"], middleNotes: ["Jasmine","Lavender","Sandalwood"], baseNotes: ["Tonka Bean","Vanilla","White Musk"], projection: 8.5, longevityHrs: 10, season: "all", occasion: "business", priceTier: "ultra", communityScore: 9.2, description: "Creamy heliotrope and lavender — a fougère of Greek mythological grandeur." },
    { name: "Delina", brand: "Parfums de Marly", perfumer: "Quentin Bisch", year: 2017, concentration: "edp", category: "niche", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Nutmeg","Rhubarb","Lychee"], middleNotes: ["Turkish Rose","Peony","Jasmine","Cashmeran"], baseNotes: ["Musk","Vanilla","Amber","Cedarwood"], projection: 9.0, longevityHrs: 10, season: "spring", occasion: "special", priceTier: "ultra", communityScore: 9.3, description: "Rhubarb and rose of staggering elegance — contemporary feminine grandeur." },
    { name: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", perfumer: "Francis Kurkdjian", year: 2015, concentration: "edp", category: "niche", olfactoryFamily: "floral", genderTarget: "unisex", topNotes: ["Jasmine","Saffron"], middleNotes: ["Amberwood","Ambergris"], baseNotes: ["Fir Resin","Cedar"], projection: 8.5, longevityHrs: 12, season: "all", occasion: "special", priceTier: "ultra", communityScore: 9.4, description: "Luminous saffron jasmine over sweet-woody ambergris — the century's most Instagrammed fragrance." },
    { name: "Grand Soir", brand: "Maison Francis Kurkdjian", perfumer: "Francis Kurkdjian", year: 2009, concentration: "edp", category: "niche", olfactoryFamily: "amber", genderTarget: "unisex", topNotes: ["Bergamot","White Musk"], middleNotes: ["Benzoin","Tonka Bean","Ethyl Vanillin"], baseNotes: ["Amber","Sandalwood","Musk"], projection: 8.5, longevityHrs: 14, season: "fall", occasion: "evening", priceTier: "ultra", communityScore: 9.1, description: "Warm, luxurious amber benzoin — evening gowns and candlelit tables." },
    { name: "Angels' Share", brand: "Kilian Paris", perfumer: "Benoît Lapouza", year: 2019, concentration: "edp", category: "niche", olfactoryFamily: "gourmand", genderTarget: "unisex", topNotes: ["Cognac","Cinnamon"], middleNotes: ["Tonka Bean","Oak","Sandalwood"], baseNotes: ["Vanilla","Caramel"], projection: 8.5, longevityHrs: 12, season: "fall", occasion: "evening", priceTier: "ultra", communityScore: 9.3, description: "Cognac evaporating from oak barrels — the most intoxicating gourmand ever made." },
    { name: "Oud for Greatness", brand: "Initio Parfums Privés", perfumer: "Unknown", year: 2017, concentration: "edp", category: "niche", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Saffron","Nutmeg"], middleNotes: ["Oud","Agarwood"], baseNotes: ["Musk","Civet","Patchouli"], projection: 9.5, longevityHrs: 14, season: "fall", occasion: "special", priceTier: "ultra", communityScore: 9.1, description: "Narcotic oud, saffron, and animalic musk — grandiose, dark, and cinematic." },
    { name: "Hacivat", brand: "Nishane", perfumer: "Nishane Laboratory", year: 2017, concentration: "extrait", category: "niche", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Bergamot","Grapefruit","Pink Pepper"], middleNotes: ["Patchouli","Vetiver","Coconut"], baseNotes: ["Musk","Ambergris","Oakmoss"], projection: 9.0, longevityHrs: 14, season: "all", occasion: "business", priceTier: "ultra", communityScore: 9.2, description: "Tropical patchouli and sweet oakmoss in staggering extrait concentration — a crowd destroyer." },
    { name: "Naxos", brand: "Xerjoff", perfumer: "Xerjoff Nose", year: 2017, concentration: "edp", category: "niche", olfactoryFamily: "oriental", genderTarget: "unisex", topNotes: ["Bergamot","Lemon","Honey"], middleNotes: ["Lavender","Jasmine","Iris"], baseNotes: ["Tobacco","Vanilla","Tonka Bean","Sandalwood","Musk"], projection: 9.0, longevityHrs: 14, season: "fall", occasion: "evening", priceTier: "ultra", communityScore: 9.3, description: "Honey, lavender, and tobacco in Italian extravagance — opera music in olfactory form." },
    { name: "Elysium", brand: "Roja Parfums", perfumer: "Roja Dove", year: 2017, concentration: "parfum", category: "niche", olfactoryFamily: "citrus", genderTarget: "masculine", topNotes: ["Bergamot","Lemon","Grapefruit","Lime"], middleNotes: ["Lavender","Basil","Geranium","Rosemary"], baseNotes: ["Sandalwood","Vetiver","Oakmoss","Ambergris"], projection: 8.0, longevityHrs: 12, season: "summer", occasion: "casual", priceTier: "ultra", communityScore: 9.1, description: "A celestial barbershop — crisp citrus and herbal clarity at parfum concentration." },
    { name: "Amber Aoud", brand: "Roja Parfums", perfumer: "Roja Dove", year: 2009, concentration: "parfum", category: "niche", olfactoryFamily: "oriental", genderTarget: "unisex", topNotes: ["Bergamot","Pink Pepper"], middleNotes: ["Rose","Oud","Agarwood","Geranium"], baseNotes: ["Amber","Patchouli","Sandalwood","Musk","Civet"], projection: 9.5, longevityHrs: 16, season: "fall", occasion: "special", priceTier: "ultra", communityScore: 9.2, description: "Oud and rose enthroned on amber — imperious, opulent, and utterly commanding." },

    // ── Arabic / Middle Eastern ────────────────────────────────────────────
    { name: "Interlude Man", brand: "Amouage", perfumer: "Pierre Negrin", year: 2012, concentration: "edp", category: "arabic", olfactoryFamily: "oriental", genderTarget: "masculine", topNotes: ["Bergamot","Oregano","Amber"], middleNotes: ["Frankincense","Cistus","Oud","Sandalwood"], baseNotes: ["Patchouli","Leather","Moss"], projection: 9.5, longevityHrs: 16, season: "fall", occasion: "special", priceTier: "ultra", communityScore: 9.5, description: "The most complex masculine fragrance ever created — incense, oud, and leather in operatic tension." },
    { name: "Reflection Man", brand: "Amouage", perfumer: "Lucas Sieuzac", year: 2007, concentration: "edp", category: "arabic", olfactoryFamily: "floral", genderTarget: "masculine", topNotes: ["Bergamot","Lemon","Rosemary"], middleNotes: ["Jasmine","Lily","Ylang-ylang","Rose"], baseNotes: ["Sandalwood","Musk","White Amber"], projection: 8.0, longevityHrs: 12, season: "spring", occasion: "business", priceTier: "ultra", communityScore: 9.1, description: "Soapy florals of crystalline purity — the cleanest, most refined masculine from Amouage." },
    { name: "Gold Woman", brand: "Amouage", perfumer: "Guy Robert", year: 1983, concentration: "edp", category: "arabic", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Frankincense","Myrrh","Bergamot","Neroli"], middleNotes: ["Rose","Jasmine","Lily of the Valley","Orris"], baseNotes: ["Sandalwood","Civet","Oakmoss","Amber"], projection: 9.0, longevityHrs: 16, season: "fall", occasion: "special", priceTier: "ultra", communityScore: 9.3, description: "Omani frankincense and Rosa damascena — the grandeur of the Muscat palace in fragrance." },
    { name: "Jubilation XXV Man", brand: "Amouage", perfumer: "Pierre Negrin", year: 2007, concentration: "edp", category: "arabic", olfactoryFamily: "oriental", genderTarget: "masculine", topNotes: ["Frankincense","Cinnamon","Black Pepper","Pomegranate"], middleNotes: ["Gaiac Wood","Oud","Patchouli","Myrrh"], baseNotes: ["Labdanum","Leather","Oakmoss","Musk"], projection: 9.0, longevityHrs: 14, season: "fall", occasion: "special", priceTier: "ultra", communityScore: 9.4, description: "Twenty-five years of Omani perfumery condensed — incense, leather, and labdanum in jubilant exaltation." },
    { name: "La Yuqawam", brand: "Rasasi", perfumer: "Unknown", year: 2014, concentration: "edp", category: "arabic", olfactoryFamily: "oriental", genderTarget: "masculine", topNotes: ["Bergamot","Lemon","Cardamom"], middleNotes: ["Geranium","Cinnamon","Rose"], baseNotes: ["Oud","Amber","Patchouli","Musk"], projection: 9.0, longevityHrs: 12, season: "fall", occasion: "evening", priceTier: "mid", communityScore: 9.0, description: "The undeniable — oud and amber accord at astonishing quality for the price." },
    { name: "Hawas", brand: "Rasasi", perfumer: "Unknown", year: 2018, concentration: "edp", category: "arabic", olfactoryFamily: "aquatic", genderTarget: "masculine", topNotes: ["Mint","Apple","Cardamom","Bergamot"], middleNotes: ["Cyclamen","Jasmine","Lily of the Valley"], baseNotes: ["Amberwood","Musk","Woody Notes","Oakmoss"], projection: 8.5, longevityHrs: 10, season: "summer", occasion: "casual", priceTier: "budget", communityScore: 8.8, description: "Fresh aquatic with Middle Eastern soul — an Acqua di Gio rival at fraction of the cost." },
    { name: "Shaghaf Oud", brand: "Swiss Arabian", perfumer: "Unknown", year: 2016, concentration: "edp", category: "arabic", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Bergamot","Saffron"], middleNotes: ["Oud","Rose","Geranium"], baseNotes: ["Patchouli","Amber","Musk"], projection: 8.5, longevityHrs: 12, season: "fall", occasion: "evening", priceTier: "mid", communityScore: 8.7, description: "Saffron-rose over an oud base — accessible luxury from a Dubai institution." },
    { name: "Warda", brand: "Swiss Arabian", perfumer: "Unknown", year: 2010, concentration: "edp", category: "arabic", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Bergamot","Lemon","Peach"], middleNotes: ["Rose","Jasmine","Geranium","Lily"], baseNotes: ["Musk","Sandalwood","Amber"], projection: 7.5, longevityHrs: 9, season: "spring", occasion: "casual", priceTier: "budget", communityScore: 8.4, description: "Warda means 'rose' — and this is rose at its most generous and Arabic in character." },
    { name: "Dahn Al Oudh Moattaq", brand: "Ajmal", perfumer: "Unknown", year: 2010, concentration: "attar", category: "arabic", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Agarwood"], middleNotes: ["Oud","Wood Smoke"], baseNotes: ["Agarwood","Balsam"], projection: 8.0, longevityHrs: 24, season: "all", occasion: "special", priceTier: "ultra", communityScore: 9.2, description: "Pure distilled agarwood oil — the raw, unmediated voice of oud from a century-old Emirati house." },
    { name: "Amber Wood", brand: "Ajmal", perfumer: "Unknown", year: 2015, concentration: "edp", category: "arabic", olfactoryFamily: "amber", genderTarget: "unisex", topNotes: ["Pineapple","Bergamot"], middleNotes: ["Patchouli","Sandalwood"], baseNotes: ["Amber","Musk","Vanilla"], projection: 8.0, longevityHrs: 10, season: "fall", occasion: "casual", priceTier: "budget", communityScore: 8.5, description: "Sweet amber and sandalwood — luxurious warmth at genuinely approachable prices." },
    { name: "Kalemat", brand: "Arabian Oud", perfumer: "Unknown", year: 2014, concentration: "edp", category: "arabic", olfactoryFamily: "oriental", genderTarget: "unisex", topNotes: ["Bergamot","Cinnamon","Cardamom"], middleNotes: ["Rose","Oud","Incense"], baseNotes: ["Amber","Vanilla","Musk","Sandalwood"], projection: 8.5, longevityHrs: 12, season: "fall", occasion: "evening", priceTier: "mid", communityScore: 8.9, description: "The word means 'words' — and Kalemat speaks the universal language of Oriental splendour." },
    { name: "Amber Oud Gold Edition", brand: "Al Haramain", perfumer: "Unknown", year: 2019, concentration: "edp", category: "arabic", olfactoryFamily: "oriental", genderTarget: "unisex", topNotes: ["Rose","Saffron","Bergamot"], middleNotes: ["Oud","Amber","Agarwood"], baseNotes: ["Musk","Sandalwood","Vanilla"], projection: 9.0, longevityHrs: 14, season: "fall", occasion: "evening", priceTier: "mid", communityScore: 9.0, description: "Gold-tinged saffron oud — the democratic opulence that made Al Haramain globally famous." },
    { name: "Raghba", brand: "Lattafa", perfumer: "Unknown", year: 2018, concentration: "edp", category: "arabic", olfactoryFamily: "oriental", genderTarget: "unisex", topNotes: ["Bergamot","Cinnamon"], middleNotes: ["Bakhoor","Incense"], baseNotes: ["Vanilla","Sandalwood","Musk","Amber"], projection: 9.5, longevityHrs: 14, season: "fall", occasion: "evening", priceTier: "budget", communityScore: 9.1, description: "Bakhoor incense and vanilla at budget prices — the dark horse of Arabic perfumery." },
    { name: "Asad", brand: "Lattafa", perfumer: "Unknown", year: 2020, concentration: "edp", category: "arabic", olfactoryFamily: "woody", genderTarget: "masculine", topNotes: ["Lemon","Black Pepper","Bergamot"], middleNotes: ["Lavender","Vetiver","Cardamom"], baseNotes: ["Sandalwood","Musk","Woody Notes","Leather"], projection: 9.0, longevityHrs: 12, season: "fall", occasion: "business", priceTier: "budget", communityScore: 8.9, description: "Asad (lion) roars with lavender and sandalwood at impossibly good value." },
    { name: "Black Afgano", brand: "Nasomatto", perfumer: "Alessandro Gualtieri", year: 2009, concentration: "extrait", category: "arabic", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Cannabis","Coffee"], middleNotes: ["Oud","Dark Resins"], baseNotes: ["Wood","Tobacco","Amber"], projection: 8.5, longevityHrs: 14, season: "fall", occasion: "evening", priceTier: "luxury", communityScore: 9.1, description: "Hashish resin, oud, and dark wood — the most transgressive fragrance from the most transgressive house." },
    { name: "Dirham", brand: "Ard Al Zaafaran", perfumer: "Unknown", year: 2016, concentration: "edp", category: "arabic", olfactoryFamily: "floral", genderTarget: "unisex", topNotes: ["Bergamot","Citrus"], middleNotes: ["Rose","Jasmine","Muguet"], baseNotes: ["Musk","Vanilla","Sandalwood"], projection: 8.0, longevityHrs: 10, season: "all", occasion: "casual", priceTier: "budget", communityScore: 8.6, description: "Clean floral musk with an Arabic softness — a crowd-pleaser for every occasion." },

    // ── Indian Attar ───────────────────────────────────────────────────────
    { name: "Rose Attar (Kannauj)", brand: "Kannauj Attars", perfumer: "Traditional", year: 1700, concentration: "attar", category: "indian", olfactoryFamily: "floral", genderTarget: "unisex", topNotes: ["Rosa Damascena"], middleNotes: ["Rose","Sandalwood"], baseNotes: ["Sandalwood (Mysore)"], projection: 6.0, longevityHrs: 18, season: "spring", occasion: "special", priceTier: "ultra", communityScore: 9.5, description: "The world's finest rose attar — Kannauj Damascena distilled directly into aged Mysore sandalwood oil by deg-bhapka hydrodistillation." },
    { name: "Mitti Attar", brand: "Kannauj Attars", perfumer: "Traditional", year: 1700, concentration: "attar", category: "indian", olfactoryFamily: "earthy", genderTarget: "unisex", topNotes: ["Petrichor","Wet Earth"], middleNotes: ["Clay","Baked Soil"], baseNotes: ["Sandalwood (Mysore)","Earthy Notes"], projection: 5.5, longevityHrs: 16, season: "spring", occasion: "casual", priceTier: "premium", communityScore: 9.3, description: "The smell of first rain on baked earth — petrichor bottled in Mysore sandalwood. A uniquely Indian olfactory poem." },
    { name: "Shamama Attar", brand: "Kannauj Attars", perfumer: "Traditional", year: 1700, concentration: "attar", category: "indian", olfactoryFamily: "oriental", genderTarget: "unisex", topNotes: ["Saffron","Kewra","Citrus"], middleNotes: ["Rose","Hina","Spices","Oud"], baseNotes: ["Sandalwood","Amber","Civet","Musk"], projection: 7.0, longevityHrs: 24, season: "fall", occasion: "special", priceTier: "ultra", communityScore: 9.4, description: "A pan-Indian accord of 40+ botanicals — the most complex traditional attar, brewed for days in copper degs." },
    { name: "Hina Attar", brand: "Kannauj Attars", perfumer: "Traditional", year: 1700, concentration: "attar", category: "indian", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Henna Flower","Saffron"], middleNotes: ["Rose","Jasmine","Kewra"], baseNotes: ["Sandalwood","Musk"], projection: 6.0, longevityHrs: 18, season: "spring", occasion: "special", priceTier: "premium", communityScore: 9.0, description: "Henna blossom distilled into sandalwood — the fragrance of Indian weddings and celebrations." },
    { name: "Kewra Attar", brand: "Kannauj Attars", perfumer: "Traditional", year: 1700, concentration: "attar", category: "indian", olfactoryFamily: "floral", genderTarget: "unisex", topNotes: ["Pandanus","Screw Pine Flower"], middleNotes: ["Floral Green","Coconut"], baseNotes: ["Sandalwood (Mysore)"], projection: 6.0, longevityHrs: 14, season: "summer", occasion: "casual", priceTier: "premium", communityScore: 8.7, description: "Pandanus (screw pine) distilled into sandalwood — a uniquely Indian green-floral found nowhere else on Earth." },
    { name: "Jasmine Sambac Attar", brand: "Kannauj Attars", perfumer: "Traditional", year: 1700, concentration: "attar", category: "indian", olfactoryFamily: "floral", genderTarget: "feminine", topNotes: ["Mogra Jasmine","Green Leaf"], middleNotes: ["Jasmine Sambac","Indole"], baseNotes: ["Sandalwood","White Musk"], projection: 7.0, longevityHrs: 16, season: "summer", occasion: "special", priceTier: "premium", communityScore: 9.2, description: "Mogra in its purest expression — the sacred jasmine of South Asia offered to the divine." },
    { name: "Marigold Attar", brand: "Kannauj Attars", perfumer: "Traditional", year: 1700, concentration: "attar", category: "indian", olfactoryFamily: "floral", genderTarget: "unisex", topNotes: ["Calendula","Marigold"], middleNotes: ["Green Floral","Herbaceous"], baseNotes: ["Sandalwood (Mysore)"], projection: 5.5, longevityHrs: 12, season: "fall", occasion: "casual", priceTier: "mid", communityScore: 8.5, description: "Sun-orange marigold in sandalwood — the fragrance draped over temple offerings across India." },
    { name: "Saffron Rose Attar", brand: "Kannauj Attars", perfumer: "Traditional", year: 1700, concentration: "attar", category: "indian", olfactoryFamily: "floral", genderTarget: "unisex", topNotes: ["Saffron","Rose"], middleNotes: ["Kesar","Oud Hint"], baseNotes: ["Sandalwood","Amber"], projection: 7.5, longevityHrs: 20, season: "all", occasion: "special", priceTier: "ultra", communityScore: 9.3, description: "Kashmiri saffron co-distilled with Damascena rose into Mysore sandalwood — liquid gold in the truest sense." },
    { name: "Oud Bakhoor", brand: "Kannauj Attars", perfumer: "Traditional", year: 1700, concentration: "attar", category: "indian", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Agarwood Smoke","Benzoin"], middleNotes: ["Oud","Incense"], baseNotes: ["Sandalwood","Dark Resin"], projection: 7.0, longevityHrs: 24, season: "all", occasion: "special", priceTier: "ultra", communityScore: 9.1, description: "Bakhoor incense smoke captured in sandalwood oil — the sacred fumigation of mosques and homes distilled." },
    { name: "Kesar Chandan Attar", brand: "Kannauj Attars", perfumer: "Traditional", year: 1700, concentration: "attar", category: "indian", olfactoryFamily: "woody", genderTarget: "unisex", topNotes: ["Saffron","Cardamom"], middleNotes: ["Sandalwood","Spice"], baseNotes: ["Mysore Sandalwood","Amber"], projection: 6.5, longevityHrs: 16, season: "all", occasion: "casual", priceTier: "premium", communityScore: 9.0, description: "Kesar (saffron) meeting chandan (sandalwood) — a warm spiced meditation in ancient Mughal tradition." },
  ]

  const existingLibraryCount = await prisma.perfumeReference.count()
  if (existingLibraryCount === 0) {
    for (const p of libraryDefs) {
      await prisma.perfumeReference.create({
        data: {
          name:           p.name,
          brand:          p.brand,
          perfumer:       p.perfumer,
          year:           p.year,
          concentration:  p.concentration,
          category:       p.category,
          olfactoryFamily: p.olfactoryFamily,
          genderTarget:   p.genderTarget,
          topNotes:       JSON.stringify(p.topNotes),
          middleNotes:    JSON.stringify(p.middleNotes),
          baseNotes:      JSON.stringify(p.baseNotes),
          projection:     p.projection,
          longevityHrs:   p.longevityHrs,
          season:         p.season,
          occasion:       p.occasion,
          priceTier:      p.priceTier,
          description:    p.description,
          communityScore: p.communityScore,
        },
      })
    }
    console.log(`Seeded ${libraryDefs.length} perfume reference entries`)
  } else {
    console.log(`Library already has ${existingLibraryCount} entries — skipping seed`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
