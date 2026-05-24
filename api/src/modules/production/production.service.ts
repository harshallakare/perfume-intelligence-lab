import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { AppError } from "../../middleware/error";
import { z } from "zod";

export const createOrderSchema = z.object({
  formulaId: z.string().uuid(),
  batchNumber: z.string().min(1).max(100),
  plannedQtyMl: z.number().min(1),
  scheduledStart: z.string().datetime().optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateOrderSchema = z.object({
  status: z.enum(["draft", "scheduled", "in_progress", "macerating", "quality_check", "completed", "rejected", "cancelled"]).optional(),
  actualQtyMl: z.number().min(0).optional(),
  actualStart: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
});

export const addQcLogSchema = z.object({
  result: z.enum(["pass", "fail", "conditional_pass", "pending"]),
  notes: z.string().optional(),
  parametersJson: z.record(z.unknown()).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

const orderInclude = {
  formula: { select: { id: true, name: true, concentrationType: true, status: true } },
  qcLogs: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.ProductionOrderInclude;

export async function listOrders(orgId: string, status?: string) {
  return prisma.productionOrder.findMany({
    where: {
      organizationId: orgId,
      ...(status ? { status: status as never } : {}),
    },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrder(orgId: string, id: string) {
  const order = await prisma.productionOrder.findFirst({
    where: { id, organizationId: orgId },
    include: {
      ...orderInclude,
      formula: {
        include: {
          ingredients: {
            include: { rawMaterial: { select: { id: true, name: true, costPerUnit: true, currentStock: true, unitOfMeasure: true } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
  if (!order) throw new AppError(404, "Production order not found", "NOT_FOUND");

  // Calculate scaled ingredient requirements
  const requiredIngredients = order.formula.ingredients.map((ing) => {
    const totalPct = Number(order.formula.totalFragrancePct ?? 20);
    const oilMl = (totalPct / 100) * Number(order.plannedQtyMl);
    const requiredGrams = (Number(ing.percentage) / totalPct) * oilMl;
    return {
      materialId: ing.rawMaterialId,
      materialName: ing.rawMaterial.name,
      percentage: Number(ing.percentage),
      requiredGrams: parseFloat(requiredGrams.toFixed(3)),
      availableStock: Number(ing.rawMaterial.currentStock),
      stockSufficient: Number(ing.rawMaterial.currentStock) >= requiredGrams,
      section: ing.section,
    };
  });

  return { ...order, requiredIngredients };
}

export async function createOrder(orgId: string, userId: string, input: CreateOrderInput) {
  // Verify formula belongs to org and is approved/locked
  const formula = await prisma.formula.findFirst({ where: { id: input.formulaId, organizationId: orgId } });
  if (!formula) throw new AppError(404, "Formula not found", "NOT_FOUND");
  if (!["approved", "locked"].includes(formula.status)) {
    throw new AppError(409, "Formula must be approved or locked before production", "FORMULA_NOT_READY");
  }

  return prisma.productionOrder.create({
    data: {
      organizationId: orgId,
      formulaId: input.formulaId,
      batchNumber: input.batchNumber,
      plannedQtyMl: input.plannedQtyMl,
      scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
      assignedTo: input.assignedTo,
      notes: input.notes,
      createdBy: userId,
    },
    include: orderInclude,
  });
}

export async function updateOrder(orgId: string, id: string, input: UpdateOrderInput) {
  const existing = await prisma.productionOrder.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new AppError(404, "Production order not found", "NOT_FOUND");

  if (["completed", "cancelled", "rejected"].includes(existing.status)) {
    throw new AppError(409, "Cannot modify a completed, cancelled, or rejected order", "ORDER_CLOSED");
  }

  return prisma.productionOrder.update({
    where: { id },
    data: {
      ...input,
      actualStart: input.actualStart ? new Date(input.actualStart) : undefined,
      completedAt: input.completedAt ? new Date(input.completedAt) : undefined,
    },
    include: orderInclude,
  });
}

export async function addQcLog(orgId: string, orderId: string, userId: string, input: z.infer<typeof addQcLogSchema>) {
  const order = await prisma.productionOrder.findFirst({ where: { id: orderId, organizationId: orgId } });
  if (!order) throw new AppError(404, "Production order not found", "NOT_FOUND");

  const log = await prisma.productionQcLog.create({
    data: {
      productionOrderId: orderId,
      result: input.result,
      notes: input.notes,
      parametersJson: (input.parametersJson as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
      testedBy: userId,
      testedAt: new Date(),
    },
  });

  // Auto-advance status based on QC result
  if (input.result === "pass") {
    await prisma.productionOrder.update({ where: { id: orderId }, data: { status: "completed", completedAt: new Date() } });
  } else if (input.result === "fail") {
    await prisma.productionOrder.update({ where: { id: orderId }, data: { status: "rejected" } });
  }

  return log;
}

export async function getProductionStats(orgId: string) {
  const [total, byStatus, recentCompleted] = await Promise.all([
    prisma.productionOrder.count({ where: { organizationId: orgId } }),
    prisma.productionOrder.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
    }),
    prisma.productionOrder.findMany({
      where: { organizationId: orgId, status: "completed" },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: { formula: { select: { name: true } } },
    }),
  ]);

  return { total, byStatus, recentCompleted };
}
