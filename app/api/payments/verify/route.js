import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/auth";
import { verifyRazorpaySignature, captureRazorpayPayment } from "@/lib/payments";

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return jsonError("Missing verification fields", 400);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return jsonError("Order not found", 404);

  const valid = await verifyRazorpaySignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature });

  if (!valid) {
    await prisma.payment.updateMany({
      where: { orderId, provider: "razorpay", providerId: razorpayOrderId },
      data: { status: "failed", failureReason: "Signature verification failed" },
    });
    return jsonError("Payment verification failed", 400);
  }

  const paymentInfo = await captureRazorpayPayment(razorpayPaymentId);
  if (paymentInfo.status !== "captured" && paymentInfo.status !== "authorized") {
    return jsonError(`Payment not captured (${paymentInfo.status})`, 400);
  }

  await markOrderPaid(order.id, "razorpay", razorpayPaymentId, { method: paymentInfo.method });

  return Response.json({ success: true });
}

export async function markOrderPaid(orderId, provider, providerRef, extra = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { orderId, provider },
      data: {
        status: "succeeded",
        providerId: providerRef || undefined,
        method: extra.method || null,
      },
    });
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: order.status === "pending" || order.status === "payment_pending" ? "processing" : order.status,
        paymentStatus: "paid",
        paymentProviderId: providerRef || order.paymentProviderId,
      },
    });
    if (order.userId) {
      await tx.notification.create({
        data: {
          userId: order.userId, orderId: order.id, type: "order",
          title: "Payment confirmed",
          body: `Payment for ${order.orderNumber} confirmed. We're packing your order.`,
        },
      });
    }
  });
}