import { apiRequireUser, jsonError, changePassword, logAudit } from "@/lib/auth";

export const runtime = "nodejs";

export async function PUT(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { currentPassword, newPassword } = data;
  if (!newPassword || newPassword.length < 8) return jsonError("New password must be at least 8 characters", 400);

  const result = await changePassword(user.id, currentPassword, newPassword);
  if (!result.success) return jsonError(result.error, 400);

  await logAudit({ userId: user.id, action: "profile.password_change", entityType: "User" });
  return Response.json({ success: true });
}