import { Suspense } from "react";
import { getPublicProducts } from "@/lib/queries";
import { toPlain } from "@/lib/utils";
import { prisma } from "@/lib/db";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export const metadata = { title: "Shop" };
export const revalidate = 300;

export default async function ShopPage({ searchParams }) {
  const [{ products, pagination, count }, categories, brands] = await Promise.all([
    getPublicProducts({ searchParams }),
    prisma.category.findMany({ where: { isActive: true } }),
    prisma.brand.findMany({ where: { isActive: true } }),
  ]);

  const sortLabel = {
    newest: "Newest", "price-asc": "Price: Low to High", "price-desc": "Price: High to Low",
    rating: "Top Rated", popular: "Best Selling",
  }[searchParams?.sort] || "All Products";

  return (
    <div className="container-x py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl">{sortLabel}</h1>
        <p className="text-sm text-slate-500">Explore products with interactive 3D viewers</p>
      </header>

      <div className="flex gap-6">
        <Suspense fallback={null}>
          <ProductFilters categories={categories} brands={brands} />
        </Suspense>
        <div className="flex-1">
          {products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search for something else."
              action={{ href: "/shop", label: "Clear filters" }}
            />
          ) : (
            <>
              <ProductGrid products={toPlain(products)} columns={3} />
              <Pagination pagination={pagination} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}