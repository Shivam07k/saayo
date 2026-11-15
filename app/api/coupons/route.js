import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ coupons });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "coupons:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.code) return jsonError("Code is required", 400);

  const coupon = await prisma.coupon.create({
    data: {
      code: String(data.code).toUpperCase(),
      type: data.type || "percent",
      value: Number(data.value || 0),
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : null,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      perUserLimit: data.perUserLimit ? Number(data.perUserLimit) : 1,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive ?? true,
      productIds: Array.isArray(data.productIds) ? data.productIds : [],
      categoryIds: Array.isArray(data.categoryIds) ? data.categoryIds : [],
      customerEmails: Array.isArray(data.customerEmails) ? data.customerEmails : [],
    },
  });
  return Response.json({ coupon }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "coupons:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);
  const coupon = await prisma.coupon.update({
    where: { id: data.id },
    data: {
      code: data.code ? String(data.code).toUpperCase() : undefined,
      type: data.type || undefined,
      value: data.value !== undefined ? Number(data.value) : undefined,
      maxDiscount: data.maxDiscount !== undefined ? Number(data.maxDiscount) : undefined,
      minOrderAmount: data.minOrderAmount !== undefined ? Number(data.minOrderAmount) : undefined,
      usageLimit: data.usageLimit !== undefined ? Number(data.usageLimit) : undefined,
      perUserLimit: data.perUserLimit !== undefined ? Number(data.perUserLimit) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
      productIds: Array.isArray(data.productIds) ? data.productIds : undefined,
      categoryIds: Array.isArray(data.categoryIds) ? data.categoryIds : undefined,
      customerEmails: Array.isArray(data.customerEmails) ? data.customerEmails : undefined,
    },
  });
  return Response.json({ coupon });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "coupons:manage" });
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.coupon.delete({ where: { id } });
  return Response.json({ success: true });
}