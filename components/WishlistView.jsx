"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { formatPrice, getSalePrice } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";

export default function WishlistView({ items }) {
  const { toggleWishlist, addToCart } = useStore();

  if (items.length === 0) {
    return <EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart on any product to save it here." action={{ href: "/shop", label: "Explore products" }} />;
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black">My Wishlist</h1>
        <p className="text-sm text-slate-500">{items.length} saved products</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((w) => (
          <div key={w.id} className="card flex gap-4 p-4">
            <Link href={`/product/${w.product.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
              <Image 
                src={w.product.images?.[0]?.url || "https://images.unsplash.com/photo-1503602642458-232111445657?w=300"} 
                alt={w.product.name} 
                fill 
                className="object-cover"
                sizes="96px"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/product/${w.product.slug}`} className="line-clamp-1 font-semibold hover:text-brand-600">{w.product.name}</Link>
              <p className="text-sm font-bold">{formatPrice(getSalePrice(w.product))}</p>
              <div className="mt-auto flex gap-2">
                <button className="btn-primary btn-sm flex-1" onClick={() => addToCart({ productId: w.productId, quantity: 1, variantId: null, configuration: null, product: w.product })}>
                  <ShoppingCart className="h-3.5 w-3.5" /> Add
                </button>
                <button className="btn-outline btn-sm" onClick={() => toggleWishlist(w.productId)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}