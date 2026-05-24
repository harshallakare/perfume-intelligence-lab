import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as svc from "./ifra.service";
import { checkComplianceSchema } from "./ifra.service";

const router = Router();
router.use(authenticate);

// GET /api/ifra/amendments
router.get("/amendments", async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAmendments() }); }
  catch (err) { next(err); }
});

// GET /api/ifra/restrictions?amendmentId=&search=
router.get("/restrictions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getRestrictions(
      req.query.amendmentId as string | undefined,
      req.query.search as string | undefined
    );
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// POST /api/ifra/check
router.post("/check", validate(checkComplianceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.checkCompliance(req.user.orgId, req.user.sub, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /api/ifra/history/:formulaId
router.get("/history/:formulaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getComplianceHistory(req.user.orgId, req.params["formulaId"] as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
