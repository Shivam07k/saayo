import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { token, password } = data;
  if (!token || !password) return jsonError("Token and password are required", 400);
  if (password.length < 8) return jsonError("Password must be at least 8 characters", 400);

  const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!reset || reset.expiresAt < new Date()) {
    return jsonError("Reset link is invalid or expired", 400);
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash, passwordChangedAt: new Date(), lockedUntil: null, failedLoginAttempts: 0 },
  });
  await prisma.passwordResetToken.delete({ where: { token } });
  await prisma.session.deleteMany({ where: { userId: reset.userId } });

  return Response.json({ success: true, message: "Password updated. You can now sign in." });
}