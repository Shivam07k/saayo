import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { toPlain } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";
import WishlistView from "@/components/WishlistView";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const items = await prisma.wishlistItem.findMany({
    where: { wishlist: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: { product: { include: { images: { take: 1 }, models: { take: 1 } } } },
  });

  return (
    <div>
      <WishlistView items={toPlain(items.map((w) => ({ ...w, product: { ...w.product, images: w.product.images } })))} />
    </div>
  );
}