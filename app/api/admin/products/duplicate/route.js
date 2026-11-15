import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "products:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);

  const source = await prisma.product.findUnique({ where: { id: data.id } });
  if (!source) return jsonError("Product not found", 404);

  const stamp = Date.now().toString().slice(-6);
  const duplicate = await prisma.$transaction(async (tx) => {
    const copy = await tx.product.create({
      data: {
        name: `${source.name} (Copy)`,
        slug: `${slugify(source.name)}-copy-${stamp}`,
        shortDescription: source.shortDescription,
        description: source.description,
        sku: source.sku ? `${source.sku}-${stamp}` : undefined,
        barcode: source.barcode ? `${source.barcode}-${stamp}` : null,
        regularPrice: source.regularPrice,
        salePrice: source.salePrice,
        costPrice: source.costPrice,
        taxPercent: source.taxPercent,
        stockQuantity: source.stockQuantity,
        lowStockLimit: source.lowStockLimit,
        weight: source.weight,
        lengthCm: source.lengthCm,
        widthCm: source.widthCm,
        heightCm: source.heightCm,
        tags: source.tags || [],
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        isFeatured: false,
        isBestSeller: false,
        isTrending: false,
        isFlashSale: false,
        visibility: "draft",
        warranty: source.warranty,
        returnEligible: source.returnEligible,
        returnDays: source.returnDays,
        videoUrl: source.videoUrl,
        brandId: source.brandId,
        categoryId: source.categoryId,
        collectionId: source.collectionId,
        createdById: user.id,
        attributes: { create: (await tx.productAttribute.findMany({ where: { productId: source.id } })).map((a) => ({ name: a.name, value: a.value })) },
        images: { create: (await tx.productImage.findMany({ where: { productId: source.id }, orderBy: { position: "asc" } })).map((img, i) => ({ url: img.url, alt: img.alt, position: i })) },
        models: { create: (await tx.product3DModel.findMany({ where: { productId: source.id } })).map((m) => ({
          name: m.name, url: m.url, format: m.format, isDefault: m.isDefault,
          arEnabled: m.arEnabled, arScale: m.arScale, autoRotate: m.autoRotate, environment: m.environment,
        })) },
        variants: { create: (await tx.productVariant.findMany({ where: { productId: source.id } })).map((v) => ({
          name: v.name, options: v.options, sku: `${v.sku}-${stamp}`,
          regularPrice: v.regularPrice, salePrice: v.salePrice, costPrice: v.costPrice,
          stockQuantity: v.stockQuantity, weight: v.weight, isDefault: v.isDefault, isActive: v.isActive,
        })) },
      },
      include: { variants: true, images: true, models: true, attributes: true },
    });

    for (const v of copy.variants) {
      await tx.inventory.create({ data: { productId: copy.id, variantId: v.id, availableQty: v.stockQuantity, reservedQty: 0 } });
    }
    if (copy.variants.length === 0) {
      await tx.inventory.create({ data: { productId: copy.id, availableQty: copy.stockQuantity, reservedQty: 0 } });
    }
    return copy;
  });

  await logAudit({ userId: user.id, action: "product.duplicate", entityType: "Product", entityId: duplicate.id, meta: { from: source.id } });
  return Response.json({ product: duplicate }, { status: 201 });
}