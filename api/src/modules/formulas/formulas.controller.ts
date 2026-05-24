import { Request, Response, NextFunction } from "express";
import * as svc from "./formulas.service";

export async function listFormulas(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.listFormulas(req.user.orgId, req.query as never);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getFormula(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getFormula(req.user.orgId, req.params["id"] as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function createFormula(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.createFormula(req.user.orgId, req.user.sub, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function updateFormula(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.updateFormula(req.user.orgId, req.params["id"] as string, req.user.sub, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function updateIngredients(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.updateIngredients(req.user.orgId, req.params["id"] as string, req.user.sub, req.body.ingredients);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function changeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.changeStatus(req.user.orgId, req.params["id"] as string, req.user.sub, req.body.status, req.body.reason);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function scaleFormula(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.scaleFormula(req.user.orgId, req.params["id"] as string, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getVersions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getVersions(req.user.orgId, req.params["id"] as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function deleteFormula(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.deleteFormula(req.user.orgId, req.params["id"] as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
