import { Request, Response, NextFunction } from "express";
import * as svc from "./inventory.service";

// ── Materials ─────────────────────────────────────────────────────────────────

export async function listMaterials(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.listMaterials(req.user.orgId, req.query as never);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getMaterial(req.user.orgId, req.params["id"] as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function createMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.createMaterial(req.user.orgId, req.user.sub, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function updateMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.updateMaterial(req.user.orgId, req.params["id"] as string, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function deleteMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.deleteMaterial(req.user.orgId, req.params["id"] as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.adjustStock(req.user.orgId, req.params["id"] as string, req.user.sub, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

// ── Suppliers ─────────────────────────────────────────────────────────────────

export async function listSuppliers(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.listSuppliers(req.user.orgId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function createSupplier(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.createSupplier(req.user.orgId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function updateSupplier(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.updateSupplier(req.user.orgId, req.params["id"] as string, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getInventoryStats(req.user.orgId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
