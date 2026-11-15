import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";
import { sendOrderNotification } from "@/lib/mailer";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "orders:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = Math.min(50, parseInt(searchParams.get("limit"), 10) || 20);
  const q = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "";
  const paymentStatus = searchParams.get("paymentStatus") || "";

  const where = {};
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { user: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (statusFilter) where.status = statusFilter;
  if (paymentStatus) where.paymentStatus = paymentStatus;

  const [orders, count] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { select: { id: true, name: true, sku: true, quantity: true, price: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return Response.json({ orders, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}

export async function PATCH(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "orders:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { id, status: newStatus, trackingNumber, carrier, note } = data;
  if (!id) return jsonError("id required", 400);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: { select: { email: true } }, shipments: true },
  });
  if (!order) return jsonError("Order not found", 404);

  const cancel = newStatus === "cancelled" && order.status !== "cancelled";

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.order.update({
      where: { id },
      data: {
        status: newStatus || undefined,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
        shippingProvider: carrier !== undefined ? carrier : undefined,
      },
    });

    if (cancel) {
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        if (item.variantId) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
        } else {
          await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity }, soldCount: { decrement: item.quantity } } });
        }
        const inv = await tx.inventory.findFirst({ where: { productId: item.productId, variantId: item.variantId || null } });
        if (inv) {
          await tx.inventory.update({ where: { id: inv.id }, data: { availableQty: { increment: item.quantity }, reservedQty: { decrement: item.quantity } } });
          await tx.inventoryLog.create({ data: { inventoryId: inv.id, type: "restocked", quantity: item.quantity, referenceId: order.orderNumber } });
        }
      }
    }

    if (order.userId && (cancel || newStatus === "shipped" || newStatus === "delivered")) {
      await tx.notification.create({
        data: {
          userId: order.userId, orderId: order.id, type: "order",
          title: `Order ${newStatus}`,
          body: `Your order ${order.orderNumber} is now ${newStatus}.`,
        },
      });
    }

    return next;
  });

  await logAudit({ userId: user.id, action: `order.${newStatus || "update"}`, entityType: "Order", entityId: id });
  try {
    await sendOrderNotification(order.user?.email || order.email, order.orderNumber, newStatus || "updated");
  } catch (e) {
    console.error("order email failed", e.message);
  }

  return Response.json({ order: updated });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "orders:manage" });
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.order.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "order.delete", entityType: "Order", entityId: id });
  return Response.json({ success: true });
}