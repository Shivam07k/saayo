import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const GUEST_CART_COOKIE = "saayo_guest_cart";

export function readGuestCartCookie() {
  const cookieStore = cookies();
  const raw = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!raw) return [];
  const parsed = parseGuestItems(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function parseGuestItems(raw) {
  const once = safeDecodeURIComponent(raw);
  try {
    const arr = JSON.parse(once);
    if (Array.isArray(arr)) return arr;
  } catch {}
  const twice = safeDecodeURIComponent(once);
  try {
    const arr = JSON.parse(twice);
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function writeGuestCartCookie(items) {
  cookies().set(GUEST_CART_COOKIE, JSON.stringify(items), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getServerCart(user) {
  const guestItems = readGuestCartCookie();
  if (user) {
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: { include: { product: true, variant: true } } },
    });
    return { items: cart?.items || [], guest: false };
  }
  if (guestItems.length === 0) return { items: [], guest: true };

  const enriched = await Promise.all(
    guestItems.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { images: { orderBy: { position: "asc" } } },
      });
      const variant = item.variantId
        ? await prisma.productVariant.findUnique({ where: { id: item.variantId } })
        : null;
      if (!product || (item.variantId && !variant)) return null;
      return { id: item.clientId, productId: product.id, variantId: variant?.id || null, quantity: item.quantity, configuration: item.configuration, product, variant };
    })
  );
  return { items: enriched.filter(Boolean), guest: true };
}

export function serializeCartItem(item) {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    configuration: item.configuration,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      regularPrice: item.product.regularPrice,
      salePrice: item.product.salePrice,
      isFlashSale: item.product.isFlashSale,
      flashSalePrice: item.product.flashSalePrice,
      // weight + taxPercent let the client mirror the server's shipping/tax math
      weight: item.product.weight,
      taxPercent: item.product.taxPercent,
      images: item.product.images,
    },
    variant: item.variant
      ? {
          id: item.variant.id,
          name: item.variant.name,
          options: item.variant.options,
          regularPrice: item.variant.regularPrice,
          salePrice: item.variant.salePrice,
        }
      : null,
  };
}

export async function getCartWithTotals(user) {
  const { items } = await getServerCart(user);
  const subtotal = items.reduce((sum, it) => {
    const price = it.variant?.salePrice || it.variant?.regularPrice || getUnitPrice(it.product);
    return sum + Number(price) * it.quantity;
  }, 0);
  return { items, subtotal };
}

// Unit price = product flash/sale/regular + configuration delta.
// Variant prices are not part of unit pricing; the client mirrors this exactly
// so the cart/checkout display always equals what the server charges.
export function getUnitPrice(p, config = null) {
  const base = p?.isFlashSale && p?.flashSalePrice ? p.flashSalePrice : p?.salePrice || p?.regularPrice;
  const delta = Number(config?.priceDelta || 0);
  return Math.max(0, Number(base || 0) + delta);
}

const CART_ID_RE = /^[a-z0-9]{6,}$/;

export async function mergeGuestCartIntoUser(userId) {
  const guestItems = readGuestCartCookie();
  if (guestItems.length === 0) return;

  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });

  for (const item of guestItems) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) continue;
    const variant = item.variantId
      ? await prisma.productVariant.findUnique({ where: { id: item.variantId } })
      : null;
    if (item.variantId && !variant) continue;
    const stock = variant?.stockQuantity ?? product.stockQuantity;

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: item.productId,
        variantId: item.variantId || null,
      },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: Math.min(stock, existing.quantity + item.quantity),
          configuration: item.configuration ?? existing.configuration,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: Math.min(stock, item.quantity),
          configuration: item.configuration || null,
        },
      });
    }
  }

  writeGuestCartCookie([]);
}
export function guestCartItemsForCookie(items) {
  // normalize db-like rows into cookie entries
  return items.map((it) => ({
    clientId: it.clientId || it.id,
    productId: it.productId,
    variantId: it.variantId || null,
    quantity: it.quantity,
    configuration: it.configuration || null,
  }));
}

export { CART_ID_RE };