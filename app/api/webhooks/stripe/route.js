import { prisma } from "@/lib/db";
import { verifyStripeWebhook } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  let event;
  try {
    event = verifyStripeWebhook(payload, signature);
  } catch (e) {
    return Response.json({ error: `Webhook verification failed: ${e.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const order = await prisma.order.findUnique({
          where: { id: session.metadata?.orderId || undefined },
        });
        if (order) {
          await prisma.$transaction(async (tx) => {
            await tx.payment.updateMany({
              where: { orderId: order.id, provider: "stripe" },
              data: { status: "succeeded", providerId: session.payment_intent || session.id },
            });
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: "processing",
                paymentStatus: "paid",
                paymentProviderId: session.payment_intent || session.id,
              },
            });
            if (order.userId) {
              await tx.notification.create({
                data: {
                  userId: order.userId, orderId: order.id, type: "order",
                  title: "Payment confirmed",
                  body: `Payment for ${order.orderNumber} confirmed via Stripe.`,
                },
              });
            }
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        await prisma.payment.updateMany({
          where: { providerId: intent.id, provider: "stripe" },
          data: { status: "failed", failureReason: intent.last_payment_error?.message || null },
        });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        await prisma.payment.updateMany({
          where: { providerId: charge.payment_intent, provider: "stripe" },
          data: { status: "refunded" },
        });
        const payment = await prisma.payment.findFirst({ where: { providerId: charge.payment_intent } });
        if (payment) {
          await prisma.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "refunded" } });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Webhook handler failed", e);
    return Response.json({ error: "Handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}

export async function GET() {
  return Response.json({ message: "Stripe webhook endpoint (POST only)" });
}