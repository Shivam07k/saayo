import Stripe from "stripe";
import Razorpay from "razorpay";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

export const CURRENCY = process.env.CURRENCY || "INR";
const STRIPE_CURRENCY = process.env.STRIPE_PRICE_CURRENCY || (CURRENCY === "INR" ? "inr" : "usd");

export function stripeAvailable() {
  return Boolean(stripe);
}

export function razorpayAvailable() {
  return Boolean(razorpay);
}

export function razorpayPublicKey() {
  return process.env.RAZORPAY_KEY_ID || "";
}

export async function createStripePaymentIntent({ amount, orderNumber, email, metadata = {} }) {
  if (!stripe) throw new Error("Stripe is not configured");
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: STRIPE_CURRENCY,
    receipt_email: email,
    automatic_payment_methods: { enabled: true },
    metadata: { orderNumber, ...metadata },
  });
  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}

export async function createRazorpayOrder({ amount, orderNumber, customer }) {
  if (!razorpay) throw new Error("Razorpay is not configured");
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: orderNumber,
    notes: { orderNumber, customer },
  });
  return { orderId: order.id, amount: order.amount / 100, currency: order.currency };
}

export async function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!razorpay) throw new Error("Razorpay is not configured");
  const crypto = await import("crypto");
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

export async function captureRazorpayPayment(paymentId) {
  if (!razorpay) throw new Error("Razorpay is not configured");
  const payment = await razorpay.payments.fetch(paymentId);
  return { status: payment.status, method: payment.method, id: payment.id };
}

export async function verifyStripeWebhook(payload, signature) {
  if (!stripe) throw new Error("Stripe is not configured");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function createStripeRefund({ paymentIntentId, amount, reason }) {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.round(amount * 100) || undefined,
    reason: reason || "requested_by_customer",
  });
}

export async function processCodOrder({ orderId, amount, currency }) {
  return {
    provider: "cod",
    providerId: `COD-${orderId}`,
    amount,
    currency,
    status: "pending",
    method: "cod",
  };
}