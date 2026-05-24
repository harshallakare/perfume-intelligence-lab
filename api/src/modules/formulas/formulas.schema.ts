import { z } from "zod";

const concentrationTypeEnum = z.enum(["edt", "edp", "parfum", "extrait", "attar", "cologne", "body_spray", "oil_blend"]);
const formulaStatusEnum = z.enum(["draft", "under_review", "approved", "locked", "deprecated"]);
const odorFamilyEnum = z.enum(["floral", "oriental", "woody", "fresh", "citrus", "aquatic", "gourmand", "fougere", "chypre", "leather", "tobacco", "musk", "animalic", "green", "herbal", "spicy", "amber", "powdery", "aldehyic", "fruity"]);
const sectionEnum = z.enum(["top_note", "middle_note", "base_note", "modifier", "trace_molecule"]);

export const createFormulaSchema = z.object({
  name: z.string().min(1).max(255),
  internalCode: z.string().max(100).optional(),
  concentrationType: concentrationTypeEnum.default("edp"),
  olfactoryFamily: odorFamilyEnum.optional(),
  genderTarget: z.enum(["masculine", "feminine", "unisex"]).optional(),
  seasonTarget: z.enum(["spring", "summer", "autumn", "winter", "all"]).optional(),
  occasionTarget: z.string().max(50).optional(),
  projectionTarget: z.number().int().min(1).max(10).optional(),
  longevityTarget: z.number().int().min(1).max(10).optional(),
  sillageTarget: z.number().int().min(1).max(10).optional(),
  inspirationPerfume: z.string().max(255).optional(),
  inspirationBrand: z.string().max(255).optional(),
  description: z.string().optional(),
  perfumerNotes: z.string().optional(),
  agingNotes: z.string().optional(),
  recommendedMacerationDays: z.number().int().min(0).optional(),
  ingredients: z
    .array(
      z.object({
        rawMaterialId: z.string().uuid(),
        section: sectionEnum.default("middle_note"),
        percentage: z.number().min(0.001).max(100),
        dilutionPct: z.number().min(0.001).max(100).default(100),
        isOptional: z.boolean().default(false),
        sortOrder: z.number().int().default(0),
        perfumerNotes: z.string().optional(),
      })
    )
    .optional(),
});

export const updateFormulaSchema = createFormulaSchema.omit({ ingredients: true }).partial();

export const updateIngredientsSchema = z.object({
  ingredients: z.array(
    z.object({
      rawMaterialId: z.string().uuid(),
      section: sectionEnum.default("middle_note"),
      percentage: z.number().min(0.001).max(100),
      dilutionPct: z.number().min(0.001).max(100).default(100),
      isOptional: z.boolean().default(false),
      sortOrder: z.number().int().default(0),
      perfumerNotes: z.string().optional(),
    })
  ),
});

export const listFormulasSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: formulaStatusEnum.optional(),
  concentrationType: concentrationTypeEnum.optional(),
  olfactoryFamily: odorFamilyEnum.optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "status"]).default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const changeStatusSchema = z.object({
  status: formulaStatusEnum,
  reason: z.string().optional(),
});

export const scaleFormulaSchema = z.object({
  targetMl: z.number().min(1),
  fragrancePct: z.number().min(1).max(100).optional(),
});

export type CreateFormulaInput = z.infer<typeof createFormulaSchema>;
export type UpdateFormulaInput = z.infer<typeof updateFormulaSchema>;
export type ListFormulasInput = z.infer<typeof listFormulasSchema>;
export type ScaleFormulaInput = z.infer<typeof scaleFormulaSchema>;
