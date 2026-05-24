import { z } from "zod";

const materialTypeEnum = z.enum([
  "aroma_chemical", "essential_oil", "absolute", "natural_extract",
  "fixative", "alcohol", "dpg", "ipm", "tec", "musk", "aldehyde",
  "perfume_base", "solvent", "other",
]);

const odorFamilyEnum = z.enum([
  "floral", "oriental", "woody", "fresh", "citrus", "aquatic", "gourmand",
  "fougere", "chypre", "leather", "tobacco", "musk", "animalic", "green",
  "herbal", "spicy", "amber", "powdery", "aldehyic", "fruity",
]);

export const createMaterialSchema = z.object({
  name: z.string().min(1).max(255),
  iupacName: z.string().max(500).optional(),
  casNumber: z.string().max(20).optional(),
  einecsNumber: z.string().max(20).optional(),
  materialType: materialTypeEnum,
  odorFamily: odorFamilyEnum.optional(),
  odorDescription: z.string().optional(),
  odorIntensity: z.number().int().min(1).max(10).optional(),
  volatilityClass: z.enum(["T", "M", "B"]).optional(),
  diffusionStrength: z.number().int().min(1).max(10).optional(),
  fixativeStrength: z.number().int().min(1).max(10).optional(),
  longevityHours: z.number().min(0).optional(),
  primarySupplierId: z.string().uuid().optional(),
  originCountry: z.string().max(100).optional(),
  purityPercentage: z.number().min(0).max(100).optional(),
  isNatural: z.boolean().default(false),
  isAllergen: z.boolean().default(false),
  isRestricted: z.boolean().default(false),
  ifraRestricted: z.boolean().default(false),
  sdsUrl: z.string().url().optional(),
  unitOfMeasure: z.string().max(20).default("g"),
  currentStock: z.number().min(0).default(0),
  minimumStock: z.number().min(0).default(0),
  reorderQuantity: z.number().min(0).optional(),
  costPerUnit: z.number().min(0).default(0),
  currency: z.string().length(3).default("USD"),
  storageConditions: z.string().max(255).optional(),
  storageLocation: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  appearance: z.string().max(100).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateMaterialSchema = createMaterialSchema.partial();

export const listMaterialsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  materialType: materialTypeEnum.optional(),
  odorFamily: odorFamilyEnum.optional(),
  lowStock: z.coerce.boolean().optional(),
  isAllergen: z.coerce.boolean().optional(),
  ifraRestricted: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "currentStock", "costPerUnit", "createdAt"]).default("name"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  contactName: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  currency: z.string().length(3).default("USD"),
  paymentTerms: z.string().max(100).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const adjustStockSchema = z.object({
  delta: z.number(),
  reason: z.string().min(1),
  transactionType: z.enum([
    "purchase", "production_debit", "adjustment_add", "adjustment_remove",
    "waste", "return", "transfer_in", "transfer_out", "expiry_disposal",
  ]),
  referenceId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type ListMaterialsInput = z.infer<typeof listMaterialsSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
