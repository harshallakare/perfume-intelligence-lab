import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth";
import * as svc from "./analytics.service";

const router = Router();
router.use(authenticate);

router.get("/dashboard", async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getDashboardStats(req.user.orgId) }); }
  catch (err) { next(err); }
});

router.get("/inventory", async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getInventoryAnalytics(req.user.orgId) }); }
  catch (err) { next(err); }
});

router.get("/production", async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getProductionAnalytics(req.user.orgId) }); }
  catch (err) { next(err); }
});

export default router;
