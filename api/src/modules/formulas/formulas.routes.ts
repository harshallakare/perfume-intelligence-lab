import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createFormulaSchema, updateFormulaSchema, listFormulasSchema,
  updateIngredientsSchema, changeStatusSchema, scaleFormulaSchema,
} from "./formulas.schema";
import * as ctrl from "./formulas.controller";

const router = Router();
router.use(authenticate);

router.get("/", validate(listFormulasSchema, "query"), ctrl.listFormulas);
router.post("/", requireRole("admin", "perfumer"), validate(createFormulaSchema), ctrl.createFormula);
router.get("/:id", ctrl.getFormula);
router.patch("/:id", requireRole("admin", "perfumer"), validate(updateFormulaSchema), ctrl.updateFormula);
router.delete("/:id", requireRole("admin", "perfumer"), ctrl.deleteFormula);

// Ingredients
router.put("/:id/ingredients", requireRole("admin", "perfumer"), validate(updateIngredientsSchema), ctrl.updateIngredients);

// Status workflow
router.patch("/:id/status", requireRole("admin", "perfumer"), validate(changeStatusSchema), ctrl.changeStatus);

// Version history
router.get("/:id/versions", ctrl.getVersions);

// Scaling calculator
router.post("/:id/scale", validate(scaleFormulaSchema), ctrl.scaleFormula);

export default router;
