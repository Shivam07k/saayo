import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatPrice, formatDate, orderStatusColor, cn } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import { ArrowRight, ShoppingBag } from "lucide-react";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [orders, notifications] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: "desc" },
      take: 5,
      include: { items: { take: 1, include: { product: { select: { slug: true } } } } },
    }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">Hi {user.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening with your account.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Orders placed", orders.length],
          ["Saved addresses", (await prisma.address.count({ where: { userId: user.id } }))],
          ["Notifications", notifications.length],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-3xl font-black text-brand-600 dark:text-brand-400">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent orders</h2>
          <Link href="/account/orders" className="flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No orders yet" description="Explore the shop and try the 3D viewer!" action={{ href: "/shop", label: "Start shopping" }} />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.map((o) => (
              <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900">
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-slate-500">{formatDate(o.placedAt)} · {o.items[0]?.name}{o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(o.total)}</p>
                  <span className={cn("badge", orderStatusColor(o.status))}>{o.status.replace(/_/g, " ")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}