import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { toPlain } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { getStoreSettings } from "@/lib/storeSettings";
import CheckoutForm from "@/components/CheckoutForm";
import { getServerCart } from "@/lib/cart";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getSessionUser();
  const settings = await getStoreSettings();
  if (!user && !settings.checkoutGuestEnabled) redirect("/login?redirect=/checkout");
  const { items } = await getServerCart(user);
  if (items.length === 0) redirect("/cart");

  const [addresses, coupons] = await Promise.all([
    user ? prisma.address.findMany({ where: { userId: user.id, type: "shipping" }, orderBy: { isDefault: "desc" } }) : [],
    prisma.coupon.findMany({
      where: { isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-black sm:text-3xl">Checkout</h1>
      <CheckoutForm user={toPlain(user)} addresses={toPlain(addresses)} coupons={toPlain(coupons)} settings={toPlain(settings)} />
    </div>
  );
}
