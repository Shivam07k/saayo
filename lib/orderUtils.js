import { prisma } from "@/lib/db";
import { computeShippingCost, computeTax } from "@/lib/shipping";
import { getStoreSettings } from "@/lib/storeSettings";
import { getServerCart, getUnitPrice } from "@/lib/cart";
import { generateOrderNumber } from "@/lib/utils";

export async function applyCoupon(coupon, subtotal, { userId, email, productIds = [], categoryIds = [] }) {
  if (!coupon || !coupon.isActive) return { error: "Invalid coupon" };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { error: "Coupon has expired" };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { error: "Coupon usage limit reached" };
  if (coupon.customerEmails?.length && !coupon.customerEmails.includes(email)) return { error: "Coupon not valid for this account" };

  if (userId && coupon.perUserLimit) {
    // shortcut: per-user coupon limits are unenforceable for guest checkout,
    // a guest can reuse a coupon by clearing cookies. Add an email/IP ledger
    // before running guest promotions with real budget.
    const used = await prisma.order.count({ where: { userId, couponCode: coupon.code } });
    if (used >= coupon.perUserLimit) return { error: "Coupon already used" };
  }

  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
    return { error: `Minimum order of ${coupon.minOrderAmount} required for this coupon` };
  }

  if (coupon.productIds?.length || coupon.categoryIds?.length) {
    // valid only if BOTH product-level and category-level eligibility exist
    const hasProduct = coupon.productIds.length === 0 || coupon.productIds.some((id) => productIds.includes(id));
    const hasCategory = coupon.categoryIds.length === 0 || coupon.categoryIds.some((id) => categoryIds.includes(id));
    if (!hasProduct || !hasCategory) return { error: "Coupon not valid for these items" };
  }

  if (coupon.type === "free_shipping") {
    return { coupon, discount: 0, freeShipping: true };
  }

  let discount = 0;
  if (coupon.type === "percent") {
    discount = Math.min(100, Number(coupon.value)) / 100 * subtotal;
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  } else {
    discount = Math.min(subtotal, Number(coupon.value));
  }

  return { coupon, discount: Math.round(discount * 100) / 100, freeShipping: false };
}

export async function computeOrderTotals({ user, couponCode, items, email }) {
  const settings = await getStoreSettings();
  const priced = items.map((i) => ({ ...i, unitPrice: Number(getUnitPrice(i.product, i.configuration)) }));
  const subtotal = priced.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  let coupon = couponCode
    ? await prisma.coupon.findUnique({ where: { code: couponCode } })
    : null;

  if (couponCode && !coupon) return { error: "Invalid coupon code" };

  const couponResult = coupon
    ? await applyCoupon(coupon, subtotal, {
        userId: user?.id,
        email: email || user?.email || "guest@example.com",
        productIds: items.map((i) => i.productId),
        categoryIds: items.map((i) => i.product?.categoryId).filter(Boolean),
      })
    : null;

  if (coupon && couponResult?.error) {
    return { error: couponResult.error };
  }

  const discount = couponResult?.discount || 0;
  const freeShipping = couponResult?.freeShipping || false;
  const shipping = freeShipping ? 0 : computeShippingCost({ items: priced, subtotal, settings });
  const tax = computeTax({ items: priced, subtotal, discount, settings });

  const total = Math.max(0, subtotal - discount + tax + shipping);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shippingTotal: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
    coupon: couponResult?.coupon || null,
  };
}

export async function createOrder({ user, email, phone, shippingAddressId, shippingAddress, couponCode, paymentMethod, notes, useBillingForShipping = true }) {
  const { items } = await getServerCart(user);

  if (items.length === 0) return { error: "Your cart is empty" };

  // stock validation
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || !product.isActive) return { error: `Product unavailable: ${item.product?.name}` };
    if (item.variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
      if (!variant) return { error: `Variant unavailable: ${item.product?.name}` };
      if (variant.stockQuantity < item.quantity) return { error: `Only ${variant.stockQuantity} left of ${item.product?.name}` };
    } else if (product.stockQuantity < item.quantity) {
      return { error: `Only ${product.stockQuantity} left of ${product.name}` };
    }
  }

  const totals = await computeOrderTotals({ user, couponCode, items, email });
  if (totals.error) return totals;

  if (paymentMethod === "cod") {
    const settings = await getStoreSettings();
    if (!settings.codEnabled) return { error: "Cash on delivery is not available" };
    const min = Number(settings.codMinAmount || 0);
    if (min > 0 && totals.total < min) {
      return { error: `Cash on delivery is available on orders of ${min} or more` };
    }
  }

  // resolve addresses
  let ship = null;
  let bill = null;
  if (shippingAddressId) {
    // Only logged-in users can reference a stored address; otherwise a guest
    // could attach (and then read back) another customer's address.
    if (!user) return { error: "Please enter a delivery address" };
    const found = await prisma.address.findUnique({ where: { id: shippingAddressId } });
    if (!found) return { error: "Shipping address not found" };
    if (found.userId !== user.id) return { error: "Address not found" };
    ship = found;
  } else if (shippingAddress) {
    ship = await prisma.address.create({
      data: {
        userId: user?.id || null,
        type: "shipping",
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || null,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || "India",
      },
    });
  } else {
    return { error: "Shipping address is required" };
  }
  bill = useBillingForShipping ? ship : null;

  const orderNumber = generateOrderNumber();

  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id || null,
          email,
          phone,
          status: "pending",
          paymentStatus: paymentMethod === "cod" ? "pending" : "payment_pending",
          paymentMethod,
          subtotal: totals.subtotal,
          discount: totals.discount,
          couponCode: totals.coupon?.code || null,
          tax: totals.tax,
          shippingTotal: totals.shippingTotal,
          total: totals.total,
          currency: "INR",
          shippingAddressId: ship?.id || null,
          billingAddressId: bill?.id || null,
          notes: notes || null,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId || null,
              name: i.product?.name,
              sku: i.variant?.sku || i.product?.sku,
              price: getUnitPrice(i.product, i.configuration),
              quantity: i.quantity,
              configuration: i.configuration || null,
              total: Math.round(Number(getUnitPrice(i.product, i.configuration)) * i.quantity * 100) / 100,
            })),
          },
        },
        include: { items: true },
      });

      // reserve stock + log
      for (const i of items) {
        if (i.variantId) {
          await tx.productVariant.update({
            where: { id: i.variantId },
            data: { stockQuantity: { decrement: i.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: i.productId },
            data: { stockQuantity: { decrement: i.quantity }, soldCount: { increment: i.quantity } },
          });
        }
        const inventory = await tx.inventory.findFirst({ where: { productId: i.productId, variantId: i.variantId || null } });
        if (inventory) {
          await tx.inventory.update({ where: { id: inventory.id }, data: { availableQty: { decrement: i.quantity }, reservedQty: { increment: i.quantity } } });
          await tx.inventoryLog.create({ data: { inventoryId: inventory.id, type: "reserved", quantity: i.quantity, referenceId: orderNumber } });
        }
      }

      // clear cart
      if (user) {
        const cart = await tx.cart.findUnique({ where: { userId: user.id } });
        if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      // increment coupon usage
      if (totals.coupon) {
        await tx.coupon.update({ where: { id: totals.coupon.id }, data: { usedCount: { increment: 1 } } });
      }

      return created;
    });

    // notification for user
    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          orderId: order.id,
          type: "order",
          title: "Order placed",
          body: `Your order ${orderNumber} has been received (${paymentMethod.toUpperCase()}).`,
        },
      });
    }

    return { order };
  } catch (e) {
    console.error("Order creation failed", e);
    return { error: "Could not create order. Please try again." };
  }
}