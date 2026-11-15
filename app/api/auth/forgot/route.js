import { prisma } from "@/lib/db";
import { jsonError, isRateLimited } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(request) {
  if (isRateLimited(`forgot:${request.headers.get("x-forwarded-for") || "unknown"}`, 5, 60000)) {
    return jsonError("Too many attempts. Please wait.", 429);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const email = (data.email || "").toLowerCase();
  if (!email) return jsonError("Email is required", 400);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = `${crypto.randomUUID()}-${Date.now().toString(36)}`;
    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
      create: { userId: user.id, token, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    });
    try {
      await sendPasswordResetEmail(email, token);
    } catch (e) {
      console.error("Failed to send reset email (SMTP not configured?)", e.message);
    }
  }

  // Always succeed to avoid user enumeration.
  return Response.json({ success: true, message: "If that email exists, a reset link has been sent." });
}