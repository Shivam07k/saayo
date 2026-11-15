import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/queries";
import { getStoreSettings } from "@/lib/storeSettings";
import { toPlain } from "@/lib/utils";
import { prisma } from "@/lib/db";
import ProductView from "@/components/ProductView";
import ProductGrid from "@/components/ProductGrid";
import Breadcrumbs from "@/components/Breadcrumbs";
import RatingStars from "@/components/RatingStars";
import ReviewForm from "@/components/ReviewForm";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images?.[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const [product, settings] = await Promise.all([getProductBySlug(params.slug), getStoreSettings()]);
  if (!product) notFound();

  const [reviews, related, boughtTogether] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id, status: "approved" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, avatar: true } } },
    }),
    prisma.relatedProduct.findMany({
      where: { productId: product.id },
      include: { related: { include: { images: { take: 1 }, models: { take: 1 }, brand: true } } },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        visibility: "public",
        id: { not: product.id },
        categoryId: product.categoryId,
      },
      orderBy: { soldCount: "desc" },
      take: 6,
      include: { images: { take: 1 }, models: { take: 1 }, brand: true },
    }),
  ]);

  const relatedProducts = [
    ...related.map((r) => r.related),
    ...boughtTogether.filter((p) => !related.some((r) => r.relatedId === p.id)),
  ].slice(0, Number(settings.productRelatedLimit ?? 4));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    image: product.images?.[0]?.url,
    brand: { "@type": "Brand", name: product.brand?.name },
    aggregateRating: product.ratingCount > 0
      ? { "@type": "AggregateRating", ratingValue: Number(product.ratingAvg).toFixed(1), reviewCount: product.ratingCount }
      : undefined,
    offers: {
      "@type": "Offer",
      price: Number(product.salePrice || product.regularPrice),
      priceCurrency: "INR",
      availability: product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `/product/${product.slug}`,
    },
  };

  return (
    <div className="container-x py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          product.category ? { label: product.category.name, href: `/category/${product.category.slug}` } : null,
          { label: product.name },
        ].filter(Boolean)}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ProductView product={toPlain(product)} settings={toPlain(settings)} />

      {/* Reviews */}
      {settings.productEnableReviews !== false && (
      <section className="mt-14">
        <h2 className="mb-6 text-xl font-black sm:text-2xl">Customer Reviews ({product.ratingCount})</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {reviews.length === 0 ? (
              <p className="card p-6 text-sm text-slate-500">No reviews yet. Be the first to review this product.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <article key={r.id} className="card p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          {r.user.name[0]}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{r.user.name}</p>
                          {r.isVerifiedPurchase && <span className="text-xs text-emerald-600">✓ Verified purchase</span>}
                        </div>
                      </div>
                      <RatingStars rating={r.rating} size="h-4 w-4" />
                    </div>
                    {r.title && <h3 className="mb-1 text-sm font-bold">{r.title}</h3>}
                    <p className="text-sm text-slate-600 dark:text-slate-400">{r.body}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
          <div>
            <ReviewForm productId={product.id} />
          </div>
        </div>
      </section>
      )}

      {/* Related */}
      {relatedProducts.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-xl font-black sm:text-2xl">You may also like</h2>
          <ProductGrid products={toPlain(relatedProducts)} columns={4} />
        </section>
      )}
    </div>
  );
}