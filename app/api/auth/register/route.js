import { register, logAudit } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { jsonError } from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { safeRedirect } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request) {
  let data;
  let redirectParam;
  try {
    const body = await request.json();
    redirectParam = body?.redirect;
    data = registerSchema.parse(body);
  } catch (e) {
    return Response.json({
      error: "Validation failed",
      fieldErrors: e.flatten?.()?.fieldErrors || e.errors,
    }, { status: 400 });
  }

  const result = await register({ email: data.email, password: data.password, name: data.name, phone: data.phone || "" });

  if (!result.success) return jsonError(result.error, 400);
  await logAudit({ userId: result.user.id, action: "auth.register", entityType: "User" });
  if (result.user?.id) await mergeGuestCartIntoUser(result.user.id);
  return Response.json({ success: true, redirectTo: safeRedirect(redirectParam, "/account") }, { status: 201 });
}