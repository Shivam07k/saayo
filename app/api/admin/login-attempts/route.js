import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "audit:view" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit"), 10) || 50));
  const q = searchParams.get("q") || "";
  const outcome = searchParams.get("success") || "";

  const where = {};
  if (outcome === "1") where.success = true;
  if (outcome === "0") where.success = false;
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { ip: { contains: q, mode: "insensitive" } },
      { user: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [attempts, count] = await Promise.all([
    prisma.loginAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.loginAttempt.count({ where }),
  ]);

  return Response.json({ attempts, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}