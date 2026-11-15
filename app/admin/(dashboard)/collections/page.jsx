"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function AdminCollectionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/collections?q=${encodeURIComponent(q)}`);
      const d = await res.json();
      setRows(d.collections || []);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const form = editing || { name: "", slug: "", description: "", imageUrl: "", isActive: true };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/collections", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setEditing(null); await load(); router.refresh(); }
  };

  const remove = async () => {
    await fetch(`/api/admin/collections?id=${pendingDelete}`, { method: "DELETE" });
    setPendingDelete(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Collections</h2>
        {!editing && <button className="btn-primary" onClick={() => setEditing({ name: "", slug: "", description: "", imageUrl: "", isActive: true, isNew: true })}><Plus className="mr-1 inline h-4 w-4" /> New collection</button>}
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name", render: (c) => <span className="font-semibold">{c.name}</span> },
          { key: "slug", label: "Slug", render: (c) => <code>{c.slug}</code> },
          { key: "products", label: "Products", render: (c) => c._count?.products ?? 0 },
          { key: "active", label: "Status", render: (c) => c.isActive ? <span className="badge badge-success">active</span> : <span className="badge badge-neutral">inactive</span> },
        ]}
        rows={rows}
        onSearch={setQ}
        emptyMessage="No collections yet"
        actions={(c) => (
          <div className="flex justify-end gap-1">
            <button className="btn-outline !p-2" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></button>
            <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete(c.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {editing && (
        <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={submit} className="card relative max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing.isNew ? "New collection" : "Edit collection"}</h3>
            <div><label className="label">Name *</label><input className="input" value={form.name} required onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><label className="label">Slug</label><input className="input" value={form.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
            <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><label className="label">Image URL</label><input className="input" value={form.imageUrl || ""} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} /></div>
            <div className="flex items-end"><label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!form.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!pendingDelete} title="Delete this collection?" message="Products will remain, but lose their collection grouping." confirmText="Delete" onConfirm={remove} onClose={() => setPendingDelete(null)} />
    </div>
  );
}