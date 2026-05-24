import prisma from "../../lib/prisma";
import { AppError } from "../../middleware/error";
import { z } from "zod";

export const checkComplianceSchema = z.object({
  formulaId: z.string().uuid(),
  category: z.enum([
    "cat_1", "cat_2", "cat_3", "cat_4", "cat_5a", "cat_5b", "cat_5c", "cat_5d",
    "cat_6", "cat_7a", "cat_7b", "cat_8", "cat_9", "cat_10a", "cat_10b",
    "cat_11a", "cat_11b", "cat_12", "cat_13", "cat_14",
  ]),
  amendmentId: z.string().uuid().optional(),
});

export type CheckComplianceInput = z.infer<typeof checkComplianceSchema>;

export async function getAmendments() {
  return prisma.ifraAmendment.findMany({
    orderBy: { amendmentNo: "desc" },
    include: { _count: { select: { restrictions: true } } },
  });
}

export async function getRestrictions(amendmentId?: string, search?: string) {
  return prisma.ifraRestriction.findMany({
    where: {
      ...(amendmentId ? { amendmentId } : {}),
      ...(search
        ? {
            OR: [
              { materialName: { contains: search, mode: "insensitive" } },
              { casNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { amendment: { select: { amendmentNo: true, title: true } } },
    orderBy: { materialName: "asc" },
    take: 200,
  });
}

export async function checkCompliance(orgId: string, userId: string, input: CheckComplianceInput) {
  const { formulaId, category, amendmentId } = input;

  // Fetch formula with ingredients
  const formula = await prisma.formula.findFirst({
    where: { id: formulaId, organizationId: orgId },
    include: {
      ingredients: {
        include: {
          rawMaterial: { select: { name: true, casNumber: true, ifraRestricted: true } },
        },
      },
    },
  });
  if (!formula) throw new AppError(404, "Formula not found", "NOT_FOUND");

  // Get latest amendment if not specified
  let targetAmendmentId = amendmentId;
  if (!targetAmendmentId) {
    const latest = await prisma.ifraAmendment.findFirst({ orderBy: { amendmentNo: "desc" } });
    targetAmendmentId = latest?.id;
  }

  if (!targetAmendmentId) {
    throw new AppError(503, "No IFRA amendment data found. Run database seeds first.", "NO_IFRA_DATA");
  }

  // Fetch restrictions for this amendment + category
  const restrictions = await prisma.ifraRestriction.findMany({
    where: { amendmentId: targetAmendmentId, category },
  });

  const restrictionMap = new Map(
    restrictions.map((r) => [r.casNumber?.toLowerCase() ?? r.materialName.toLowerCase(), r])
  );

  // Check each ingredient against restrictions
  const violations: {
    materialName: string;
    casNumber: string | null;
    usagePct: number;
    maxAllowedPct: number;
    exceedsByPct: number;
    restrictionType: string;
  }[] = [];

  for (const ing of formula.ingredients) {
    const usagePct = Number(ing.percentage);
    const lookupKey = ing.rawMaterial.casNumber?.toLowerCase() ?? ing.rawMaterial.name.toLowerCase();
    const restriction = restrictionMap.get(lookupKey);

    if (restriction) {
      const maxPct = Number(restriction.maxUsagePct);
      if (usagePct > maxPct) {
        violations.push({
          materialName: ing.rawMaterial.name,
          casNumber: ing.rawMaterial.casNumber,
          usagePct,
          maxAllowedPct: maxPct,
          exceedsByPct: parseFloat((usagePct - maxPct).toFixed(5)),
          restrictionType: restriction.restrictionType,
        });
      }
    }
  }

  const isCompliant = violations.length === 0;

  // Store the result
  const check = await prisma.complianceCheck.create({
    data: {
      organizationId: orgId,
      formulaId,
      amendmentId: targetAmendmentId,
      category,
      isCompliant,
      violationsJson: violations,
      checkedBy: userId,
    },
  });

  return {
    checkId: check.id,
    formulaId,
    formulaName: formula.name,
    category,
    isCompliant,
    violations,
    checkedAt: check.checkedAt,
    summary: isCompliant
      ? `✅ Formula is IFRA-compliant for category ${category}`
      : `❌ ${violations.length} violation(s) found for category ${category}`,
  };
}

export async function getComplianceHistory(orgId: string, formulaId: string) {
  const formula = await prisma.formula.findFirst({ where: { id: formulaId, organizationId: orgId } });
  if (!formula) throw new AppError(404, "Formula not found", "NOT_FOUND");

  return prisma.complianceCheck.findMany({
    where: { formulaId, organizationId: orgId },
    orderBy: { checkedAt: "desc" },
  });
}
