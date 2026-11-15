import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "customers:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit"), 10) || 50));
  const q = searchParams.get("q") || "";
  const subscriberStatus = searchParams.get("status") || "";

  const where = {};
  if (q) where.OR = [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }];
  if (subscriberStatus) where.status = subscriberStatus;

  const [subscribers, count, stats] = await Promise.all([
    prisma.subscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.subscriber.count({ where }),
    prisma.subscriber.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = { active: 0, unsubscribed: 0, bounced: 0 };
  for (const s of stats) counts[s.status] = s._count;

  return Response.json({
    subscribers,
    stats: { total: counts.active + counts.unsubscribed + counts.bounced, ...counts },
    pagination: { count, page, limit, pages: Math.ceil(count / limit) },
  });
}

export async function PATCH(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "customers:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);
  if (data.status && !["active", "unsubscribed", "bounced"].includes(data.status)) return jsonError("Invalid status", 400);

  const subscriber = await prisma.subscriber.update({
    where: { id: data.id },
    data: {
      status: data.status !== undefined ? data.status : undefined,
      name: data.name !== undefined ? data.name : undefined,
    },
  });
  await logAudit({ userId: user.id, action: "subscriber.update", entityType: "Subscriber", entityId: subscriber.id, meta: { status: data.status } });
  return Response.json({ subscriber });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "customers:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.subscriber.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "subscriber.delete", entityType: "Subscriber", entityId: id });
  return Response.json({ success: true });
}