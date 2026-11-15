"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Copy, Trash2, Archive, Eye } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatPrice, formatDate } from "@/lib/utils";

export default function AdminProductsPage() {
  const router = useRouter();
  const [data, setData] = useState({ products: [], pagination: { count: 0, page: 1, pages: 1 } });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [categoryId, setCategoryId] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const catsRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (q) params.set("q", q);
      if (showAll) params.set("all", "1");
      const res = await fetch(`/api/products?${params}`);
      const d = await res.json();
      setData(d);
      setSelected(new Set());
    }, 300);
    return () => clearTimeout(t);
  }, [page, q, showAll]);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const reload = () => { setPage(1); router.refresh(); };

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    const ids = data.products.map((p) => p.id);
    setSelected((prev) => (prev.size === data.products.length ? new Set() : new Set(ids)));
  };

  const runBulk = async (action) => {
    if (!selected.size) return;
    setLoading(true);
    const body = { action, ids: [...selected] };
    if (action === "setCategory" && categoryId) body.categoryId = categoryId;
    const res = await fetch("/api/admin/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    const d = await res.json();
    setBulkAction(null);
    setSelected(new Set());
    if (res.ok) {
      notify(`${d.count} product(s) ${action === "delete" ? "deleted" : action === "archive" ? "archived" : action === "activate" ? "activated" : "recategorized"}.`);
      reload();
    } else {
      notify(d.error || "Bulk action failed");
    }
  };

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/categories?all=1");
      catsRef.current = ((await r.json()).categories || []).map((c) => ({ id: c.id, name: c.name }));
    })();
  }, []);

  const remove = async () => {
    setLoading(true);
    const res = await fetch(`/api/products/${pendingDelete}`, { method: "DELETE" });
    setLoading(false);
    setPendingDelete(null);
    notify(res.ok ? "Product deleted." : "Delete failed.");
    reload();
  };

  const duplicate = async (p) => {
    setLoading(true);
    const res = await fetch("/api/admin/products/duplicate", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }),
    });
    setLoading(false);
    const d = await res.json();
    if (res.ok) {
      notify(`Duplicated as draft: ${d.product.name}`);
      reload();
    } else notify(d.error || "Duplicate failed");
  };

  const columns = [
    { key: "sel", label: "", render: (p) => <input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={selected.has(p.id)} onChange={() => toggle(p.id)} /> },
    { key: "name", label: "Product", render: (p) => (
      <div className="flex items-center gap-3">
        {p.images?.[0]?.url ? <Image src={p.images[0].url} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800" />}
        <div>
          <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
          <p className="text-xs text-slate-400">{p.sku}{!p.isActive && <span className="ml-2 badge badge-warning">inactive</span>}</p>
        </div>
      </div>
    ) },
    { key: "category", label: "Category", render: (p) => p.category?.name || "—" },
    { key: "price", label: "Price", render: (p) => <span className="font-bold">{formatPrice(p.salePrice ?? p.regularPrice)}</span> },
    { key: "stock", label: "Stock", render: (p) => <span className={p.stockQuantity <= p.lowStockLimit ? "text-red-500 font-semibold" : ""}>{p.stockQuantity}</span> },
    { key: "models", label: "3D", render: (p) => p.models.length > 0 ? <span className="badge badge-success">{p.models.length}</span> : <span className="badge badge-neutral">none</span> },
    { key: "createdAt", label: "Created", render: (p) => formatDate(p.createdAt, "short") },
  ];

  const actions = (p) => (
    <div className="flex justify-end gap-1">
      <Link href={`/admin/products/${p.id}`} className="btn-outline !p-2" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>
      <button className="btn-outline !p-2" onClick={() => duplicate(p)} aria-label="Duplicate" title="Duplicate"><Copy className="h-4 w-4" /></button>
      <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete(p.id)} aria-label="Delete">Del</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black">Products <span className="text-sm font-normal text-slate-400">({data.pagination.count})</span></h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={showAll} onChange={(e) => { setShowAll(e.target.checked); setPage(1); }} className="h-4 w-4 rounded accent-brand-600" />
            Include inactive
          </label>
          <Link href="/admin/products/new" className="btn-primary"><Plus className="mr-1 inline h-4 w-4" /> New product</Link>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="card flex flex-wrap items-center gap-2 border-l-4 border-brand-600 p-3">
          <span className="text-sm font-bold text-brand-700 dark:text-brand-300">{selected.size} selected</span>
          <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
          <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => { setBulkAction("archive"); }}><Archive className="mr-1 inline h-3.5 w-3.5" />Archive</button>
          <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => runBulk("activate")}><Eye className="mr-1 inline h-3.5 w-3.5" />Activate</button>
          <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setBulkAction("setCategory")}>Move to category…</button>
          <button className="btn-outline !border-red-200 !text-red-500 !px-3 !py-1.5 text-xs" onClick={() => setBulkAction("delete")}><Trash2 className="mr-1 inline h-3.5 w-3.5" />Delete</button>
          <button className="ml-auto text-xs text-slate-400 hover:underline" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {bulkAction === "setCategory" && (
        <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setBulkAction(null)}>
          <form className="card relative w-full max-w-sm space-y-3 p-6" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (categoryId) runBulk("setCategory"); }}>
            <h3 className="text-lg font-bold">Move {selected.size} product(s) to category</h3>
            <div>
              <label className="label">Category</label>
              <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Choose category…</option>
                {catsRef.current?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setBulkAction(null)}>Cancel</button>
              <button className="btn-primary" disabled={!categoryId}>Move</button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={data.products}
        onSearch={setQ}
        page={page}
        totalPages={data.pagination.pages}
        onChangePage={setPage}
        actions={actions}
        emptyMessage={showAll ? "No products found" : "No active products found"}
      />

      <ConfirmDialog
        open={!!pendingDelete || bulkAction === "delete"}
        title={bulkAction === "delete" ? `Delete ${selected.size} products?` : "Delete this product?"}
        message={bulkAction === "delete" ? "This permanently removes the selected products, their variants, images, 3D models and inventory." : "This permanently removes the product, its variants, images and 3D models."}
        confirmText="Delete"
        onConfirm={() => (pendingDelete ? remove() : runBulk("delete"))}
        onClose={() => { setPendingDelete(null); setBulkAction(null); }}
        loading={loading}
      />

      {toast && <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}