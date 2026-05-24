import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { AppError } from "../../middleware/error";
import type {
  CreateMaterialInput,
  UpdateMaterialInput,
  ListMaterialsInput,
  CreateSupplierInput,
  AdjustStockInput,
} from "./inventory.schema";

// ── Raw Materials ─────────────────────────────────────────────────────────────

export async function listMaterials(orgId: string, query: ListMaterialsInput) {
  const { page, limit, search, materialType, odorFamily, lowStock, isAllergen, ifraRestricted, sortBy, sortDir } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.RawMaterialWhereInput = {
    organizationId: orgId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { casNumber: { contains: search, mode: "insensitive" } },
        { odorDescription: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(materialType && { materialType }),
    ...(odorFamily && { odorFamily }),
    ...(isAllergen !== undefined && { isAllergen }),
    ...(ifraRestricted !== undefined && { ifraRestricted }),
    ...(lowStock && {
      AND: [
        { currentStock: { gt: 0 } },
        { minimumStock: { gt: 0 } },
        // current_stock < minimum_stock – Prisma doesn't support column comparison
        // so we filter in memory below if lowStock=true
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.rawMaterial.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: { primarySupplier: { select: { id: true, name: true } } },
    }),
    prisma.rawMaterial.count({ where }),
  ]);

  const filtered = lowStock
    ? items.filter((m) => Number(m.currentStock) < Number(m.minimumStock))
    : items;

  return {
    items: filtered,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function getMaterial(orgId: string, id: string) {
  const material = await prisma.rawMaterial.findFirst({
    where: { id, organizationId: orgId },
    include: {
      primarySupplier: true,
      formulaIngredients: {
        include: { formula: { select: { id: true, name: true, status: true } } },
        take: 10,
      },
    },
  });
  if (!material) throw new AppError(404, "Material not found", "NOT_FOUND");
  return material;
}

export async function createMaterial(orgId: string, userId: string, input: CreateMaterialInput) {
  return prisma.rawMaterial.create({
    data: {
      ...input,
      organizationId: orgId,
      createdBy: userId,
      currentStock: input.currentStock ?? 0,
      minimumStock: input.minimumStock ?? 0,
      costPerUnit: input.costPerUnit ?? 0,
    },
  });
}

export async function updateMaterial(orgId: string, id: string, input: UpdateMaterialInput) {
  // Ensure material belongs to org
  const existing = await prisma.rawMaterial.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new AppError(404, "Material not found", "NOT_FOUND");

  return prisma.rawMaterial.update({ where: { id }, data: input });
}

export async function deleteMaterial(orgId: string, id: string) {
  const existing = await prisma.rawMaterial.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new AppError(404, "Material not found", "NOT_FOUND");

  // Check if material is used in any non-draft formulas
  const inUse = await prisma.formulaIngredient.findFirst({
    where: {
      rawMaterialId: id,
      formula: { status: { not: "draft" } },
    },
  });
  if (inUse) {
    throw new AppError(409, "Cannot delete a material used in approved or locked formulas", "IN_USE");
  }

  await prisma.rawMaterial.delete({ where: { id } });
  return { deleted: true };
}

export async function adjustStock(
  orgId: string,
  materialId: string,
  userId: string,
  input: AdjustStockInput
) {
  const material = await prisma.rawMaterial.findFirst({
    where: { id: materialId, organizationId: orgId },
  });
  if (!material) throw new AppError(404, "Material not found", "NOT_FOUND");

  const newStock = Number(material.currentStock) + input.delta;
  if (newStock < 0) throw new AppError(400, "Stock cannot go below zero", "NEGATIVE_STOCK");

  // Update stock via raw SQL to also insert a transaction record
  const updated = await prisma.rawMaterial.update({
    where: { id: materialId },
    data: { currentStock: newStock },
  });

  // Insert transaction log via raw SQL (table is partitioned, Prisma can't model it)
  await prisma.$executeRaw`
    INSERT INTO material_transactions
      (raw_material_id, organization_id, transaction_type, quantity_delta, quantity_after,
       reference_id, notes, created_by, created_at)
    VALUES
      (${materialId}::uuid, ${orgId}::uuid, ${input.transactionType}::"transaction_type_enum",
       ${input.delta}, ${newStock}, ${input.referenceId ?? null}::uuid,
       ${input.notes ?? null}, ${userId}::uuid, NOW())
  `;

  return updated;
}

// ── Suppliers ─────────────────────────────────────────────────────────────────

export async function listSuppliers(orgId: string) {
  return prisma.supplier.findMany({
    where: { organizationId: orgId, isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { rawMaterials: true } } },
  });
}

export async function createSupplier(orgId: string, input: CreateSupplierInput) {
  return prisma.supplier.create({
    data: { ...input, organizationId: orgId },
  });
}

export async function updateSupplier(orgId: string, id: string, input: Partial<CreateSupplierInput>) {
  const existing = await prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) throw new AppError(404, "Supplier not found", "NOT_FOUND");
  return prisma.supplier.update({ where: { id }, data: input });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getInventoryStats(orgId: string) {
  const [total, lowStock, outOfStock, restricted, totalValue] = await Promise.all([
    prisma.rawMaterial.count({ where: { organizationId: orgId } }),
    prisma.rawMaterial.count({
      where: {
        organizationId: orgId,
        minimumStock: { gt: 0 },
        currentStock: { gt: 0 },
      },
    }),
    prisma.rawMaterial.count({
      where: { organizationId: orgId, currentStock: { lte: 0 } },
    }),
    prisma.rawMaterial.count({
      where: { organizationId: orgId, OR: [{ isRestricted: true }, { ifraRestricted: true }] },
    }),
    prisma.rawMaterial.aggregate({
      where: { organizationId: orgId },
      _sum: { currentStock: true, costPerUnit: true },
    }),
  ]);

  return {
    total,
    lowStock,
    outOfStock,
    restricted,
    estimatedTotalValue:
      Number(totalValue._sum.currentStock ?? 0) * Number(totalValue._sum.costPerUnit ?? 0),
  };
}
