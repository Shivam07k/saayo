import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function GET(request, { params }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
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
  if (!product) return jsonError("Product not found", 404);
  return Response.json({ product });
}

export async function PUT(request, { params }) {
  const { user, error, status } = await apiRequireAdmin({ permission: "products:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = productSchema.parse(await request.json());
  } catch (e) {
    return Response.json({ error: "Validation failed", fieldErrors: e.flatten?.(0).fieldErrors || e.errors }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError("Product not found", 404);

  const product = await prisma.$transaction(async (tx) => {
    await tx.productAttribute.deleteMany({ where: { productId: params.id } });
    await tx.relatedProduct.deleteMany({ where: { productId: params.id } });

    const updated = await tx.product.update({
      where: { id: params.id },
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
        attributes: { create: data.attributes },
        relatedTo: data.relatedIds?.length
          ? { create: data.relatedIds.map((rid) => ({ relatedId: rid })) }
          : undefined,
      },
      include: { images: true, models: true, variants: true, attributes: true },
    });

    if (data.variants !== undefined && Array.isArray(data.variants)) {
      await tx.productVariant.deleteMany({ where: { productId: params.id } });
      // replace variant images/models handled by admin UI calling dedicated endpoints
      for (const v of data.variants) {
        await tx.productVariant.create({
          data: {
            productId: params.id, name: v.name, options: v.options || null, sku: v.sku,
            barcode: v.barcode || null, regularPrice: v.regularPrice,
            salePrice: v.salePrice ?? null, costPrice: v.costPrice ?? null,
            stockQuantity: v.stockQuantity, weight: v.weight ?? null,
            isDefault: v.isDefault, isActive: v.isActive,
          },
        });
      }
    }

    if (Array.isArray(data.images)) {
      await tx.productImage.deleteMany({ where: { productId: params.id } });
      if (data.images.length) {
        await tx.productImage.createMany({
          data: data.images.map((img, i) => ({ productId: params.id, url: img.url, alt: img.alt, position: img.position ?? i })),
        });
      }
    }

    return updated;
  });

  await logAudit({ userId: user.id, action: "product.update", entityType: "Product", entityId: product.id });
  return Response.json({ product });
}

export async function DELETE(request, { params }) {
  const { user, error, status } = await apiRequireAdmin({ permission: "products:manage" });
  if (error) return jsonError(error, status);

  await prisma.product.delete({ where: { id: params.id } });
  await logAudit({ userId: user.id, action: "product.delete", entityType: "Product", entityId: params.id });
  return Response.json({ success: true });
}