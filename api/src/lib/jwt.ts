import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;          // user id
  orgId: string;        // organization id
  roles: string[];
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;          // refresh token id (maps to refresh_tokens.id)
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    audience: "pil-api",
    issuer: "pil",
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    audience: "pil-api",
    issuer: "pil",
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    audience: "pil-api",
    issuer: "pil",
  }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    audience: "pil-api",
    issuer: "pil",
  }) as RefreshTokenPayload;
}
