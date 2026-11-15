"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [data, setData] = useState({ payments: [], pagination: { page: 1, pages: 1 } });
  const [page, setPage] = useState(1);
  const [provider, setProvider] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (provider) params.set("provider", provider);
    const res = await fetch(`/api/admin/payments?${params}`);
    setData(await res.json());
  }, [page, provider]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Payments</h2>
        <select className="input !py-2 text-sm" value={provider} onChange={(e) => { setProvider(e.target.value); setPage(1); }}>
          <option value="">All providers</option>
          {["stripe", "razorpay", "cod"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <DataTable
        columns={[
          { key: "order", label: "Order", render: (p) => <span className="font-semibold">{p.order?.orderNumber || p.orderId.slice(0, 8)}</span> },
          { key: "email", label: "Customer", render: (p) => p.order?.email || "—" },
          { key: "provider", label: "Provider", render: (p) => <span className="badge badge-info">{p.provider}</span> },
          { key: "amount", label: "Amount", render: (p) => <span className="font-bold">{formatPrice(p.amount)}</span> },
          { key: "method", label: "Method", render: (p) => p.method || "—" },
          { key: "status", label: "Status", render: (p) => <span className={`badge ${p.status === "succeeded" ? "badge-success" : p.status === "failed" ? "badge-danger" : p.status === "refunded" ? "badge-neutral" : "badge-warning"}`}>{p.status}</span> },
          { key: "createdAt", label: "Date", render: (p) => formatDate(p.createdAt, "short") },
        ]}
        rows={data.payments}
        page={page}
        totalPages={data.pagination.pages}
        onChangePage={setPage}
        emptyMessage="No payments yet"
      />
    </div>
  );
}