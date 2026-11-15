"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const { cart, cartCount, cartOpen, closeCart, updateQuantity, removeItem, getItemPrice } = useStore();
  const subtotal = (cart || []).reduce((s, i) => s + Number(getItemPrice(i) || 0) * i.quantity, 0);

  return (
    <>
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-fade-in flex-col bg-white shadow-2xl dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="text-lg font-bold">
                Your Cart <span className="text-sm font-medium text-slate-500">({cartCount})</span>
              </h2>
              <button className="btn-ghost rounded-full p-2" onClick={closeCart} aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!cart || cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                <p className="font-medium">Your cart is empty</p>
                <p className="text-sm text-slate-500">Browse products and try the 3D viewer before you buy.</p>
                <Link href="/shop" onClick={closeCart} className="btn-primary mt-2">Start Shopping</Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {cart.map((item) => (
                    <div key={item.id} className="mb-4 flex gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                      <Link href={`/product/${item.product.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800" onClick={closeCart}>
                        <Image 
                          src={item.product.images?.[0]?.url || "https://images.unsplash.com/photo-1503602642458-232111445657?w=300"} 
                          alt={item.product.name} 
                          fill 
                          className="object-cover"
                          sizes="80px"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/product/${item.product.slug}`} onClick={closeCart} className="line-clamp-2 text-sm font-semibold hover:text-brand-600">
                          {item.product.name}
                        </Link>
                        {item.variant && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {Object.entries(item.variant.options || {}).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        )}
                        {item.configuration && item.configuration.selectedOptions && (
                          <p className="text-xs text-slate-500">
                            {Object.entries(item.configuration.selectedOptions).filter(([, v]) => v).map(([k, v]) => `${v}`).join(" · ")}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center justify-between">
                          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
                            <button className="px-2 py-1.5" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button className="px-2 py-1.5" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{formatPrice(getItemPrice(item))}</span>
                            <button className="text-red-500 hover:text-red-600" onClick={() => removeItem(item.id)} aria-label="Remove">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 p-5 dark:border-slate-800">
                  <div className="mb-1 flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mb-4 text-xs text-slate-500">Shipping and taxes calculated at checkout.</p>
                  <Link href="/checkout" onClick={closeCart} className="btn-primary w-full">Proceed to Checkout</Link>
                  <Link href="/cart" onClick={closeCart} className="btn-outline mt-2 w-full">View Cart</Link>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}