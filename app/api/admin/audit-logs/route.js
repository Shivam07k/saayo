import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "audit:view" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = 30;
  const q = searchParams.get("q") || "";

  const where = {};
  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { user: { is: { name: { contains: q, mode: "insensitive" } } } },
      { entityId: { contains: q, mode: "insensitive" } },
    ];
  }

  const [logs, count] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return Response.json({ logs, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}