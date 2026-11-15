import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {item.href ? (
            <>
              <Link href={item.href} className="flex items-center gap-1 hover:text-brand-600">
                {i === 0 && <Home className="h-3.5 w-3.5" />}
                {item.label}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          ) : (
            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}