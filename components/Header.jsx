"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Shirt, ChevronDown, Heart, Menu, Moon, PackageCheck, Search, ShoppingBag, Sun, User, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, useStore } from "@/components/StoreProvider";
import { PERMISSIONS } from "@/lib/permissions";
import SearchBar from "@/components/SearchBar";
import CartDrawer from "@/components/CartDrawer";

export default function Header({ categories = [], settings = {} }) {
  const { user, cartCount, wishlistCount, toggleWishlist, toast } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem("theme");
    const darkMode = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(darkMode);
    root.classList.toggle("dark", darkMode);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <>
      {settings.announcementEnabled && settings.announcementText && (
        <div className="bg-slate-900 text-center text-xs font-medium text-white sm:text-sm dark:bg-slate-800">
          <div className="container-x flex items-center justify-center gap-2 py-2">
            {settings.announcementLink ? (
              <Link href={settings.announcementLink} className="hover:underline">{settings.announcementText}</Link>
            ) : (
              <span>{settings.announcementText}</span>
            )}
          </div>
        </div>
      )}
      <header className={cn("sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90", scrolled && "shadow-sm")}>
        <div className="container-x">
          {/* top row */}
          <div className="flex h-16 items-center gap-3 sm:gap-5">
            <button className="btn-ghost px-2 sm:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight">
              {settings.logoUrl ? (
                <Image src={settings.logoUrl} alt={settings.storeName || "Store"} height={40} className="w-auto max-w-[140px] object-contain" />
              ) : (
                <>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <Shirt className="h-5 w-5" />
                  </span>
                  <span className="hidden text-xl text-slate-900 sm:block dark:text-white">{settings.storeName || "My Store"}</span>
                </>
              )}
            </Link>

            <div className="hidden flex-1 md:block">
              <SearchBar />
            </div>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
              <button className="btn-ghost rounded-full p-2.5" aria-label="Toggle dark mode" onClick={() => setDark((d) => !d)}>
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <div className="relative" ref={accountRef}>
                <button className="btn-ghost rounded-full p-2.5" aria-label="Account" onClick={() => setAccountOpen((o) => !o)}>
                  <User className="h-5 w-5" />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-11 w-52 animate-fade-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    {user ? (
                      <>
                        <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                          <p className="truncate text-sm font-semibold">{user.name}</p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                        {[
                          ["/account", "My Account"],
                          ["/account/orders", "My Orders"],
                          ["/account/wishlist", "Wishlist"],
                          ["/account/addresses", "Addresses"],
                          ["/account/profile", "Profile"],
                        ].map(([href, label]) => (
                          <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                            {label}
                          </Link>
                        ))}
                        {user?.permissions?.some((p) => Object.values(PERMISSIONS).includes(p)) && (
                          <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40">
                            Admin Panel
                          </Link>
                        )}
                        <button onClick={logout} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                          Sign in
                        </Link>
                        <Link href="/register" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                          Create account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button className="btn-ghost relative rounded-full p-2.5" aria-label="Wishlist"
                onClick={() => user ? router.push("/account/wishlist") : toast("Please login to view wishlist", "error")}>
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <CartButton />
            </div>
          </div>

          {/* search on mobile */}
          <div className="pb-3 md:hidden">
            <SearchBar />
          </div>
        </div>

        {/* category nav */}
        <nav className="hidden border-t border-slate-100 lg:block dark:border-slate-800">
          <div className="container-x flex items-center gap-1 overflow-x-auto no-scrollbar text-sm">
            <Link href="/shop" className="flex items-center gap-1 whitespace-nowrap px-3 py-2.5 font-semibold text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-900">
              <PackageCheck className="h-4 w-4" /> Shop All
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="whitespace-nowrap px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-brand-400">
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] animate-fade-in flex-col bg-white shadow-2xl dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <span className="text-lg font-bold">Menu</span>
              <button className="btn-ghost rounded-full p-2" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Link href="/shop" className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2.5 font-semibold hover:bg-slate-100 dark:hover:bg-slate-900">
                <PackageCheck className="h-4 w-4" /> Shop All
              </Link>
              {categories.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900">
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" /> {c.name}
                </Link>
              ))}
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                {["About", "Contact", "FAQ", "Privacy Policy", "Terms & Conditions", "Return & Refund Policy"].map((label) => (
                  <Link key={label} href={`/${label.toLowerCase().replace(/[\s&]+/g, "-").replace(/-([a-z])/g, (_, c) => c)}`}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </>
  );
}

function CartButton() {
  const { cartCount, openCart } = useStore();
  return (
    <button className="btn-ghost relative rounded-full p-2.5" aria-label="Open cart" onClick={openCart}>
      <ShoppingBag className="h-5 w-5" />
      {cartCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
          {cartCount}
        </span>
      )}
    </button>
  );
}