import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatPrice, formatDate, orderStatusColor, cn } from "@/lib/utils";
import { TrackOrder } from "@/components/TrackOrder";

export const metadata = { title: "Order Details" };

const STATUS_FLOW = ["pending", "payment_pending", "payment_confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"];

export default async function OrderDetailPage({ params }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      items: { include: { product: { select: { name: true, slug: true } } } },
      shippingAddress: true,
      payments: true,
      shipments: true,
    },
  });
  if (!order) notFound();

  const flowIndex = STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">Placed {formatDate(order.placedAt)}</p>
        </div>
        <span className={cn("badge text-sm", orderStatusColor(order.status))}>{order.status.replace(/_/g, " ")}</span>
      </header>

      {/* tracking */}
      <TrackOrder status={order.status} flow={STATUS_FLOW} flowIndex={flowIndex} cancelled={isCancelled} shipment={order.shipments?.[0]} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* items */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">Items</h2>
          <div className="space-y-3">
            {order.items.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold">{i.name}</p>
                  {i.configuration?.selectedOptions && (
                    <p className="text-xs text-slate-500">{Object.values(i.configuration.selectedOptions).filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <div className="text-right">
                  <p>{formatPrice(i.price)} × {i.quantity}</p>
                  <p className="font-bold">{formatPrice(i.total)}</p>
                </div>
              </div>
            ))}
          </div>
          <dl className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd>-{formatPrice(order.discount)}</dd></div>}
            {Number(order.shippingTotal) > 0 && <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{formatPrice(order.shippingTotal)}</dd></div>}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black dark:border-slate-800"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="mb-2 font-bold">Payment</h3>
            <p className="text-sm capitalize">{order.paymentMethod || "—"} · {order.paymentStatus.replace(/_/g, " ")}</p>
            <p className="text-xs text-slate-500">Ref: {order.payments?.[0]?.providerId || "—"}</p>
          </div>
          <div className="card p-6">
            <h3 className="mb-2 font-bold">Shipping address</h3>
            {order.shippingAddress ? (
              <address className="text-sm not-italic text-slate-600 dark:text-slate-400">
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.line1}, {order.shippingAddress.city}<br />
                {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country} · {order.shippingAddress.phone}
              </address>
            ) : <p className="text-sm text-slate-500">—</p>}
          </div>
          {order.trackingNumber && (
            <div className="card p-6">
              <h3 className="mb-2 font-bold">Tracking</h3>
              <p className="text-sm">{order.shippingProvider} · {order.trackingNumber}</p>
            </div>
          )}
          <Link href="/account/orders" className="btn-outline w-full text-sm">← Back to orders</Link>
        </div>
      </div>
    </div>
  );
}