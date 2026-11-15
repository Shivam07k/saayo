"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import { formatDate } from "@/lib/utils";

export default function AdminReviewsPage() {
  const [data, setData] = useState({ reviews: [], pagination: { page: 1, pages: 1 } });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/reviews?${params}`);
    setData(await res.json());
  }, [page, status]);
  useEffect(() => { load(); }, [load]);

  const moderate = async (r, newStatus) => {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, status: newStatus }),
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black">Reviews</h2>
        <select className="input !py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {["pending", "approved", "rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable
        columns={[
          { key: "rating", label: "Rating", render: (r) => <span className="font-bold text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span> },
          { key: "title", label: "Review", render: (r) => <div><p className="font-semibold">{r.title || "Untitled"}</p><p className="line-clamp-2 max-w-xs text-slate-500">{r.body}</p></div> },
          { key: "product", label: "Product", render: (r) => r.product?.name || "—" },
          { key: "user", label: "By", render: (r) => r.user?.name || "Deleted user" },
          { key: "status", label: "Status", render: (r) => <span className={`badge ${r.status === "approved" ? "badge-success" : r.status === "rejected" ? "badge-danger" : "badge-warning"}`}>{r.status}</span> },
          { key: "createdAt", label: "Date", render: (r) => formatDate(r.createdAt, "short") },
        ]}
        rows={data.reviews}
        page={page}
        totalPages={data.pagination.pages}
        onChangePage={setPage}
        emptyMessage="No reviews"
        actions={(r) => (
          <div className="flex justify-end gap-1">
            {r.status !== "approved" && <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => moderate(r, "approved")}>Approve</button>}
            {r.status !== "rejected" && <button className="btn-outline !border-red-200 !text-red-500 !px-3 !py-1.5 text-xs" onClick={() => moderate(r, "rejected")}>Reject</button>}
          </div>
        )}
      />
    </div>
  );
}