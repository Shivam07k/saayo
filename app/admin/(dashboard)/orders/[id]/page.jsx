"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

const ALL_STATUSES = ["pending", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];

export default function AdminOrderDetailPage({ id }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [status, setStatus] = useState("");
  const [tracking, setTracking] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}`);
    const d = await res.json();
    setOrder(d.order || null);
    setStatus(d.order?.status || "");
    setTracking(d.order?.trackingNumber || "");
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, trackingNumber: tracking }),
    });
    if (res.ok) {
      setToast("Order updated");
      setTimeout(() => setToast(""), 2500);
      await load();
    }
  };

  if (loading) return <div className="skeleton h-64 w-full" />;
  if (!order) return <p className="text-slate-400">Order not found</p>;

  const ship = order.shippingAddress;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="btn-outline !p-2"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h2 className="text-xl font-black">{order.orderNumber}</h2>
          <p className="text-sm text-slate-500">Placed {formatDate(order.placedAt, "medium")} · {order.paymentMethod || "—"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card space-y-4 p-5 lg:col-span-2">
          <h3 className="font-bold">Items</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.sku} × {item.quantity}{item.configuration && <span className="ml-1">· {JSON.stringify(item.configuration)}</span>}</p>
                </div>
                <span className="font-bold">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {Number(order.discount) > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-emerald-500">−{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{formatPrice(order.tax)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>{formatPrice(order.shippingTotal)}</span></div>
            <div className="flex justify-between pt-1 text-base font-black"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 font-bold">Update status</h3>
            <label className="label">Status</label>
            <select className="input mb-3" value={status} onChange={(e) => setStatus(e.target.value)}>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="label">Tracking number</label>
            <input className="input mb-4" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            <button className="btn-primary w-full" onClick={save}>Save</button>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 font-bold">Customer</h3>
            <p className="text-sm font-semibold">{order.user?.name || "Guest"}</p>
            <p className="text-sm text-slate-500">{order.email}</p>
            {order.phone && <p className="text-sm text-slate-500">{order.phone}</p>}
          </div>

          {ship && (
            <div className="card p-5">
              <h3 className="mb-3 font-bold">Ship to</h3>
              <p className="text-sm">{ship.fullName}</p>
              <p className="text-sm text-slate-500">{ship.line1}{ship.line2 ? `, ${ship.line2}` : ""}</p>
              <p className="text-sm text-slate-500">{ship.city}, {ship.state} {ship.postalCode}</p>
              <p className="text-sm text-slate-500">{ship.country} · {ship.phone}</p>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="fixed bottom-6 right-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}