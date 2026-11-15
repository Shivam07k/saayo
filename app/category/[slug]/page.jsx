import { notFound } from "next/navigation";
import { getPublicProducts } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { toPlain } from "@/lib/utils";
import ProductGrid from "@/components/ProductGrid";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: { children: true },
  });
  if (!category) return { title: "Category" };
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({ params, searchParams }) {
  const { products, pagination, category } = await getPublicProducts({
    searchParams,
    categorySlug: params.slug,
  });

  if (!category) notFound();

  return (
    <div className="container-x py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: category.name },
        ]}
      />
      <header className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl">{category.name}</h1>
        {category.description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{category.description}</p>}
      </header>

      {products.length === 0 ? (
        <EmptyState
          title="No products in this category yet"
          description="Check back soon."
          action={{ href: "/shop", label: "Browse all products" }}
        />
      ) : (
        <>
          <ProductGrid products={toPlain(products)} columns={4} />
          <Pagination base={`/category/${category.slug}`} pagination={pagination} />
        </>
      )}
    </div>
  );
}