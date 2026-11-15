"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, PlusCircle, Trash2, ClipboardList, CheckCircle2, XCircle, Eye, Truck } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import { formatPrice, formatDate } from "@/lib/utils";

const STATUS_BADGE = {
  draft: "badge-neutral",
  ordered: "bg-blue-100 text-blue-700",
  partial: "badge-warning",
  received: "badge-success",
  cancelled: "bg-red-100 text-red-600",
};

export default function AdminPurchaseOrdersPage() {
  const router = useRouter();
  const [data, setData] = useState({ purchaseOrders: [], pagination: { count: 0, page: 1, pages: 1 } });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [receiving, setReceiving] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/purchase-orders?${params}`);
    setData(await res.json());
  }, [page, q, status]);
  useEffect(() => { load(); }, [load]);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const changeStatus = async (id, body) => {
    setBusy(true);
    const res = await fetch("/api/admin/purchase-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    setBusy(false);
    if (res.ok) {
      notify("Purchase order updated.");
      setViewing(null);
      setReceiving(null);
      setCancelling(null);
      await load();
      router.refresh();
    } else {
      const d = await res.json();
      notify(d.error || "Failed to update purchase order");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black">Purchase Orders</h2>
        <div className="flex items-center gap-3">
          <select className="input !w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {Object.keys(STATUS_BADGE).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setCreating({ supplierId: "", referenceNo: "", expectedAt: "", items: [{ productId: "", quantity: 1, unitCost: "" }] })}><Plus className="mr-1 inline h-4 w-4" /> New PO</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open orders" value={data.purchaseOrders.filter((p) => ["draft", "ordered", "partial"].includes(p.status)).length} icon={ClipboardList} tone="brand" />
        <StatCard label="Awaiting goods" value={data.purchaseOrders.filter((p) => ["ordered", "partial"].includes(p.status)).reduce((n, p) => n + p.items.reduce((m, i) => m + (i.quantity - i.receivedQty), 0), 0)} icon={Truck} tone="amber" />
      </div>

      <DataTable
        columns={[
          { key: "ref", label: "Reference", render: (p) => <span className="font-semibold">{p.referenceNo}</span> },
          { key: "supplier", label: "Supplier", render: (p) => p.supplier?.name || "—" },
          { key: "items", label: "Line items", render: (p) => <span className="font-semibold">{p.items.length}</span> },
          { key: "total", label: "Total", render: (p) => formatPrice(p.totalAmount) },
          { key: "status", label: "Status", render: (p) => <span className={`badge ${STATUS_BADGE[p.status] || "badge-neutral"}`}>{p.status}</span> },
          { key: "created", label: "Created", render: (p) => formatDate(p.createdAt, "short") },
        ]}
        rows={data.purchaseOrders}
        onSearch={setQ}
        page={page}
        totalPages={data.pagination.pages}
        onChangePage={setPage}
        emptyMessage="No purchase orders yet"
        actions={(p) => (
          <div className="flex justify-end gap-1">
            <button className="btn-outline !p-2" onClick={() => setViewing(p)}><Eye className="h-4 w-4" /></button>
            {p.status === "draft" && <button className="btn-outline !p-2" onClick={() => changeStatus(p.id, { status: "ordered" })} title="Mark ordered"><Truck className="h-4 w-4" /></button>}
            {["ordered", "draft", "partial"].includes(p.status) && <button className="btn-outline !border-emerald-300 !text-emerald-600 !p-2" onClick={() => setReceiving(p)} title="Receive stock"><CheckCircle2 className="h-4 w-4" /></button>}
            {["draft", "ordered"].includes(p.status) && <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setCancelling(p)} title="Cancel"><XCircle className="h-4 w-4" /></button>}
          </div>
        )}
      />

      {creating && <CreatePOModal po={creating} setPo={setCreating} submit={(b) => {
        setBusy(true);
        return fetch("/api/admin/purchase-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })
          .then(async (r) => { const d = await r.json(); if (!r.ok) { setBusy(false); return { ok: false, msg: d.error }; } setBusy(false); notify("Purchase order created."); setCreating(null); await load(); router.refresh(); return { ok: true }; });
      }} busy={busy} />}

      {viewing && <ViewPOModal po={viewing} setPo={setViewing} />}
      {receiving && <ReceivePOModal po={receiving} setPo={setReceiving} submit={changeStatus} busy={busy} />}
      {cancelling && <ConfirmPOModal po={cancelling} setPo={setCancelling} submit={changeStatus} busy={busy} />}

      {toast && <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}

function SelectProducts({ value, onChange }) {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/products?all=1&limit=50");
      setProducts((await res.json()).products || []);
    })();
  }, []);
  return (
    <select className="input h-9 flex-1 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select product</option>
      {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` · ${p.sku}` : ""}</option>)}
    </select>
  );
}

function CreatePOModal({ po, setPo, submit, busy }) {
  const [suppliers, setSuppliers] = useState([]);
  useEffect(() => { (async () => { const r = await fetch("/api/admin/suppliers?all=1"); setSuppliers((await r.json()).suppliers || []); })(); }, []);

  const run = async (e) => {
    e.preventDefault();
    const res = await submit({
      supplierId: po.supplierId,
      referenceNo: po.referenceNo,
      expectedAt: po.expectedAt || null,
      items: po.items.filter((i) => i.productId).map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitCost: Number(i.unitCost || 0) })),
    });
    if (res && !res.ok) alert(res.msg || "Failed to create purchase order");
  };

  const total = po.items.reduce((s, i) => s + (i.productId ? Number(i.quantity || 0) * Number(i.unitCost || 0) : 0), 0);

  return (
    <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPo(null)}>
      <form onSubmit={run} className="card relative max-h-[92vh] w-full max-w-2xl space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">New purchase order</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Supplier *</label>
            <select className="input" required value={po.supplierId} onChange={(e) => setPo({ ...po, supplierId: e.target.value })}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Reference no.</label>
            <input className="input" value={po.referenceNo} onChange={(e) => setPo({ ...po, referenceNo: e.target.value })} placeholder="auto (PO-<timestamp>)" />
          </div>
          <div>
            <label className="label">Expected delivery</label>
            <input type="date" className="input" value={po.expectedAt || ""} onChange={(e) => setPo({ ...po, expectedAt: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Line items</label>
          <div className="space-y-2">
            {po.items.map((item, i) => (
              <div key={i} className="flex flex-col gap-2 border border-slate-200 p-2 rounded-lg sm:flex-row sm:items-center dark:border-slate-700">
                <SelectProducts value={item.productId} onChange={(v) => setPo({ ...po, items: po.items.map((x, j) => j === i ? { ...x, productId: v } : x) })} />
                <input type="number" min="1" className="input h-9 !w-24 text-sm" placeholder="Qty" value={item.quantity} onChange={(e) => setPo({ ...po, items: po.items.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x) })} />
                <input type="number" min="0" step="0.01" className="input h-9 !w-28 text-sm" placeholder="Unit cost" value={item.unitCost} onChange={(e) => setPo({ ...po, items: po.items.map((x, j) => j === i ? { ...x, unitCost: e.target.value } : x) })} />
                <button type="button" className="btn-outline !p-2" onClick={() => setPo({ ...po, items: po.items.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-outline mt-2" onClick={() => setPo({ ...po, items: [...po.items, { productId: "", quantity: 1, unitCost: "" }] })}><PlusCircle className="mr-1 inline h-4 w-4" /> Add item</button>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="font-bold">Total: {formatPrice(total)}</p>
          <div className="flex gap-2">
            <button type="button" className="btn-outline" onClick={() => setPo(null)}>Cancel</button>
            <button className="btn-primary" disabled={busy || !po.supplierId || !po.items.some((i) => i.productId)}>{busy ? "Creating…" : "Create PO"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ViewPOModal({ po, setPo }) {
  const remaining = po.items.reduce((n, i) => n + (i.quantity - i.receivedQty), 0);
  return (
    <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPo(null)}>
      <div className="card relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{po.referenceNo}</h3>
            <p className="text-sm text-slate-500">Supplier: {po.supplier?.name} · Placed {formatDate(po.createdAt)}</p>
            <span className={`badge mt-1 ${STATUS_BADGE[po.status] || "badge-neutral"}`}>{po.status}</span>
          </div>
          <button className="btn-outline !p-2" onClick={() => setPo(null)}>Close</button>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th className="py-2">Product</th><th className="py-2">Qty</th><th className="py-2">Received</th><th className="py-2">Unit cost</th><th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((i) => (
              <tr key={i.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2 font-medium">{i.product?.name}<p className="text-xs text-slate-400">{i.product?.sku}</p></td>
                <td className="py-2">{i.quantity}</td>
                <td className="py-2">{i.receivedQty}</td>
                <td className="py-2">{formatPrice(i.unitCost)}</td>
                <td className="py-2 text-right">{formatPrice(Number(i.unitCost) * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pt-3 text-right font-bold">Total: {formatPrice(po.totalAmount)}</div>
        {po.status === "received" && <p className="text-xs text-slate-500">Received {formatDate(po.receivedAt)}. {remaining <= 0 ? "Full order received." : `${remaining} units still outstanding.`}</p>}
      </div>
    </div>
  );
}

function ReceivePOModal({ po, setPo, submit, busy }) {
  const [receive, setReceive] = useState(() => {
    const m = {};
    po.items.forEach((i) => { m[i.id] = i.quantity - i.receivedQty; });
    return m;
  });

  const run = (e) => {
    e.preventDefault();
    submit(po.id, {
      status: "received",
      items: po.items.map((i) => ({ itemId: i.id, receivedQty: Number(receive[i.id] || 0) })),
    });
  };

  const pending = po.items.reduce((n, i) => n + (i.quantity - i.receivedQty), 0);

  return (
    <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPo(null)}>
      <form onSubmit={run} className="card relative max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Receive stock — {po.referenceNo}</h3>
        <p className="text-sm text-slate-500">Receiving adds units to product &amp; inventory and writes a restock log. Leave 0 to keep a line outstanding.</p>
        {po.items.map((i) => {
          const outstanding = i.quantity - i.receivedQty;
          return (
            <div key={i.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex-1">
                <p className="font-medium text-sm">{i.product?.name}</p>
                <p className="text-xs text-slate-400">{outstanding} outstanding of {i.quantity}</p>
              </div>
              <input type="number" min="0" max={outstanding} className="input h-9 !w-24 text-sm" value={receive[i.id] ?? 0}
                onChange={(e) => setReceive({ ...receive, [i.id]: Math.min(outstanding, Math.max(0, Number(e.target.value))) })} />
            </div>
          );
        })}
        <p className="text-xs text-slate-500">Receiving {Object.values(receive).reduce((a, b) => a + (Number(b) || 0), 0)} of {pending} outstanding units.</p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={() => setPo(null)}>Cancel</button>
          <button className="btn-primary" disabled={busy || Object.values(receive).every((v) => Number(v) === 0)}>{busy ? "Working…" : "Receive stock"}</button>
        </div>
      </form>
    </div>
  );
}

function ConfirmPOModal({ po, setPo, submit, busy }) {
  return (
    <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPo(null)}>
      <div className="card relative w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Cancel {po.referenceNo}?</h3>
        <p className="mt-1 text-sm text-slate-500">No stock will be received. This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setPo(null)}>Keep PO</button>
          <button className="btn-primary !bg-red-600 hover:!bg-red-700" disabled={busy} onClick={() => submit(po.id, { status: "cancelled" })}>{busy ? "Saving…" : "Cancel PO"}</button>
        </div>
      </div>
    </div>
  );
}