import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit"), 10) || 12));
  const q = searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const includeInactive = searchParams.get("all") === "1";

  const where = {};
  if (!includeInactive) where.isActive = true;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const [products, count] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { brand: true, category: true, images: { take: 1 }, models: { take: 2 }, variants: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json({ products, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "products:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = productSchema.parse(await request.json());
  } catch (e) {
    return Response.json({ error: "Validation failed", fieldErrors: e.flatten?.(0).fieldErrors || e.errors }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug || slugify(data.name),
      shortDescription: data.shortDescription || null,
      description: data.description || null,
      sku: data.sku,
      barcode: data.barcode || null,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice ?? null,
      costPrice: data.costPrice ?? null,
      taxPercent: data.taxPercent || 0,
      stockQuantity: data.stockQuantity,
      lowStockLimit: data.lowStockLimit,
      weight: data.weight ?? null,
      lengthCm: data.lengthCm ?? null,
      widthCm: data.widthCm ?? null,
      heightCm: data.heightCm ?? null,
      tags: data.tags || [],
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      isFeatured: data.isFeatured,
      isBestSeller: data.isBestSeller,
      isTrending: data.isTrending,
      isFlashSale: data.isFlashSale,
      flashSalePrice: data.flashSalePrice ?? null,
      flashSaleEndsAt: data.flashSaleEndsAt ? new Date(data.flashSaleEndsAt) : null,
      visibility: data.visibility,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      warranty: data.warranty || null,
      returnEligible: data.returnEligible,
      returnDays: data.returnDays,
      videoUrl: data.videoUrl || null,
      brandId: data.brandId || null,
      categoryId: data.categoryId || null,
      collectionId: data.collectionId || null,
      createdById: user.id,
      attributes: { create: data.attributes },
      relatedTo: data.relatedIds?.length
        ? { create: data.relatedIds.map((rid) => ({ relatedId: rid })) }
        : undefined,
      images: { create: data.images.map((img, i) => ({ url: img.url, alt: img.alt, position: img.position ?? i })) },
      models: data.models?.length ? {
        create: data.models.map((m) => ({
          name: m.name, url: m.url, format: m.format,
          isDefault: m.isDefault,
          arEnabled: m.arEnabled,
          arScale: m.arScale,
          cameraAngle: m.cameraAngle || null,
          autoRotate: m.autoRotate,
          environment: m.environment,
        })),
      } : undefined,
      variants: data.variants?.length ? {
        create: data.variants.map((v) => ({
          name: v.name, options: v.options || null, sku: v.sku,
          barcode: v.barcode || null, regularPrice: v.regularPrice,
          salePrice: v.salePrice ?? null, costPrice: v.costPrice ?? null,
          stockQuantity: v.stockQuantity, weight: v.weight ?? null,
          isDefault: v.isDefault, isActive: v.isActive,
        })),
      } : undefined,
    },
    include: { variants: true, images: true, models: true },
  });

  return Response.json({ product }, { status: 201 });
}