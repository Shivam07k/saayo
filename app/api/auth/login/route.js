import { login, isRateLimited, logAudit, jsonError } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { PERMISSIONS } from "@/lib/permissions";
import { safeRedirect } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`login:${ip}`, 10, 60000)) {
    return jsonError("Too many login attempts. Please wait a minute.", 429);
  }

  let data;
  let redirectParam;
  try {
    const body = await request.json();
    redirectParam = body?.redirect;
    data = loginSchema.parse(body);
  } catch (e) {
    return jsonError("Validation failed", 400);
  }

  const result = await login(data.email, data.password, { ip, userAgent: request.headers.get("user-agent") || undefined });

  if (!result.success) {
    return jsonError(result.error, 401);
  }

  await logAudit({ userId: result.user.id, action: "auth.login", entityType: "User", ip });

  await mergeGuestCartIntoUser(result.user.id);

  if (redirectParam) {
    return Response.json({ success: true, redirectTo: safeRedirect(redirectParam, "/") });
  }

  // Use permissions from login result (already includes role permissions) - avoids extra DB query
  const isStaff = result.user.permissions?.some((p) => Object.values(PERMISSIONS).includes(p));

  return Response.json({ success: true, redirectTo: isStaff ? "/admin" : "/" });
}