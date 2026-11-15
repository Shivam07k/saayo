import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sanitizeUser } from "@/lib/utils";
import { isAdmin } from "@/lib/permissions";

const SESSION_COOKIE = process.env.SESSION_COOKIE || "saayo_session";
const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "dev-secret-change-me"
);
const EXPIRY_DAYS = Number(process.env.SESSION_EXPIRY_DAYS || 7);
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash || "");
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId, { ip, userAgent } = {}) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(createHash("sha256").update(`${userId}:${ip || ""}:${Date.now()}:${Math.random()}`).digest("hex").slice(0, 24))
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY_DAYS}d`)
    .sign(SECRET);

  try {
    await prisma.session.upsert({
      where: { tokenHash: hashSessionToken(token) },
      update: { expiresAt: new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000) },
      create: {
        tokenHash: hashSessionToken(token),
        userId,
        ip: ip || null,
        userAgent: userAgent || null,
        expiresAt: new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });
  } catch (e) {
    console.error("session persist failed", e.message);
  }

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRY_DAYS * 24 * 60 * 60,
  });
  return token;
}

export async function destroySession() {
  const token = await getSessionToken();
  if (token) {
    try {
      await prisma.session.delete({ where: { tokenHash: hashSessionToken(token) } });
    } catch {
      // session may not exist in DB yet (pre-persistence cookies)
    }
  }
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionToken() {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

export async function getSessionUser() {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const [user, dbSession] = await Promise.all([
      prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          role: { include: { permissions: true } },
          wishlist: true,
          cart: { include: { items: true } },
        },
      }),
      prisma.session.findUnique({ where: { tokenHash: hashSessionToken(token) } }),
    ]);
    if (!user || !dbSession) return null;
    if (user.status !== "active") return null;
    return {
      ...sanitizeUser(user),
      permissions: user.role.permissions.map((p) => p.key),
      roleName: user.role.name,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const user = await getSessionUser();
  return user;
}

export async function requireUser({ redirectTo = "/login" } = {}) {
  const user = await getSessionUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireAdmin({ redirectTo = "/admin/login" } = {}) {
  const user = await getSessionUser();
  if (!user) redirect(redirectTo);
  if (!isAdmin(user)) redirect("/");
  return user;
}

export function hasPermission(user, permission) {
  return user?.permissions?.includes(permission) || user?.roleName === "Super Admin";
}

export async function apiRequireAdmin({ permission } = {}) {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  // No permission named means "any admin", never "any logged-in user".
  if (permission ? !hasPermission(user, permission) : !isAdmin(user)) {
    return { error: "Forbidden: missing permission", status: 403 };
  }
  return { user };
}

export async function apiRequireUser() {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  return { user };
}

export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function requirePermission(permission, { redirectTo = "/admin" } = {}) {
  const user = await getSessionUser();
  if (!user) redirect(redirectTo);
  if (!hasPermission(user, permission)) redirect("/admin");
  return user;
}

export async function login(email, password, { ip, userAgent } = {}) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user) {
    await prisma.loginAttempt.create({ data: { email, success: false, ip } });
    return { error: "Invalid email or password" };
  }

  if (user.status === "blocked") {
    return { error: "This account has been blocked. Contact support." };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: `Account temporarily locked. Try again after ${LOCK_MINUTES} minutes.` };
  }

  if (!user.passwordHash) {
    await prisma.loginAttempt.create({ data: { userId: user.id, email, success: false, ip } });
    return { error: "This account uses Google sign-in. Please use Google to log in." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const lock = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts, lockedUntil: lock },
    });
    await prisma.loginAttempt.create({ data: { userId: user.id, email, success: false, ip } });
    return { error: lock ? "Too many failed attempts. Account locked for 15 minutes." : "Invalid email or password" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await prisma.loginAttempt.create({ data: { userId: user.id, email, success: true, ip } });
  await createSession(user.id);

  return { success: true, user: sanitizeUser(user) };
}

export async function register({ email, password, name, phone }) {
  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return { error: "An account with this email already exists" };

  const customerRole = await prisma.role.findUnique({ where: { name: "Customer" } });
  if (!customerRole) return { error: "Customer role not configured. Run the database seed." };

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      phone,
      passwordHash,
      emailVerified: true,
      roleId: customerRole.id,
      referralCode: `REF-${name.slice(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
    },
  });
  await prisma.cart.create({ data: { userId: user.id } });
  await prisma.wishlist.create({ data: { userId: user.id } });
  await createSession(user.id);
  return { success: true, user: sanitizeUser(user) };
}

export async function logout() {
  await destroySession();
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };
  if (user.passwordHash) {
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return { error: "Current password is incorrect" };
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date() },
  });
  return { success: true };
}

export async function logAudit({ userId, action, entityType, entityId, meta, ip, userAgent }) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entityType, entityId, meta, ip, userAgent },
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}

export function isRateLimited(key, limit = 100, windowMs = 60000) {
  // Simple in-memory rate limiter usable in serverless (per-instance).
  // For production, prefer @upstash/ratelimit or a DB-backed store.
  const safeKey = `ratelimit:${key}`;
  const now = Date.now();
  if (!isRateLimited._store) isRateLimited._store = {};
  const entry = isRateLimited._store[safeKey];
  if (!entry || now > entry.resetAt) {
    isRateLimited._store[safeKey] = { count: 1, resetAt: now + windowMs };
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}