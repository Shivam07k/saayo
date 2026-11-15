import { prisma } from "@/lib/db";
import { getSessionUser, jsonError } from "@/lib/auth";
import { cartItemSchema, cartUpdateSchema } from "@/lib/validations";
import { getServerCart, readGuestCartCookie, writeGuestCartCookie, serializeCartItem } from "@/lib/cart";

export async function GET() {
  const user = await getSessionUser();
  const { items, guest } = await getServerCart(user);
  return Response.json({ items: items.map(serializeCartItem), guest });
}

export async function POST(request) {
  const user = await getSessionUser();
  let data;
  try {
    data = cartItemSchema.parse(await request.json());
  } catch (e) {
    return Response.json({ error: "Invalid cart item", fieldErrors: e.errors }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) return jsonError("Product not found", 404);
  if (!product.isActive) return jsonError("Product is unavailable", 400);

  const variant = data.variantId
    ? await prisma.productVariant.findUnique({ where: { id: data.variantId } })
    : null;
  if (data.variantId && !variant) return jsonError("Variant not found", 404);

  const stock = variant?.stockQuantity ?? product.stockQuantity;

  if (user) {
    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) cart = await prisma.cart.create({ data: { userId: user.id } });

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: data.productId,
        variantId: data.variantId || null,
      },
    });

    if (existing) {
      if (existing.quantity + data.quantity > stock) return jsonError("Not enough stock available", 400);
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + data.quantity, configuration: data.configuration ?? existing.configuration },
      });
    } else {
      if (data.quantity > stock) return jsonError("Not enough stock available", 400);
      await prisma.cartItem.create({
        data: {
          cartId: cart.id, productId: data.productId, variantId: data.variantId || null,
          quantity: data.quantity, configuration: data.configuration || null,
        },
      });
    }
  } else {
    const items = readGuestCartCookie();
    const clientId = Math.random().toString(36).slice(2, 10);
    const match = items.find((i) => i.productId === data.productId && (i.variantId || null) === (data.variantId || null));
    if (match) {
      match.quantity = Math.min(stock, match.quantity + data.quantity);
      match.configuration = data.configuration ?? match.configuration;
    } else {
      items.push({ clientId, productId: data.productId, variantId: data.variantId || null, quantity: Math.min(stock, data.quantity), configuration: data.configuration || null });
    }
    writeGuestCartCookie(items);
  }

  const { items } = await getServerCart(user);
  return Response.json({ items: items.map(serializeCartItem) }, { status: 201 });
}

export async function PATCH(request) {
  const user = await getSessionUser();
  let data;
  try {
    data = cartUpdateSchema.parse(await request.json());
  } catch (e) {
    return Response.json({ error: "Invalid request", fieldErrors: e.errors }, { status: 400 });
  }

  if (data.quantity <= 0) {
    return deleteItem(user, data.itemId);
  }

  if (user) {
    const item = await prisma.cartItem.findUnique({
      where: { id: data.itemId },
      include: { cart: true, product: true, variant: true },
    });
    if (!item || item.cart.userId !== user.id) return jsonError("Cart item not found", 404);
    const maxStock = item.variant?.stockQuantity ?? item.product?.stockQuantity ?? 99;
    await prisma.cartItem.update({ where: { id: data.itemId }, data: { quantity: Math.min(maxStock, Math.max(1, data.quantity)) } });
  } else {
    const items = readGuestCartCookie();
    const match = items.find((i) => i.clientId === data.itemId);
    if (match) match.quantity = Math.max(1, data.quantity);
    writeGuestCartCookie(items);
  }

  const { items } = await getServerCart(user);
  return Response.json({ items: items.map(serializeCartItem) });
}

export async function DELETE(request) {
  const user = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");
  const clear = searchParams.get("clear");

  if (clear === "1") {
    if (user) {
      const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
      if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    } else {
      writeGuestCartCookie([]);
    }
  } else if (itemId) {
    await deleteItem(user, itemId);
  } else {
    return jsonError("itemId required", 400);
  }

  const { items } = await getServerCart(user);
  return Response.json({ items: items.map(serializeCartItem) });
}

async function deleteItem(user, itemId) {
  if (user) {
    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    if (!item || item.cart.userId !== user.id) return;
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    writeGuestCartCookie(readGuestCartCookie().filter((i) => i.clientId !== itemId));
  }
}