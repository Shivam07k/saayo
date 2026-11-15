import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

export default function CategoryMenu({ categories = [] }) {
  if (!categories.length) return null;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {categories.map((c) => (
        <Link key={c.id} href={`/category/${c.slug}`} className="card group overflow-hidden text-center transition hover:-translate-y-1 hover:shadow-lg">
          <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
            {c.image ? (
              <Image src={c.image} alt={c.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl font-black text-slate-300 dark:text-slate-700">{c.name[0]}</div>
            )}
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent">
              <span className="mb-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900">
                {c.name} <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}