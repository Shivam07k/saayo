"use client";

import Link from "next/link";
import Image from "next/image";
import { Box, Heart, ShoppingBag } from "lucide-react";
import { formatPrice, getDiscountPercent, getSalePrice } from "@/lib/utils";
import RatingStars from "@/components/RatingStars";
import { useStore } from "@/components/StoreProvider";

export default function ProductCard({ product, showRating = true }) {
  const { addToCart, toggleWishlist, toast } = useStore();
  const sale = getSalePrice(product);
  const regular = Number(product.regularPrice || 0);
  const hasDiscount = sale < regular;
  const image = product.images?.[0]?.url;

  const onWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.id) { toast("Product unavailable", "error"); return; }
    toggleWishlist(product.id);
  };

  const onAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.id) { toast("Product unavailable", "error"); return; }
    addToCart({ productId: product.id, quantity: 1, product });
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group card relative flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
        {image ? (
          <Image src={image} alt={product.name} fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300"><Box className="h-16 w-16" /></div>
        )}

        {product.models?.length > 0 && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-white">
            <Box className="h-3 w-3" /> 3D
          </span>
        )}
        {hasDiscount && (
          <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-[11px] font-bold text-white">
            -{getDiscountPercent(product)}%
          </span>
        )}
        {product.isFlashSale && product.flashSalePrice && (
          <span className="absolute left-2 top-9 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">FLASH</span>
        )}
        
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <button
            className="rounded-full bg-white p-2 shadow transition-opacity dark:bg-slate-900 sm:opacity-0 sm:group-hover:opacity-100"
            onClick={onWishlist} aria-label="Add to wishlist">
            <Heart className="h-4 w-4 text-red-500" />
          </button>
          <button
            className="rounded-full bg-brand-600 p-2 text-white shadow transition-opacity dark:bg-brand-500 sm:opacity-0 sm:group-hover:opacity-100"
            onClick={onAddToCart} aria-label="Add to cart">
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {product.brand && <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.brand.name}</p>}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
        {showRating && product.ratingCount > 0 && (
          <RatingStars rating={Number(product.ratingAvg || 0)} count={product.ratingCount} size="h-3.5 w-3.5" />
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-lg font-extrabold">{formatPrice(sale)}</span>
          {hasDiscount && <span className="text-sm text-slate-400 line-through">{formatPrice(regular)}</span>}
        </div>
      </div>
    </Link>
  );
}