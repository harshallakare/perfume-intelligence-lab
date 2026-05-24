import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { AppError } from "../../middleware/error";
import type {
  CreateFormulaInput,
  UpdateFormulaInput,
  ListFormulasInput,
  ScaleFormulaInput,
} from "./formulas.schema";

// ── helpers ───────────────────────────────────────────────────────────────────

const formulaInclude = {
  creator: { select: { id: true, fullName: true, avatarUrl: true } },
  ingredients: {
    include: {
      rawMaterial: {
        select: {
          id: true, name: true, casNumber: true, materialType: true,
          odorFamily: true, costPerUnit: true, currency: true,
          currentStock: true, unitOfMeasure: true, isAllergen: true, ifraRestricted: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" as const },
  },
  _count: { select: { versions: true, productions: true } },
} satisfies Prisma.FormulaInclude;

/** Recalculate formula percentage totals after ingredient change */
async function recalcTotals(formulaId: string) {
  const ings = await prisma.formulaIngredient.findMany({ where: { formulaId } });
  const total = ings.reduce((s, i) => s + Number(i.percentage), 0);
  await prisma.formula.update({
    where: { id: formulaId },
    data: { totalFragrancePct: total },
  });
}

/** Snapshot the formula into a new version */
async function createVersion(formulaId: string, userId: string | null, summary?: string) {
  const formula = await prisma.formula.findUnique({
    where: { id: formulaId },
    include: { ingredients: true },
  });
  if (!formula) return;

  const lastVersion = await prisma.formulaVersion.findFirst({
    where: { formulaId },
    orderBy: { versionNumber: "desc" },
  });

  await prisma.formulaVersion.create({
    data: {
      formulaId,
      versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
      snapshot: formula as unknown as Prisma.InputJsonValue,
      changeSummary: summary ?? "Auto-saved",
      createdBy: userId,
    },
  });
}

// ── public service methods ────────────────────────────────────────────────────

export async function listFormulas(orgId: string, query: ListFormulasInput) {
  const { page, limit, search, status, concentrationType, olfactoryFamily, sortBy, sortDir } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.FormulaWhereInput = {
    organizationId: orgId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { internalCode: { contains: search, mode: "insensitive" } },
        { inspirationPerfume: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(status && { status }),
    ...(concentrationType && { concentrationType }),
    ...(olfactoryFamily && { olfactoryFamily }),
  };

  const [items, total] = await Promise.all([
    prisma.formula.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        creator: { select: { id: true, fullName: true } },
        _count: { select: { ingredients: true, versions: true, productions: true } },
      },
    }),
    prisma.formula.count({ where }),
  ]);

  return { items, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
}

export async function getFormula(orgId: string, id: string) {
  const formula = await prisma.formula.findFirst({
    where: { id, organizationId: orgId },
    include: formulaInclude,
  });
  if (!formula) throw new AppError(404, "Formula not found", "NOT_FOUND");

  // Calculate cost breakdown
  const costBreakdown = formula.ingredients.map((ing) => ({
    materialId: ing.rawMaterialId,
    materialName: ing.rawMaterial.name,
    percentage: Number(ing.percentage),
    costPerUnit: Number(ing.rawMaterial.costPerUnit),
    costContribution: (Number(ing.percentage) / 100) * Number(ing.rawMaterial.costPerUnit),
  }));
  const totalCostPer100g = costBreakdown.reduce((s, c) => s + c.costContribution, 0);

  return { ...formula, costBreakdown, totalCostPer100g };
}

export async function createFormula(orgId: string, userId: string, input: CreateFormulaInput) {
  const { ingredients, ...formulaData } = input;

  const formula = await prisma.formula.create({
    data: {
      ...formulaData,
      organizationId: orgId,
      createdBy: userId,
      ...(ingredients && {
        ingredients: {
          createMany: {
            data: ingredients.map((ing) => ({
              rawMaterialId: ing.rawMaterialId,
              section: ing.section,
              percentage: ing.percentage,
              dilutionPct: ing.dilutionPct,
              isOptional: ing.isOptional,
              sortOrder: ing.sortOrder,
              perfumerNotes: ing.perfumerNotes,
            })),
          },
        },
      }),
    },
    include: formulaInclude,
  });

  if (ingredients?.length) {
    await recalcTotals(formula.id);
    await createVersion(formula.id, userId, "Initial version");
  }

  return formula;
}

export async function updateFormula(orgId: string, id: string, _userId: string, input: UpdateFormulaInput) {
  const existing = await prisma.formula.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new AppError(404, "Formula not found", "NOT_FOUND");
  if (existing.status === "locked") {
    throw new AppError(409, "Formula is locked and cannot be edited", "LOCKED");
  }

  const updated = await prisma.formula.update({
    where: { id },
    data: input,
    include: formulaInclude,
  });

  return updated;
}

export async function updateIngredients(
  orgId: string,
  formulaId: string,
  _userId: string,
  ingredients: CreateFormulaInput["ingredients"]
) {
  const existing = await prisma.formula.findFirst({ where: { id: formulaId, organizationId: orgId } });
  if (!existing) throw new AppError(404, "Formula not found", "NOT_FOUND");
  if (existing.status === "locked") {
    throw new AppError(409, "Formula is locked and cannot be edited", "LOCKED");
  }

  // Replace all ingredients atomically
  await prisma.$transaction([
    prisma.formulaIngredient.deleteMany({ where: { formulaId } }),
    prisma.formulaIngredient.createMany({
      data: (ingredients ?? []).map((ing) => ({
        formulaId,
        rawMaterialId: ing.rawMaterialId,
        section: ing.section,
        percentage: ing.percentage,
        dilutionPct: ing.dilutionPct,
        isOptional: ing.isOptional,
        sortOrder: ing.sortOrder,
        perfumerNotes: ing.perfumerNotes,
      })),
    }),
  ]);

  await recalcTotals(formulaId);
  await createVersion(formulaId, null, "Ingredient update");

  return getFormula(orgId, formulaId);
}

export async function changeStatus(
  orgId: string,
  formulaId: string,
  userId: string,
  status: string,
  _reason?: string
) {
  const existing = await prisma.formula.findFirst({ where: { id: formulaId, organizationId: orgId } });
  if (!existing) throw new AppError(404, "Formula not found", "NOT_FOUND");

  // Lock enforces: only admin can unlock
  if (existing.status === "locked" && status !== "approved") {
    throw new AppError(409, "Locked formula can only be reverted to approved by an admin", "LOCKED");
  }

  const data: Prisma.FormulaUpdateInput = {
    status: status as never,
    ...(status === "locked" ? { lockedAt: new Date(), lockedBy: userId } : {}),
    ...(status !== "locked" ? { lockedAt: null, lockedBy: null } : {}),
  };

  return prisma.formula.update({ where: { id: formulaId }, data });
}

export async function scaleFormula(orgId: string, formulaId: string, input: ScaleFormulaInput) {
  const formula = await getFormula(orgId, formulaId);
  const { targetMl, fragrancePct } = input;
  const oilPct = fragrancePct ?? Number(formula.totalFragrancePct ?? 20);
  const oilMl = (oilPct / 100) * targetMl;

  const scaledIngredients = formula.ingredients.map((ing) => ({
    name: ing.rawMaterial.name,
    percentage: Number(ing.percentage),
    amountGrams: parseFloat(((Number(ing.percentage) / oilPct) * oilMl).toFixed(4)),
    section: ing.section,
    costPerUnit: Number(ing.rawMaterial.costPerUnit),
    totalCost: parseFloat(
      (((Number(ing.percentage) / oilPct) * oilMl) * Number(ing.rawMaterial.costPerUnit) / 1000).toFixed(4)
    ),
  }));

  const totalCost = scaledIngredients.reduce((s, i) => s + i.totalCost, 0);

  return {
    formulaId,
    formulaName: formula.name,
    targetMl,
    fragrancePct: oilPct,
    oilMl,
    alcoholMl: targetMl - oilMl,
    scaledIngredients,
    totalCostEstimate: parseFloat(totalCost.toFixed(4)),
    costPerMl: parseFloat((totalCost / targetMl).toFixed(4)),
  };
}

export async function getVersions(orgId: string, formulaId: string) {
  const formula = await prisma.formula.findFirst({ where: { id: formulaId, organizationId: orgId } });
  if (!formula) throw new AppError(404, "Formula not found", "NOT_FOUND");

  return prisma.formulaVersion.findMany({
    where: { formulaId },
    orderBy: { versionNumber: "desc" },
  });
}

export async function deleteFormula(orgId: string, id: string) {
  const existing = await prisma.formula.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new AppError(404, "Formula not found", "NOT_FOUND");
  if (existing.status === "locked") {
    throw new AppError(409, "Cannot delete a locked formula", "LOCKED");
  }

  const inProduction = await prisma.productionOrder.findFirst({
    where: { formulaId: id, status: { in: ["in_progress", "scheduled", "macerating", "quality_check"] } },
  });
  if (inProduction) throw new AppError(409, "Formula is in active production", "IN_USE");

  await prisma.formula.delete({ where: { id } });
  return { deleted: true };
}
