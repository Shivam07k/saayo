"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import { Users, UserCheck, UserX } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminCustomersPage() {
  const [data, setData] = useState({ customers: [], pagination: { page: 1, pages: 1 }, summary: {} });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/customers?${params}`);
    setData(await res.json());
  }, [page, q]);
  useEffect(() => { load(); }, [load]);

  const toggleBlock = async (c) => {
    await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, status: c.status === "blocked" ? "active" : "blocked" }),
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Customers</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total customers" value={data.summary.total ?? 0} icon={Users} tone="brand" />
        <StatCard label="Active" value={data.summary.active ?? 0} icon={UserCheck} tone="emerald" />
        <StatCard label="Blocked" value={data.summary.blocked ?? 0} icon={UserX} tone="rose" />
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Customer", render: (c) => <div><p className="font-semibold">{c.name}</p><p className="text-xs text-slate-400">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p></div> },
          { key: "role", label: "Role", render: (c) => c.role?.name || "—" },
          { key: "orders", label: "Orders", render: (c) => c._count?.orders ?? 0 },
          { key: "status", label: "Status", render: (c) => <span className={`badge ${c.status === "active" ? "badge-success" : c.status === "blocked" ? "badge-danger" : "badge-neutral"}`}>{c.status}</span> },
          { key: "joined", label: "Joined", render: (c) => formatDate(c.createdAt, "short") },
        ]}
        rows={data.customers}
        onSearch={setQ}
        page={page}
        totalPages={data.pagination.pages}
        onChangePage={setPage}
        emptyMessage="No customers found"
        actions={(c) => (
          <button
            className={`${c.status === "blocked" ? "btn-outline" : "btn-outline !border-red-200 !text-red-500"} !px-3 !py-1.5 text-xs`}
            onClick={() => toggleBlock(c)}
          >
            {c.status === "blocked" ? "Unblock" : "Block"}
          </button>
        )}
      />
    </div>
  );
}