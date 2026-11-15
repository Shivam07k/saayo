"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function getPageHref(base, params, page) {
  const p = new URLSearchParams(params.toString());
  p.set("page", String(page));
  return `${base}?${p.toString()}`;
}

export default function Pagination({ base = "/shop", pagination }) {
  const router = useRouter();
  const sp = useSearchParams();
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, hasNext, hasPrev, count } = pagination;
  const pageNumbers = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <nav className="mt-10 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1">
        <button disabled={!hasPrev} onClick={() => router.push(getPageHref(base, sp, page - 1))}
          className="btn-outline btn-sm rounded-lg disabled:opacity-40" aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageNumbers.map((n) => (
          <button key={n} onClick={() => router.push(getPageHref(base, sp, n))}
            className={cn("h-9 min-w-9 rounded-lg px-2 text-sm font-semibold",
              n === page ? "bg-brand-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}>
            {n}
          </button>
        ))}
        <button disabled={!hasNext} onClick={() => router.push(getPageHref(base, sp, page + 1))}
          className="btn-outline btn-sm rounded-lg disabled:opacity-40" aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-slate-500">{count} products</p>
    </nav>
  );
}