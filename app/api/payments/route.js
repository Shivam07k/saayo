import { prisma } from "@/lib/db";
import { getSessionUser, jsonError } from "@/lib/auth";
import { getStoreSettings } from "@/lib/storeSettings";
import {
  createStripePaymentIntent, createRazorpayOrder, razorpayPublicKey, stripeAvailable, razorpayAvailable,
} from "@/lib/payments";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    const settings = await getStoreSettings();
    if (!settings.checkoutGuestEnabled) return jsonError("Please login to complete checkout", 401);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { orderId, provider } = data;
  if (!orderId || !["stripe", "razorpay"].includes(provider)) return jsonError("Invalid payment request", 400);

  // Logged-in buyers can only pay their own orders; guests can only pay guest orders.
  const order = await prisma.order.findFirst({
    where: user ? { id: orderId, userId: user.id } : { id: orderId, userId: null },
  });
  if (!order) return jsonError("Order not found", 404);
  if (order.paymentStatus === "paid") return jsonError("Order already paid", 400);

  if (provider === "stripe") {
    if (!stripeAvailable()) return jsonError("Stripe is not configured", 503);
    const { url, sessionId } = await createStripeCheckout(order);
    await prisma.payment.create({
      data: {
        orderId: order.id, provider: "stripe", providerId: sessionId,
        amount: order.total, currency: "INR", status: "pending",
      },
    });
    return Response.json({ url, provider }, { status: 201 });
  }

  if (provider === "razorpay") {
    if (!razorpayAvailable()) return jsonError("Razorpay is not configured", 503);
    const rzp = await createRazorpayOrder({ amount: order.total, orderNumber: order.orderNumber, customer: user?.id || order.email });
    await prisma.payment.create({
      data: {
        orderId: order.id, provider: "razorpay", providerId: rzp.orderId,
        amount: order.total, currency: "INR", status: "pending",
      },
    });
    return Response.json({
      provider,
      key: razorpayPublicKey(),
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzp.orderId,
      amount: rzp.amount,
      amountPaise: Math.round(rzp.amount * 100),
    }, { status: 201 });
  }

  return jsonError("Unsupported provider", 400);
}

async function createStripeCheckout(order) {
  const Stripe = await import("stripe").then((m) => m.default);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const price = Math.round(Number(order.total) * 100);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: { name: `Saayo order ${order.orderNumber}` },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    customer_email: order.email,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    success_url: `${process.env.APP_URL || "http://localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${order.orderNumber}`,
    cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/checkout/failed?order=${order.orderNumber}`,
  });
  return { url: session.url, sessionId: session.id };
}