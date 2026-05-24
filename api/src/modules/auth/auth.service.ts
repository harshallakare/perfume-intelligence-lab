import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { AppError } from "../../middleware/error";
import { env } from "../../config/env";
import type { LoginInput, RegisterInput } from "./auth.schema";

// ── helpers ───────────────────────────────────────────────────────────────────

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function refreshExpiresAt(): Date {
  // Parse "30d" → 30 days from now
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([dhms])$/);
  const amount = match ? parseInt(match[1]) : 30;
  const unit = match ? match[2] : "d";
  const ms = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[unit] ?? 86400000;
  return new Date(Date.now() + amount * ms);
}

async function getUserRoles(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.map((ur) => ur.role.name);
}

async function buildTokenPair(userId: string, orgId: string, email: string) {
  const roles = await getUserRoles(userId);

  const accessToken = signAccessToken({ sub: userId, orgId, roles, email });

  // Store refresh token as a hash
  const rawRefresh = crypto.randomBytes(48).toString("hex");
  const refreshRecord = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawRefresh),
      expiresAt: refreshExpiresAt(),
    },
  });

  const refreshToken = signRefreshToken({ sub: userId, jti: refreshRecord.id });

  return { accessToken, refreshToken, roles };
}

// ── public service methods ────────────────────────────────────────────────────

export async function login(input: LoginInput, deviceInfo?: object) {
  const user = await prisma.user.findFirst({
    where: { email: input.email, isActive: true },
    include: { organization: true },
  });

  if (!user) throw new AppError(401, "Invalid email or password", "AUTH_FAILED");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid email or password", "AUTH_FAILED");

  if (!user.organization.isActive) {
    throw new AppError(403, "Organization is suspended", "ORG_SUSPENDED");
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await buildTokenPair(user.id, user.organizationId, user.email);

  // Attach device info to the refresh token record if provided
  if (deviceInfo) {
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { deviceInfo },
    });
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      roles: tokens.roles,
    },
    ...tokens,
  };
}

export async function refresh(rawRefreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AppError(401, "Refresh token invalid or expired", "TOKEN_INVALID");
  }

  const record = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new AppError(401, "Refresh token revoked or expired", "TOKEN_REVOKED");
  }

  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    include: { organization: true },
  });
  if (!user || !user.isActive) throw new AppError(401, "User not found or inactive", "AUTH_FAILED");

  // Revoke old refresh token (rotation)
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  return buildTokenPair(user.id, user.organizationId, user.email);
}

export async function logout(refreshTokenId: string) {
  await prisma.refreshToken.updateMany({
    where: { id: refreshTokenId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function register(input: RegisterInput) {
  // Check slug uniqueness
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: input.organizationSlug },
  });
  if (existingOrg) throw new AppError(409, "Organization slug already taken", "SLUG_TAKEN");

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  const org = await prisma.organization.create({
    data: {
      name: input.organizationName,
      slug: input.organizationSlug,
      plan: "starter",
      roles: {
        create: {
          name: "admin",
          displayName: "Administrator",
          description: "Full access to all features",
          permissions: ["*"],
          isSystemRole: true,
        },
      },
    },
    include: { roles: true },
  });

  const adminRole = org.roles[0];

  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      userRoles: {
        create: { roleId: adminRole.id },
      },
    },
  });

  return buildTokenPair(user.id, org.id, user.email);
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: true,
      userRoles: { include: { role: true } },
    },
  });
  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    preferences: user.preferences,
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
      plan: user.organization.plan,
    },
    roles: user.userRoles.map((ur) => ur.role.name),
  };
}
