import { prisma } from "@/lib/db";
import { getSessionUser, jsonError } from "@/lib/auth";
import { applyCoupon } from "@/lib/orderUtils";

export async function POST(request) {
  const user = await getSessionUser();
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { code } = data;
  if (!code) return jsonError("Coupon code is required", 400);

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon) return jsonError("Invalid coupon code", 404);

  const items = data.items || [];
  const result = await applyCoupon(coupon, Number(data.subtotal || 0), {
    userId: user?.id,
    email: user?.email || "guest@example.com",
    productIds: (items || []).map((i) => i.productId),
    categoryIds: [],
  });

  if (result.error) return jsonError(result.error, 400);
  return Response.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: result.discount,
    freeShipping: result.freeShipping,
    message: coupon.message || null,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
      freeShipping: result.freeShipping,
    },
  });
}