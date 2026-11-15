import { prisma } from "@/lib/db";
import { getSessionUser, jsonError, apiRequireUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations";
import { createOrder } from "@/lib/orderUtils";
import { writeGuestCartCookie } from "@/lib/cart";
import { getStoreSettings } from "@/lib/storeSettings";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    const settings = await getStoreSettings();
    if (!settings.checkoutGuestEnabled) return jsonError("Please login to complete checkout", 401);
  }
  let data;
  try {
    data = checkoutSchema.parse(await request.json());
  } catch (e) {
    return Response.json({ error: "Validation failed", fieldErrors: e.flatten?.()?.fieldErrors || e.errors }, { status: 400 });
  }

  const result = await createOrder({
    user,
    email: data.email,
    phone: data.phone || null,
    shippingAddressId: data.shippingAddressId || null,
    shippingAddress: data.shippingAddress || null,
    couponCode: data.couponCode || "",
    paymentMethod: data.paymentMethod,
    notes: data.notes || "",
    useBillingForShipping: data.useBillingForShipping,
  });

  if (result.error) return jsonError(result.error, 400);
  if (!user) writeGuestCartCookie([]);
  return Response.json(result.order, { status: 201 });
}

export async function GET(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = 20;
  const [orders, count] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { items: true, payments: true },
    }),
    prisma.order.count({ where: { userId: user.id } }),
  ]);
  return Response.json({ orders, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}