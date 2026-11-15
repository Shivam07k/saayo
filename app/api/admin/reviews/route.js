import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "reviews:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = 20;
  const reviewStatus = searchParams.get("status") || "";

  const where = {};
  if (reviewStatus) where.status = reviewStatus;

  const [reviews, count] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { product: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } },
    }),
    prisma.review.count({ where }),
  ]);

  return Response.json({ reviews, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}

export async function PATCH(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "reviews:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { id, status: newStatus, adminResponse } = data;
  if (!id) return jsonError("id required", 400);

  const review = await prisma.review.update({
    where: { id },
    data: {
      status: newStatus || undefined,
      adminResponse: adminResponse !== undefined ? adminResponse : undefined,
    },
  });

  if (newStatus === "approved") {
    const agg = await prisma.review.aggregate({ where: { productId: review.productId, status: "approved" }, _avg: { rating: true }, _count: { rating: true } });
    await prisma.product.update({
      where: { id: review.productId },
      data: { ratingAvg: Math.round((agg._avg.rating || 0) * 10) / 10, ratingCount: agg._count.rating },
    });
  }

  return Response.json({ review });
}