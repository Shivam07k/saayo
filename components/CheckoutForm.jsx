"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Landmark, Banknote, Check, Loader2, Tag } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { computeShippingCost, computeTax } from "@/lib/shipping";
import { useStore, useToast } from "@/components/StoreProvider";
import { loadScript } from "@/lib/threeUtils";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

const METHODS = [
  { id: "stripe", label: "Card via Stripe", icon: CreditCard },
  { id: "razorpay", label: "UPI / Cards / Netbanking via Razorpay", icon: Landmark },
  { id: "cod", label: "Cash on Delivery", icon: Banknote },
];

export default function CheckoutForm({ user, addresses = [], coupons = [], settings }) {
  const router = useRouter();
  const { cart, ready, getItemPrice } = useStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [useSaved, setUseSaved] = useState(addresses.length > 0);
  const [shippingAddressId, setShippingAddressId] = useState(addresses[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState(null);
  const [form, setForm] = useState({
    email: user?.email || "",
    phone: user?.phone || "",
    fullName: user?.name || "",
    line1: "", line2: "", city: "", state: "", postalCode: "", country: "India",
  });

  const methods = useMemo(
    () => METHODS.filter((m) => m.id !== "cod" || settings?.codEnabled !== false),
    [settings?.codEnabled]
  );

  // Same math as computeOrderTotals() on the server, so the summary is the charge.
  const subtotal = useMemo(() => (cart || []).reduce((s, i) => s + Number(getItemPrice(i) || 0) * i.quantity, 0), [cart, getItemPrice]);
  const priced = useMemo(() => (cart || []).map((i) => ({ ...i, unitPrice: Number(getItemPrice(i) || 0) })), [cart, getItemPrice]);
  const discount = Math.min(couponDiscount, subtotal);
  const shipCost = appliedCoupon?.freeShipping ? 0 : computeShippingCost({ items: priced, subtotal, settings });
  const tax = computeTax({ items: priced, subtotal, discount, settings });
  const total = Math.max(0, subtotal - discount + shipCost + tax);

  useEffect(() => {
    if (ready && (!cart || cart.length === 0)) {
      router.push("/cart");
    }
  }, [cart, cart?.length, ready, router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your cart…
      </div>
    );
  }

  const applyCoupon = async () => {
    setCouponError(null);
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCouponError(data.error || "Invalid coupon");
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }
    setAppliedCoupon(data.coupon);
    setCouponDiscount(Number(data.discount || 0));
    toast(`Coupon ${data.coupon.code} applied`);
  };

  const validateAddress = () => {
    const required = ["email", "fullName", "line1", "city", "state", "postalCode"];
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email";
    for (const field of required) {
      if (field === "email") continue;
      if (!form[field]?.length || form[field].length < 2) return `Fill in ${field}`;
    }
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!cart || cart.length === 0) return;
    const addressError = useSaved ? null : validateAddress();
    if (addressError) {
      toast(addressError, "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: form.email,
        phone: form.phone,
        couponCode: appliedCoupon?.code || "",
        paymentMethod,
        notes: "",
        useSavedAddress: useSaved,
        shippingAddressId: useSaved ? shippingAddressId : null,
        shippingAddress: useSaved ? null : form,
        useBillingForShipping: true,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const order = await res.json();
      if (!res.ok) {
        toast(order.error || "Could not create order", "error");
        setLoading(false);
        return;
      }

      if (paymentMethod === "cod") {
        // full navigation: the server already emptied the cart, so remount the store
        window.location.assign(`/checkout/success?order=${order.orderNumber}`);
        return;
      }

      const pay = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, provider: paymentMethod }),
      });
      const payment = await pay.json();
      if (!pay.ok) {
        toast(payment.error || "Payment setup failed", "error");
        router.push(`/checkout/failed?order=${order.orderNumber}`);
        return;
      }

      if (paymentMethod === "stripe" && payment.url) {
        window.location.href = payment.url;
        return;
      }

      if (paymentMethod === "razorpay") {
        await openRazorpay(payment, order, payload, toast, router);
      }
    } catch (err) {
      console.error(err);
      toast("Checkout failed, please try again", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-lg font-bold">Your cart is empty</p>
        <Link href="/shop" className="btn-primary">Browse products</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* contact */}
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold">Contact details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98XXX XXXXX" />
            </div>
          </div>
        </section>

        {/* address */}
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Delivery address</h2>
            {addresses.length > 0 && (
              <button type="button" onClick={() => setUseSaved((s) => !s)} className="btn-outline btn-sm">
                {useSaved ? "Enter new address" : "Use saved address"}
              </button>
            )}
          </div>
          {useSaved && addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.map((a) => (
                <label key={a.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4", shippingAddressId === a.id ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/30" : "border-slate-200 dark:border-slate-700")}>
                  <input type="radio" name="addr" className="mt-1" checked={shippingAddressId === a.id} onChange={() => setShippingAddressId(a.id)} />
                  <div className="text-sm">
                    <p className="font-semibold">{a.fullName} · {a.label && <span className="text-xs text-slate-500">{a.label}</span>}</p>
                    <p className="text-slate-500">{a.line1}, {a.line2 && `${a.line2}, `}{a.city}, {a.state} {a.postalCode}, {a.country}</p>
                    <p className="text-slate-400">{a.phone}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address line 1</label>
                <PlaceAutocomplete
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  onPlace={(a) => setForm((f) => ({ ...f, line1: a.line1 || a.formattedAddress || f.line1, line2: a.line2 || f.line2, city: a.city || f.city, state: a.state || f.state, postalCode: a.postalCode || f.postalCode, country: a.country || f.country }))}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address line 2 (optional)</label>
                <input className="input" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
              </div>
              <div>
                <label className="label">Postal code</label>
                <input className="input" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
              </div>
              <div>
                <label className="label">Country</label>
                <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
          )}
        </section>

        {/* coupon */}
        <section className="card p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Tag className="h-4 w-4" /> Coupon</h2>
          <div className="flex gap-2">
            <input className="input" placeholder="e.g. WELCOME10" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
            <button type="button" onClick={applyCoupon} className="btn-outline shrink-0">Apply</button>
          </div>
          {couponError && <p className="mt-2 text-sm text-red-500">{couponError}</p>}
          {appliedCoupon && <p className="mt-2 text-sm text-emerald-600">✓ {appliedCoupon.code} applied ({discountPercent(appliedCoupon, subtotal)}off)</p>}
          {(!appliedCoupon || coupons.length > 0) && coupons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {coupons.filter((c) => !appliedCoupon || c.code !== appliedCoupon.code).slice(0, 3).map((c) => (
                <button key={c.code} type="button" onClick={() => setCouponCode(c.code)} className="badge bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300">
                  {c.code}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* payment */}
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold">Payment method</h2>
          <div className="space-y-2">
            {methods.map((m) => (
              <label key={m.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-4", paymentMethod === m.id ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/30" : "border-slate-200 dark:border-slate-700")}>
                <input type="radio" className="mt-0" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} />
                <m.icon className="h-5 w-5 text-brand-600" />
                <div>
                  <p className="text-sm font-semibold">{m.label}</p>
                  {m.id === "cod" && <p className="text-xs text-slate-500">Pay with cash when your order arrives</p>}
                </div>
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* summary */}
      {settings?.checkoutShowOrderSummary !== false && (
      <aside className="card h-fit p-6 lg:sticky lg:top-28">
        <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{item.quantity}</span>
              <p className="line-clamp-1 flex-1">{item.product.name}</p>
              <span className="font-semibold">{formatPrice(getItemPrice(item) * item.quantity)}</span>
            </div>
          ))}
        </div>
        <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
          <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          {discount > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd>-{formatPrice(discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{shipCost === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : formatPrice(shipCost)}</dd></div>
          {tax > 0 && <div className="flex justify-between"><dt className="text-slate-500">Tax</dt><dd>{formatPrice(tax)}</dd></div>}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black dark:border-slate-800"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
        <button className="btn-primary mt-5 w-full py-3 disabled:opacity-50" disabled={loading}>
          {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>) : (<><Check className="h-4 w-4" /> Place Order · {formatPrice(total)}</>)}
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">By placing your order you agree to our Terms & Conditions</p>
      </aside>
      )}
    </form>
  );
}

function discountPercent(coupon, subtotal) {
  if (coupon.type === "percent") {
    const value = Math.min(Number(coupon.value), 100);
    return `${value}% `;
  }
  return `₹${Number(coupon.value)} `;
}

async function openRazorpay(payment, order, payload, toast, router) {
  try {
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    const options = {
      key: payment.key,
      amount: payment.amountPaise,
      currency: "INR",
      name: "Saayo Tees",
      description: `Order ${order.orderNumber}`,
      order_id: payment.razorpayOrderId,
      prefill: { email: payload.email, name: payload.shippingAddress?.fullName, contact: payload.phone },
      handler: async (response) => {
        const verify = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        const v = await verify.json();
        if (v.success) window.location.assign(`/checkout/success?order=${order.orderNumber}`);
        else router.push(`/checkout/failed?order=${order.orderNumber}`);
      },
      modal: { ondismiss: () => router.push(`/checkout/failed?order=${order.orderNumber}`) },
    };
    const instance = new window.Razorpay(options);
    instance.open();
  } catch (e) {
    console.error(e);
    toast("Could not open Razorpay", "error");
    router.push(`/checkout/failed?order=${order.orderNumber}`);
  }
}