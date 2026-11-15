import { prisma } from "@/lib/db";
import { apiRequireUser, jsonError } from "@/lib/auth";

export async function GET() {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
  });

  return Response.json({ items: wishlist?.items || [] });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { productId } = data;
  if (!productId) return jsonError("Product id is required", 400);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return jsonError("Product not found", 404);

  let wishlist = await prisma.wishlist.findUnique({ where: { userId: user.id } });
  if (!wishlist) wishlist = await prisma.wishlist.create({ data: { userId: user.id } });

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });

  let inWishlist;
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    inWishlist = false;
  } else {
    await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
    inWishlist = true;
  }

  return Response.json({ success: true, inWishlist });
}