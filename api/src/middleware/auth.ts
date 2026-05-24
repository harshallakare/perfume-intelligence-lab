import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AccessTokenPayload } from "../lib/jwt";
import { AppError } from "./error";

// Augment Express Request to carry the decoded token
declare global {
  namespace Express {
    interface Request {
      user: AccessTokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing or invalid Authorization header", "UNAUTHORIZED"));
  }

  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(new AppError(401, "Access token expired or invalid", "TOKEN_INVALID"));
  }
}

/** Restrict to specific roles. Call after authenticate(). */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const hasRole = req.user.roles.some((r) => roles.includes(r));
    if (!hasRole) {
      return next(new AppError(403, "Insufficient permissions", "FORBIDDEN"));
    }
    return next();
  };
}

/** Guard that enforces the resource belongs to req.user.orgId */
export function sameOrg(orgId: string, next: NextFunction) {
  return (req: Request) => {
    if (req.user.orgId !== orgId) {
      return next(new AppError(403, "Access denied", "FORBIDDEN"));
    }
  };
}
