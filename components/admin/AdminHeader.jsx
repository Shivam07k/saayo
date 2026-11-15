"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, LogOut, Bell, Search } from "lucide-react";
import { AdminSidebarMobile } from "./AdminSidebar";
import { formatPrice } from "@/lib/utils";

export default function AdminHeader({ user }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [focused, setFocused] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`);
      setResults(await res.json());
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onMouse = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setFocused(false); };
    document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, []);

  const go = (href) => { setQ(""); setResults(null); setFocused(false); router.push(href); };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const total = results ? (results.products?.length || 0) + (results.orders?.length || 0) + (results.customers?.length || 0) : 0;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6 dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="hidden text-lg font-black capitalize sm:block">Admin</h1>
        </div>

        <div ref={boxRef} className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input !pl-9"
            placeholder="Search products, orders, customers…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
          />
          {focused && results && total > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">Products</div>
              {results.products.map((p) => (
                <Link key={p.id} href={`/admin/products/${p.id}`} onClick={() => go(`/admin/products/${p.id}`)} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="truncate">{p.name}</span>
                  {!p.isActive && <span className="badge badge-warning">inactive</span>}
                </Link>
              ))}
              <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">Orders</div>
              {results.orders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} onClick={() => go(`/admin/orders/${o.id}`)} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="truncate">{o.orderNumber}</span>
                  <span className="ml-3 shrink-0 text-xs text-slate-400">{formatPrice(o.total)}</span>
                </Link>
              ))}
              <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">Customers</div>
              {results.customers.map((c) => (
                <Link key={c.id} href="/admin/customers" onClick={() => go("/admin/customers")} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="truncate">{c.name}</span>
                  <span className="ml-3 shrink-0 text-xs text-slate-400">{c.email}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden text-sm text-slate-500 lg:block dark:text-slate-400">
              {user.name} <span className="text-slate-300 dark:text-slate-600">·</span> {user.roleName}
            </span>
          )}
          <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <button className="btn-outline !px-3 !py-1.5 text-sm" onClick={logout}>
            <LogOut className="mr-1 inline h-4 w-4" /> Logout
          </button>
        </div>
      </header>
      {open && <AdminSidebarMobile user={user} onClose={() => setOpen(false)} />}
    </>
  );
}