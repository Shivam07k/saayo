import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatPrice, formatDate, orderStatusColor, cn } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import { ShoppingBag } from "lucide-react";

export const metadata = { title: "My Orders" };

export default async function OrdersPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const page = Math.max(1, parseInt(searchParams.page, 10) || 1);
  const perPage = 10;

  const where = { userId: user.id };
  const [orders, count] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { items: { include: { product: { select: { slug: true } } } } },
    }),
    prisma.order.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(count / perPage));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black">My Orders</h1>
        <p className="text-sm text-slate-500">{count} orders total</p>
      </header>

      {orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" action={{ href: "/shop", label: "Start shopping" }} />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="card block p-5 transition hover:shadow-md">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <p className="font-bold">{o.orderNumber}</p>
                  <span className={cn("badge", orderStatusColor(o.status))}>{o.status.replace(/_/g, " ")}</span>
                  <span className={cn("badge", orderStatusColor(o.paymentStatus))}>{o.paymentStatus.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-slate-400">{formatDate(o.placedAt)}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  {o.items.slice(0, 2).map((i) => (
                    <p key={i.id} className="text-slate-600 dark:text-slate-400">{i.quantity} × {i.name}</p>
                  ))}
                  {o.items.length > 2 && <p className="text-slate-400">+{o.items.length - 2} more items</p>}
                </div>
                <p className="font-black">{formatPrice(o.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <Link key={i} href={`/account/orders?page=${i + 1}`}
              className={cn("h-9 min-w-9 rounded-lg px-2 text-sm font-semibold flex items-center justify-center", page === i + 1 ? "bg-brand-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}>
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}