import { prisma } from "@/lib/db";
import { getSessionUser, jsonError, isRateLimited } from "@/lib/auth";
import { sendNewsletterConfirmation } from "@/lib/mailer";

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`newsletter:${ip}`, 10, 60000)) return jsonError("Too many requests", 429);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const email = (data.email || "").toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Valid email required", 400);

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ success: true, message: "You're already subscribed." });
  }

  await prisma.subscriber.create({
    data: {
      email,
      name: data.name || null,
      status: "active",
      source: data.source || "footer",
    },
  });

  try {
    await sendNewsletterConfirmation(email);
  } catch (e) {
    console.error("Newsletter email failed", e.message);
  }

  return Response.json({ success: true, message: "Subscribed!" }, { status: 201 });
}