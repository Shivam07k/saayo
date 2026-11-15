import { prisma } from "@/lib/db";
import { getSessionUser, jsonError } from "@/lib/auth";

export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      payments: true,
      shipments: true,
      refunds: true,
      shippingAddress: true,
      billingAddress: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) return jsonError("Order not found", 404);

  const isAdmin = user.roleName === "Super Admin" || user.permissions?.includes("orders:manage") || user.permissions?.includes("orders:view");
  if (order.userId !== user.id && !isAdmin) return jsonError("Forbidden", 403);

  return Response.json({ order });
}