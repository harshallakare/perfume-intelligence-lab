import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createMaterialSchema, updateMaterialSchema, listMaterialsSchema,
  createSupplierSchema, adjustStockSchema,
} from "./inventory.schema";
import * as ctrl from "./inventory.controller";

const router = Router();
router.use(authenticate);

// Stats
router.get("/stats", ctrl.getStats);

// Materials
router.get("/materials", validate(listMaterialsSchema, "query"), ctrl.listMaterials);
router.post("/materials", requireRole("admin", "inventory_manager", "perfumer"), validate(createMaterialSchema), ctrl.createMaterial);
router.get("/materials/:id", ctrl.getMaterial);
router.patch("/materials/:id", requireRole("admin", "inventory_manager"), validate(updateMaterialSchema), ctrl.updateMaterial);
router.delete("/materials/:id", requireRole("admin", "inventory_manager"), ctrl.deleteMaterial);
router.post("/materials/:id/adjust-stock", requireRole("admin", "inventory_manager"), validate(adjustStockSchema), ctrl.adjustStock);

// Suppliers
router.get("/suppliers", ctrl.listSuppliers);
router.post("/suppliers", requireRole("admin", "inventory_manager"), validate(createSupplierSchema), ctrl.createSupplier);
router.patch("/suppliers/:id", requireRole("admin", "inventory_manager"), ctrl.updateSupplier);

export default router;
