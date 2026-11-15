import { prisma } from "@/lib/db";
import { apiRequireUser, jsonError } from "@/lib/auth";

export async function GET() {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  return Response.json({ notifications, unread });
}

export async function PATCH(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const id = data.id;
  if (id) {
    await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: data.read ?? true } });
  } else {
    await prisma.notification.updateMany({ where: { userId: user.id }, data: { read: true } });
  }
  return Response.json({ success: true });
}