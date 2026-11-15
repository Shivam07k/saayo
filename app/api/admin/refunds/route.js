import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";
import { createStripeRefund } from "@/lib/payments";
import { sendOrderNotification } from "@/lib/mailer";

export async function GET() {
  const { user, error, status } = await apiRequireAdmin({ permission: "returns:manage" });
  if (error) return jsonError(error, status);
  const refunds = await prisma.refund.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true, email: true, total: true } } },
  });
  return Response.json({ refunds });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "returns:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { orderId, amount, method = "original", reason = "" } = data;
  if (!orderId || !amount || amount <= 0) return jsonError("orderId and positive amount required", 400);

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payments: true } });
  if (!order) return jsonError("Order not found", 404);

  if (order.paymentMethod === "stripe" && order.paymentProviderId) {
    try {
      await createStripeRefund({ paymentIntentId: order.paymentProviderId, amount: Number(amount), reason });
    } catch (e) {
      return jsonError(`Stripe refund failed: ${e.message}`, 400);
    }
  }

  const refund = await prisma.$transaction(async (tx) => {
    const created = await tx.refund.create({
      data: {
        orderId,
        amount: Number(amount),
        reason: reason || undefined,
        status: "processed",
        providerRef: order.paymentProviderId || undefined,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "refunded", status: order.status === "cancelled" ? "cancelled" : "refunded", returnReason: reason || order.returnReason },
    });

    const items = order.items;
    for (const item of items) {
      if (item.variantId) {
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
      } else {
        await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity }, soldCount: { decrement: item.quantity } } });
      }
      await tx.orderItem.update({ where: { id: item.id }, data: { status: "refunded" } });
    }

    if (order.userId) {
      await tx.notification.create({
        data: {
          userId: order.userId, orderId, type: "order",
          title: "Refund processed",
          body: `A refund of ${amount} for ${order.orderNumber} has been processed.`,
        },
      });
    }
    return created;
  });

  await logAudit({ userId: user.id, action: "refund.create", entityType: "Order", entityId: orderId, meta: { amount } });
  try {
    await sendOrderNotification(order.email, order.orderNumber, "refunded");
  } catch (e) {
    console.error(e.message);
  }
  return Response.json({ refund }, { status: 201 });
}