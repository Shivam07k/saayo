import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({ searchParams }) {
  return { title: `Order ${searchParams.order || ""} Confirmed` };
}

export default async function CheckoutSuccessPage({ searchParams }) {
  const order = searchParams.order
    ? await prisma.order.findUnique({
        where: { orderNumber: searchParams.order },
        include: { items: { include: { product: true } }, shippingAddress: true, payments: true },
      })
    : null;

  if (!order) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-2xl font-black">Order placed</h1>
        <p className="mt-2 text-sm text-slate-500">Order reference: {searchParams.order || "n/a"}</p>
        <Link href="/shop" className="btn-primary mt-6">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-x max-w-3xl py-10">
      <div className="card overflow-hidden text-center">
        <div className="bg-emerald-50 p-8 dark:bg-emerald-950/40">
          <CheckCircle2 className="mx-auto mb-3 h-16 w-16 text-emerald-500" />
          <h1 className="text-2xl font-black">Thank you! Your order is confirmed</h1>
          <p className="mt-1 text-sm text-slate-500">Order number: <span className="font-bold text-slate-900 dark:text-white">{order.orderNumber}</span></p>
        </div>
        <div className="p-8 text-left">
          <dl className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Status</dt><dd className="font-semibold capitalize">{order.status.replace(/_/g, " ")}</dd></div>
            <div><dt className="text-slate-500">Payment</dt><dd className="font-semibold capitalize">{(order.payments?.[0]?.status || order.paymentStatus).replace(/_/g, " ")} · {order.paymentMethod?.toUpperCase()}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Delivery</dt>
              <dd>{order.shippingAddress ? `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}` : "—"}</dd>
            </div>
          </dl>
          <div className="mb-4 space-y-2">
            {order.items.map((i) => (
              <div key={i.id} className="flex justify-between border-t border-slate-100 pt-2 text-sm dark:border-slate-800">
                <span className="line-clamp-1">{i.quantity} × {i.name}</span>
                <span className="font-semibold">{formatPrice(i.total)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3 font-black dark:bg-slate-800/50">
            <span>Total paid</span><span>{formatPrice(order.total)}</span>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={order.userId ? `/account/orders/${order.id}` : "/shop"} className="btn-primary">{order.userId ? "Track Order" : "Shop again"}</Link>
            <Link href="/shop" className="btn-outline">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}