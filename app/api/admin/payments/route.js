import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "payments:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = 20;
  const paymentStatus = searchParams.get("paymentStatus") || "";
  const provider = searchParams.get("provider") || "";

  const where = {};
  if (paymentStatus) where.status = paymentStatus;
  if (provider) where.provider = provider;

  const [payments, count] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { order: { select: { orderNumber: true, email: true, total: true } } },
    }),
    prisma.payment.count({ where }),
  ]);

  return Response.json({ payments, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}

export async function PATCH(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "payments:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);
  const payment = await prisma.payment.update({
    where: { id: data.id },
    data: { status: data.status || undefined, failureReason: data.failureReason !== undefined ? data.failureReason : undefined },
  });
  return Response.json({ payment });
}