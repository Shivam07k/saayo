import { Suspense } from "react";
import { getPublicProducts } from "@/lib/queries";
import { toPlain } from "@/lib/utils";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { prisma } from "@/lib/db";

export const metadata = { title: "Search" };
export const revalidate = 300;

export default async function SearchPage({ searchParams }) {
  const q = searchParams?.q || "";
  const [{ products, pagination, count }, categories, brands] = await Promise.all([
    getPublicProducts({ searchParams: { ...searchParams, q } }),
    prisma.category.findMany({ where: { isActive: true } }),
    prisma.brand.findMany({ where: { isActive: true } }),
  ]);

  return (
    <div className="container-x py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl">
          {q ? `Results for “${q}”` : "Search products"}
        </h1>
        <p className="text-sm text-slate-500">{count} products found</p>
      </header>

      <div className="flex gap-6">
        <Suspense fallback={null}>
          <ProductFilters categories={categories} brands={brands} />
        </Suspense>
        <div className="flex-1">
          {products.length === 0 ? (
            <EmptyState
              title="Nothing matched your search"
              description="Try different keywords, or browse the full catalog."
              action={{ href: "/shop", label: "Browse all products" }}
            />
          ) : (
            <>
              <ProductGrid products={toPlain(products)} columns={3} />
              <Pagination base="/search" pagination={pagination} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}