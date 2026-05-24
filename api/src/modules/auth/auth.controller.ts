import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    };
    const result = await authService.login(req.body, deviceInfo);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // The jti claim in the refresh token = refresh token record id
    const { jti } = req.body;
    if (jti) await authService.logout(jti);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.register(req.body);
    res.status(201).json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await authService.me(req.user.sub);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}
