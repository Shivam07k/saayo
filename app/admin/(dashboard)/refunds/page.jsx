"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AdminRefundsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/refunds");
    setRows((await res.json()).refunds || []);
    const res2 = await fetch("/api/admin/orders?limit=100");
    setOrders((await res2.json()).orders || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!open || !amount) return;
    setSaving(true);
    const res = await fetch("/api/admin/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: open, amount: Number(amount), reason }),
    });
    setSaving(false);
    if (res.ok) setToast("Refund recorded & order refunded");
    setOpen(null); setAmount(""); setReason("");
    setTimeout(() => setToast(""), 2500);
    await load();
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Refunds</h2>
      </div>

      <DataTable
        columns={[
          { key: "orderNumber", label: "Order", render: (r) => <span className="font-semibold">{r.order?.orderNumber || r.orderId.slice(0, 8)}</span> },
          { key: "amount", label: "Amount", render: (r) => <span className="font-bold text-red-500">−{formatPrice(r.amount)}</span> },
          { key: "status", label: "Status", render: (r) => <span className={`badge ${r.status === "processed" ? "badge-success" : "badge-warning"}`}>{r.status}</span> },
          { key: "reason", label: "Reason", render: (r) => r.reason || "—" },
          { key: "createdAt", label: "Date", render: (r) => formatDate(r.createdAt, "short") },
        ]}
        rows={rows}
        emptyMessage="No refunds yet"
      />

      <div className="card p-5">
        <h3 className="mb-3 font-bold">Process a refund</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_150px_1fr_auto]">
          <select className="input" value={open || ""} onChange={(e) => setOpen(e.target.value)}>
            <option value="">Select order…</option>
            {orders.map((o) => <option key={o.id} value={o.id}>{o.orderNumber} · {formatPrice(o.total)}</option>)}
          </select>
          <input type="number" className="input" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="input" placeholder="Reason (e.g. defective)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="btn-primary" onClick={submit} disabled={!open || !amount || saving}>
            <Undo2 className="mr-1 inline h-4 w-4" /> {saving ? "Processing…" : "Refund"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Restores stock and updates the order to refunded. Stripe refunds are attempted when configured.</p>
      </div>

      {toast && <div className="fixed bottom-6 right-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}