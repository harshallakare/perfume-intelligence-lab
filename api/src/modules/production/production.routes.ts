import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createOrderSchema, updateOrderSchema, addQcLogSchema } from "./production.service";
import { Request, Response, NextFunction } from "express";
import * as svc from "./production.service";

const router = Router();
router.use(authenticate);

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getProductionStats(req.user.orgId) }); }
  catch (err) { next(err); }
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.listOrders(req.user.orgId, req.query.status as string | undefined);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post("/", requireRole("admin", "production_manager", "perfumer"), validate(createOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.createOrder(req.user.orgId, req.user.sub, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getOrder(req.user.orgId, req.params["id"] as string) }); }
  catch (err) { next(err); }
});

router.patch("/:id", requireRole("admin", "production_manager"), validate(updateOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.updateOrder(req.user.orgId, req.params["id"] as string, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post("/:id/qc", requireRole("admin", "production_manager", "perfumer"), validate(addQcLogSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.addQcLog(req.user.orgId, req.params["id"] as string, req.user.sub, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
