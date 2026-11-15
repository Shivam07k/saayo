"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar({ defaultValue = "" }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  const onSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <form onSubmit={onSubmit} className="relative flex-1">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tees, polos, oversized fits…"
        aria-label="Search products"
        className="input pr-10"
      />
      <button type="submit" aria-label="Search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600">
        <Search className="h-4.5 w-4.5" />
      </button>
    </form>
  );
}