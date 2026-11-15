"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import { Boxes, AlertTriangle, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminInventoryPage() {
  const [data, setData] = useState({ inventory: [], pagination: { page: 1, pages: 1, count: 0 } });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [adjusting, setAdjusting] = useState(null);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/inventory?${params}`);
    setData(await res.json());
  }, [page, q]);
  useEffect(() => { load(); }, [load]);

  const adjust = async () => {
    if (!adjusting || !amount) return;
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId: adjusting.id, adjustment: Number(amount), reason }),
    });
    if (res.ok) {
      setToast(`Adjusted ${adjusting.product?.name}.`);
      setTimeout(() => setToast(""), 2500);
    }
    setAdjusting(null); setAmount(0); setReason("");
    await load();
  };

  const lowCount = data.inventory.filter((i) => i.availableQty <= 5).length;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Inventory</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total SKUs" value={data.pagination.count} icon={Boxes} tone="brand" />
        <StatCard label="Low stock here" value={lowCount} icon={AlertTriangle} tone="amber" />
      </div>

      <DataTable
        columns={[
          { key: "product", label: "Product", render: (i) => <div><p className="font-semibold">{i.product?.name}</p>{i.variant && <p className="text-xs text-slate-400">{i.variant.name}</p>}</div> },
          { key: "warehouse", label: "Warehouse", render: (i) => i.warehouse?.name || "—" },
          { key: "available", label: "Available", render: (i) => (
            <span className={i.availableQty <= 5 ? "font-bold text-red-500" : "font-bold"}>{i.availableQty}</span>
          ) },
          { key: "reserved", label: "Reserved", render: (i) => i.reservedQty },
          { key: "updated", label: "Updated", render: (i) => formatDate(i.updatedAt, "short") },
        ]}
        rows={data.inventory}
        onSearch={setQ}
        page={page}
        totalPages={data.pagination.pages}
        onChangePage={setPage}
        emptyMessage="No inventory records"
        actions={(i) => (
          <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setAdjusting(i)}>
            <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> Adjust
          </button>
        )}
      />

      {toast && <div className="fixed bottom-6 right-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}

      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAdjusting(null)}>
          <div className="card relative w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 font-bold">Adjust stock</h3>
            <p className="mb-4 text-sm text-slate-500">{adjusting.product?.name}{adjusting.variant ? ` · ${adjusting.variant.name}` : ""} (currently {adjusting.availableQty})</p>
            <div className="mb-3">
              <label className="label">Change (±)</label>
              <input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. +10 or -3" />
            </div>
            <div className="mb-4">
              <label className="label">Reason</label>
              <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Local adjustment" />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setAdjusting(null)}>Cancel</button>
              <button className="btn-primary" onClick={adjust}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}