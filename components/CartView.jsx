"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { formatPrice } from "@/lib/utils";

export default function CartView() {
  const { cart, updateQuantity, removeItem, clearCart, getItemPrice } = useStore();
  const router = useRouter();
  const subtotal = (cart || []).reduce((s, i) => s + Number(getItemPrice(i) || 0) * i.quantity, 0);

  if (!cart || cart.length === 0) {
    return (
      <div className="container-x py-16">
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <ShoppingBag className="h-14 w-14 text-slate-300 dark:text-slate-700" />
          <h1 className="text-2xl font-black">Your cart is empty</h1>
          <p className="text-sm text-slate-500">Try browsing products with the 3D viewer — you can inspect, configure and add them here.</p>
          <Link href="/shop" className="btn-primary mt-2">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-black sm:text-3xl">Shopping Cart</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cart.map((item) => {
            const price = Number(getItemPrice(item) || 0);
            return (
              <div key={item.id} className="card flex gap-4 p-4">
                <Link href={`/product/${item.product.slug}`} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Image 
                    src={item.product.images?.[0]?.url || "https://images.unsplash.com/photo-1503602642458-232111445657?w=300"} 
                    alt={item.product.name} 
                    fill 
                    className="object-cover"
                    sizes="112px"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/product/${item.product.slug}`} className="line-clamp-1 font-semibold hover:text-brand-600">{item.product.name}</Link>
                      {item.variant && (
                        <p className="text-xs text-slate-500">{Object.entries(item.variant.options || {}).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
                      )}
                      {item.configuration?.selectedOptions && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {Object.values(item.configuration.selectedOptions).filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-bold">{formatPrice(price)}</p>
                    </div>
                    <button className="btn-ghost rounded-full p-1.5 text-red-500" onClick={() => removeItem(item.id)} aria-label="Remove item">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
                      <button className="px-2.5 py-1.5" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      <button className="px-2.5 py-1.5" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <span className="text-sm font-bold text-brand-700 dark:text-brand-400">{formatPrice(price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between">
            <button className="btn-ghost text-sm text-slate-500" onClick={clearCart}>Clear cart</button>
            <button className="btn-ghost text-sm" onClick={() => router.push("/shop")}>Continue shopping</button>
          </div>
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Items</dt><dd>{cart.length}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-semibold">{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd className="text-slate-500">Calculated at checkout</dd></div>
          </dl>
          <Link href="/checkout" className="btn-primary mt-5 w-full py-3">Checkout</Link>
          <p className="mt-3 text-center text-xs text-slate-400">Secure payments via Stripe, Razorpay & COD</p>
        </aside>
      </div>
    </div>
  );
}