import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "inventory:view" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit"), 10) || 50));
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";
  const inventoryId = searchParams.get("inventoryId") || "";

  const where = {};
  if (type) where.type = type;
  if (inventoryId) where.inventoryId = inventoryId;
  if (q) {
    where.inventory = { is: { product: { is: { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } } } };
  }

  const [logs, count] = await Promise.all([
    prisma.inventoryLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        inventory: {
          select: {
            id: true,
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            warehouse: { select: { name: true } },
          },
        },
      },
    }),
    prisma.inventoryLog.count({ where }),
  ]);

  return Response.json({ logs, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}