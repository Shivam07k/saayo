import { prisma } from "@/lib/db";
import { buildPagination } from "@/lib/utils";

export const publicProductInclude = {
  images: { orderBy: { position: "asc" } },
  models: { where: { isActive: true }, orderBy: { isDefault: "desc" } },
  brand: true,
  category: true,
  collection: true,
  variants: { where: { isActive: true }, orderBy: { isDefault: "desc" } },
  attributes: true,
};

// Lightweight shape for product cards/grids. ProductCard only needs the
// first image, a model count, brand name and price fields â€” pulling every
// variant, 3D model config blob and attribute list here bloats the HTML
// payload on every listing (home/shop/search/category) for no visible benefit.
export const publicProductCardInclude = {
  images: { orderBy: { position: "asc" }, take: 2 },
  models: { where: { isActive: true }, select: { id: true } },
  brand: { select: { id: true, name: true, slug: true } },
};

export async function getPublicProducts({ searchParams = {}, categorySlug, limit, includeAll = false }) {
  const page = Math.max(1, parseInt(searchParams.page, 10) || 1);
  const perPage = limit || Math.min(48, parseInt(searchParams.limit, 10) || 12);

  const where = { isActive: true, visibility: "public" };

  if (categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: { children: true },
    });
    if (!cat) return { products: [], pagination: buildPagination(0, page, perPage), category: null };
    const ids = [cat.id, ...cat.children.map((c) => c.id)];
    where.categoryId = { in: ids };
    if (includeAll) return { products: await findAllProducts(where), pagination: null, category: cat };
    return {
      products: await prisma.product.findMany({
        where, include: publicProductCardInclude,
        orderBy: productOrder(searchParams.sort),
        skip: (page - 1) * perPage, take: perPage,
      }),
      pagination: buildPagination(await prisma.product.count({ where }), page, perPage),
      category: cat,
    };
  }

  // filters
  if (searchParams.q) {
    const q = searchParams.q;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { shortDescription: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
      { brand: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (searchParams.category) {
    const cat = await prisma.category.findUnique({ where: { slug: searchParams.category }, include: { children: true } });
    if (cat) where.categoryId = { in: [cat.id, ...cat.children.map((c) => c.id)] };
  }
  if (searchParams.brand) {
    const brand = await prisma.brand.findUnique({ where: { slug: searchParams.brand } });
    if (brand) where.brandId = brand.id;
  }
  if (searchParams.minPrice) where.OR = [...(where.OR || []), { regularPrice: { gte: Number(searchParams.minPrice) } }];
  if (searchParams.available === "1") where.stockQuantity = { gt: 0 };

  if (searchParams.sale === "1") where.salePrice = { not: null };

  let products = [];
  if (searchParams.minPrice || searchParams.maxPrice) {
    // price filter must consider sale/flash price â€” do a broader query then filter
    const all = await prisma.product.findMany({ where: { ...where, regularPrice: undefined }, include: publicProductInclude });
    const min = Number(searchParams.minPrice || 0);
    const max = Number(searchParams.maxPrice || Infinity);
    products = all.filter((p) => {
      const price = Number(p.isFlashSale && p.flashSalePrice ? p.flashSalePrice : p.salePrice || p.regularPrice);
      return price >= min && price <= max;
    });
    const sortedBy = searchParams.sort;
    if (sortedBy) products.sort(sortProducts(sortedBy));
    const count = products.length;
    products = products.slice((page - 1) * perPage, page * perPage);
    return {
      products,
      pagination: buildPagination(count, page, perPage),
      category: null,
      count,
    };
  }

  const [all, count] = await Promise.all([
    prisma.product.findMany({
      where,
      include: publicProductCardInclude,
      orderBy: productOrder(searchParams.sort),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);
  return { products: all, pagination: buildPagination(count, page, perPage), category: null, count };
}

function productOrder(sort) {
  switch (sort) {
    case "newest": return { createdAt: "desc" };
    case "price-asc": return { regularPrice: "asc" };
    case "price-desc": return { regularPrice: "desc" };
    case "rating": return { ratingAvg: "desc" };
    case "popular": return { soldCount: "desc" };
    default: return [{ isFeatured: "desc" }, { soldCount: "desc" }];
  }
}

function sortProducts(sort) {
  return (a, b) => {
    const price = (p) => Number(p.isFlashSale && p.flashSalePrice ? p.flashSalePrice : p.salePrice || p.regularPrice);
    switch (sort) {
      case "newest": return new Date(b.createdAt) - new Date(a.createdAt);
      case "price-asc": return price(a) - price(b);
      case "price-desc": return price(b) - price(a);
      case "rating": return b.ratingAvg - a.ratingAvg;
      case "popular": return b.soldCount - a.soldCount;
      default: return 0;
    }
  };
}

async function findAllProducts(where) {
  return prisma.product.findMany({ where, include: publicProductInclude });
}

export async function getHomeData() {
  const now = new Date();
  const [categories, brands, banners, newArrivals, bestSellers, trending, flashSale, featured, topReviews] =
    await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
      prisma.brand.findMany({ where: { isActive: true }, take: 20 }),
      prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.product.findMany({
        where: { isActive: true, visibility: "public" },
        orderBy: { createdAt: "desc" }, take: 8, include: publicProductCardInclude,
      }),
      prisma.product.findMany({
        where: { isActive: true, visibility: "public", isBestSeller: true },
        orderBy: { soldCount: "desc" }, take: 8, include: publicProductCardInclude,
      }),
      prisma.product.findMany({
        where: { isActive: true, visibility: "public", isTrending: true },
        orderBy: { soldCount: "desc" }, take: 8, include: publicProductCardInclude,
      }),
      prisma.product.findMany({
        where: { isActive: true, visibility: "public", isFlashSale: true, flashSaleEndsAt: { gt: now } },
        orderBy: { soldCount: "desc" }, take: 4, include: publicProductCardInclude,
      }),
      prisma.product.findMany({
        where: { isActive: true, visibility: "public", isFeatured: true },
        orderBy: { soldCount: "desc" }, take: 8, include: publicProductCardInclude,
      }),
      prisma.review.findMany({
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: { select: { name: true, avatar: true } }, product: { select: { name: true, slug: true } } },
      }),
    ]);
  return { categories, brands, banners, newArrivals, bestSellers, trending, flashSale, featured, topReviews };
}

export async function getProductBySlug(slug) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: publicProductInclude,
  });
}

export async function getProductForAdmin(id) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      models: true,
      brand: true,
      category: true,
      collection: true,
      variants: true,
      attributes: true,
      relatedFrom: { include: { related: { select: { id: true, name: true, slug: true } } } },
    },
  });
}
