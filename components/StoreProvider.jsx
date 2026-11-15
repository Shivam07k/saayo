"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const StoreContext = createContext(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useCart() {
  return useStore().cart;
}

export function useToast() {
  return useStore().toast;
}

// Simple in-memory cache for auth/cart data so repeated mount/re-renders
// don't hit the server on every single render. Keys expire after 5 minutes.
const authCache = { expires: 0, data: null };
const cartCache = { expires: 0, data: null };

function isCacheValid(cache) {
  return cache && Date.now() < cache.expires;
}

export default function StoreProvider({ children, initialCart = [], initialWishlistCount = 0 }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(initialCart);
  const [wishlistCount, setWishlistCount] = useState(initialWishlistCount);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  // Fetch auth + cart once, cache results, skip re-fetch on re-renders
  useEffect(() => {
    let cancelled = false;
    ;(async () => {
      try {
        // Use cached data if still valid; otherwise fetch fresh
        const authValid = isCacheValid(authCache);
        const cartValid = isCacheValid(cartCache);

        const [meRes, cartRes] = await Promise.all([
          authValid
            ? null
            : fetch("/api/auth/me", { cache: "no-store" }),
          cartValid
            ? null
            : fetch("/api/cart", { cache: "no-store" }),
        ]);

        if (cancelled) return;

        // Process auth if we fetched or have valid cache
        if (!authValid || (meRes && meRes.ok)) {
          const authData = authValid ? authCache.data : meRes ? await meRes.json() : {};
          if (!authValid) {
            authCache.data = authData;
            authCache.expires = Date.now() + 5 * 60 * 1000; // 5 min
          }
          if (authData.user) setUser(authData.user);
        }

        // Process cart if we fetched or have valid cache
        if (!cartValid || (cartRes && cartRes.ok)) {
          const cartData = cartValid ? cartCache.data : cartRes ? await cartRes.json() : {};
          if (!cartValid) {
            cartCache.data = cartData;
            cartCache.expires = Date.now() + 5 * 60 * 1000; // 5 min
          }
          setCart(cartData.items || []);
        }
      } catch {
        // Session/cart refresh is best-effort; the store stays usable logged-out.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // Empty deps - runs once per component tree mount

  const toast = useCallback((message, type = "success") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const postToCart = useCallback(async (payload) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Could not add to cart" };
    cartCache.data = data; // keep the mount-time cache from going stale
    return { ok: true, items: data.items || [] };
  }, []);

  // Cart mutations update the UI first, then sync. Server response is the source
  // of truth; a failed request restores the previous cart.
  const mutateCart = useCallback(async (nextItems, request, errorMessage) => {
    const prev = cart;
    setCart(nextItems);
    const res = await request();
    if (!res.ok) {
      setCart(prev);
      toast(errorMessage, "error");
      return;
    }
    const data = await res.json();
    cartCache.data = data;
    setCart(data.items || []);
  }, [cart, toast]);

  // Optimistic add: show the line and open the drawer before the network call.
  const addToCart = useCallback(async (payload) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic = payload.product
      ? [{
          id: tempId,
          productId: payload.productId,
          variantId: payload.variantId || null,
          quantity: payload.quantity || 1,
          configuration: payload.configuration || null,
          product: payload.product,
          variant: payload.variant || null,
        }]
      : null;

    if (optimistic) {
      setCart((prev) => [...prev, ...optimistic]);
      setCartOpen(true);
      toast("Added to cart", "success");
    }

    const r = await postToCart(payload);
    if (r.error) {
      if (optimistic) setCart((prev) => prev.filter((i) => i.id !== tempId));
      toast(r.error, "error");
      return false;
    }
    setCart(r.items);
    if (!optimistic) {
      setCartOpen(true);
      toast("Added to cart", "success");
    }
    return true;
  }, [postToCart, toast]);

  const buyNow = useCallback(async (payload) => {
    const r = await postToCart(payload);
    if (r.error) {
      toast(r.error, "error");
      return false;
    }
    setCart(r.items);
    return true;
  }, [postToCart, toast]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    const qty = Math.max(1, quantity);
    await mutateCart(
      cart.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)),
      () => fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: qty }),
      }),
      "Could not update quantity"
    );
  }, [cart, mutateCart]);

  const removeItem = useCallback(async (itemId) => {
    await mutateCart(
      cart.filter((i) => i.id !== itemId),
      () => fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" }),
      "Could not remove item"
    );
  }, [cart, mutateCart]);

  const clearCart = useCallback(async () => {
    await mutateCart([], () => fetch("/api/cart?clear=1", { method: "DELETE" }), "Could not clear cart");
  }, [mutateCart]);

  const toggleWishlist = useCallback(async (productId) => {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(res.status === 401 ? "Please login to save items" : data.error || "Could not update wishlist", "error");
      return false;
    }
    setWishlistCount((c) => Math.max(0, (c || 0) + (data.inWishlist ? 1 : -1)));
    toast(data.inWishlist ? "Saved to wishlist" : "Removed from wishlist", "success");
    return true;
  }, [toast]);

  const cartCount = useMemo(() => (cart || []).reduce((s, i) => s + i.quantity, 0), [cart]);
  // Mirrors getUnitPrice() in lib/cart.js so the displayed total equals the charge.
  const getItemPrice = useCallback((item) => {
    const p = item.product || {};
    const base = p.isFlashSale && p.flashSalePrice ? p.flashSalePrice : p.salePrice || p.regularPrice;
    return Math.max(0, Number(base || 0) + Number(item.configuration?.priceDelta || 0));
  }, []);

  const value = useMemo(
    () => ({
      user, cart, ready, cartCount, cartOpen, openCart, closeCart,
      addToCart, buyNow, updateQuantity, removeItem, clearCart,
      wishlistCount, toggleWishlist, toast, getItemPrice,
    }),
    [user, cart, ready, cartCount, cartOpen, openCart, closeCart, addToCart, buyNow, updateQuantity, removeItem, clearCart, wishlistCount, toggleWishlist, toast, getItemPrice]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto animate-fade-in rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg",
              t.type === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}