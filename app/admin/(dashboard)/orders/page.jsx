"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import { formatPrice, formatDate } from "@/lib/utils";

const STATUS_COLOR = {
  pending: "badge-warning", processing: "badge-info", shipped: "badge-info",
  delivered: "badge-success", cancelled: "badge-danger", refunded: "badge-neutral",
};

export default function AdminOrdersPage() {
  const [data, setData] = useState({ orders: [], pagination: { page: 1, pages: 1 } });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (payment) params.set("paymentStatus", payment);
    const res = await fetch(`/api/admin/orders?${params}`);
    setData(await res.json());
  }, [page, q, status, payment]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black">Orders</h2>
        <div className="flex gap-2">
          <select className="input !py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {["pending", "payment_pending", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input !py-2 text-sm" value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }}>
            <option value="">All payments</option>
            {["pending", "paid", "failed", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "orderNumber", label: "Order", render: (o) => <Link href={`/admin/orders/${o.id}`} className="font-bold text-brand-600 hover:underline dark:text-brand-400">{o.orderNumber}</Link> },
          { key: "email", label: "Customer", render: (o) => <div><p>{o.email}</p>{o.user && <p className="text-xs text-slate-400">{o.user.name}</p>}</div> },
          { key: "items", label: "Items", render: (o) => o._count?.items ?? 0 },
          { key: "total", label: "Total", render: (o) => <span className="font-bold">{formatPrice(o.total)}</span> },
          { key: "status", label: "Status", render: (o) => <span className={`badge ${STATUS_COLOR[o.status] || "badge-neutral"}`}>{o.status}</span> },
          { key: "payment", label: "Payment", render: (o) => <span className={`badge ${o.paymentStatus === "paid" ? "badge-success" : o.paymentStatus === "failed" ? "badge-danger" : "badge-warning"}`}>{o.paymentStatus}</span> },
          { key: "placedAt", label: "Placed", render: (o) => formatDate(o.placedAt, "short") },
        ]}
        rows={data.orders}
        onSearch={setQ}
        page={page}
        totalPages={data.pagination.pages}
        onChangePage={setPage}
        emptyMessage="No orders match"
        actions={(o) => (
          <Link href={`/admin/orders/${o.id}`} className="btn-outline !p-2"><Eye className="h-4 w-4" /></Link>
        )}
      />
    </div>
  );
}