"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function AdminBrandsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/brands");
    const d = await res.json();
    setRows(d.brands || []);
  };
  useEffect(() => { load(); }, []);

  const form = editing || { name: "", slug: "", description: "", logoUrl: "", website: "", isFeatured: false, isActive: true };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/brands", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setEditing(null); await load(); router.refresh(); }
  };

  const remove = async () => {
    await fetch(`/api/brands?id=${pendingDelete}`, { method: "DELETE" });
    setPendingDelete(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Brands</h2>
        {!editing && <button className="btn-primary" onClick={() => setEditing({ name: "", slug: "", description: "", logoUrl: "", website: "", isFeatured: false, isActive: true, isNew: true })}><Plus className="mr-1 inline h-4 w-4" /> New brand</button>}
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Brand", render: (b) => (
            <span className="flex items-center gap-2 font-semibold">
              {b.logoUrl ? <Image src={b.logoUrl} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />}
              {b.name}
            </span>
          ) },
          { key: "products", label: "Products", render: (b) => b._count?.products ?? 0 },
          { key: "featured", label: "Featured", render: (b) => b.isFeatured ? "★" : "—" },
        ]}
        rows={rows}
        emptyMessage="No brands yet"
        actions={(b) => (
          <div className="flex justify-end gap-1">
            <button className="btn-outline !p-2" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></button>
            <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete(b.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {editing && (
        <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={submit} className="card relative max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing.isNew ? "New brand" : "Edit brand"}</h3>
            <div><label className="label">Name *</label><input className="input" value={form.name} required onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><label className="label">Slug</label><input className="input" value={form.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
            <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><label className="label">Logo URL</label><input className="input" value={form.logoUrl || ""} onChange={(e) => setEditing({ ...editing, logoUrl: e.target.value })} /></div>
            <div><label className="label">Website</label><input className="input" value={form.website || ""} onChange={(e) => setEditing({ ...editing, website: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!form.isFeatured} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!form.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!pendingDelete} title="Delete brand?" message="Products keep their own data but lose the brand link." confirmText="Delete" onConfirm={remove} onClose={() => setPendingDelete(null)} />
    </div>
  );
}