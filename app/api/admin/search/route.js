import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin();
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return Response.json({ products: [], orders: [], customers: [] });

  const [products, orders, customers] = await Promise.all([
    prisma.product.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] },
      take: 6,
      select: { id: true, name: true, sku: true, isActive: true },
    }),
    prisma.order.findMany({
      where: { OR: [{ orderNumber: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
      take: 6,
      select: { id: true, orderNumber: true, email: true, status: true, total: true },
    }),
    prisma.user.findMany({
      where: { role: { isNot: { name: "Super Admin" } }, OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }] },
      take: 6,
      select: { id: true, name: true, email: true, status: true },
    }),
  ]);

  return Response.json({ products, orders, customers });
}