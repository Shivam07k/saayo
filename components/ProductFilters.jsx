"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
  ["rating", "Top Rated"],
  ["popular", "Best Selling"],
];

export default function ProductFilters({ categories = [], brands = [] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const selected = {
    sort: sp.get("sort") || "",
    sale: sp.get("sale") === "1",
    category: sp.get("category") || "",
    brand: sp.get("brand") || "",
    minPrice: sp.get("minPrice") || "",
    maxPrice: sp.get("maxPrice") || "",
    available: sp.get("available") === "1",
  };

  const update = (patch, resetPage = true) => {
    const params = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === "" || v === false || v === null || v === undefined) params.delete(k);
      else params.set(k, String(v));
    });
    if (resetPage) params.delete("page");
    router.push(`/shop?${params.toString()}`);
  };

  const clearAll = () => router.push("/shop");
  const hasFilters = Object.entries(selected).some(([, v]) => v !== "" && v !== false);

  const filterBody = (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-bold">Sort by</h3>
        <div className="space-y-1">
          {SORTS.map(([key, label]) => (
            <button key={key} onClick={() => update({ sort: key === "featured" ? "" : key, page: undefined })}
              className={cn("block w-full rounded-lg px-3 py-2 text-left text-sm", selected.sort === key ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "hover:bg-slate-100 dark:hover:bg-slate-900")}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold">Category</h3>
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {categories.map((c) => (
            <button key={c.id} onClick={() => update({ category: selected.category === c.slug ? "" : c.slug })}
              className={cn("block w-full rounded-lg px-3 py-1.5 text-left text-sm", selected.category === c.slug ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "hover:bg-slate-100 dark:hover:bg-slate-900")}>
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold">Brand</h3>
        <div className="max-h-44 space-y-1 overflow-y-auto">
          {brands.map((b) => (
            <button key={b.id} onClick={() => update({ brand: selected.brand === b.slug ? "" : b.slug })}
              className={cn("block w-full rounded-lg px-3 py-1.5 text-left text-sm", selected.brand === b.slug ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "hover:bg-slate-100 dark:hover:bg-slate-900")}>
              {b.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold">Price range</h3>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={selected.minPrice} onChange={(e) => update({ minPrice: e.target.value })} className="input py-1.5 text-sm" />
          <span>-</span>
          <input type="number" placeholder="Max" value={selected.maxPrice} onChange={(e) => update({ maxPrice: e.target.value })} className="input py-1.5 text-sm" />
        </div>
      </section>

      <section className="flex items-center gap-2">
        <button onClick={() => update({ available: !selected.available })}
          className={cn("h-4 w-4 rounded border", selected.available ? "border-brand-600 bg-brand-600" : "border-slate-300")} aria-label="In stock only" />
        <label className="text-sm">In stock only</label>
      </section>

      <section className="flex items-center gap-2">
        <button onClick={() => update({ sale: !selected.sale })}
          className={cn("h-4 w-4 rounded border", selected.sale ? "border-brand-600 bg-brand-600" : "border-slate-300")} aria-label="On sale only" />
        <label className="text-sm">On sale only</label>
      </section>

      {hasFilters && (
        <button onClick={clearAll} className="btn-outline w-full text-sm">Clear all filters</button>
      )}
    </div>
  );

  return (
    <>
      <button className="btn-outline lg:hidden" onClick={() => setOpen((o) => !o)}>
        <SlidersHorizontal className="h-4 w-4" /> Filters {hasFilters && <span className="h-2 w-2 rounded-full bg-brand-600" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-white p-5 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button className="btn-ghost rounded-full p-2" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            {filterBody}
          </div>
        </div>
      )}

      <aside className="hidden w-60 shrink-0 lg:block sticky top-28 self-start max-h-[80vh] overflow-y-auto pr-2">{filterBody}</aside>
    </>
  );
}