"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function AdminBannersPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/banners");
    setRows((await res.json()).banners || []);
  };
  useEffect(() => { load(); }, []);

  const form = editing || { title: "", subtitle: "", image: "", link: "", position: "home-hero", sortOrder: 0, isActive: true, isNew: true };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/banners", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setEditing(null); await load(); router.refresh(); }
  };

  const remove = async () => {
    await fetch(`/api/admin/banners?id=${pendingDelete}`, { method: "DELETE" });
    setPendingDelete(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Banners</h2>
        <button className="btn-primary" onClick={() => setEditing({ title: "", subtitle: "", image: "", link: "", position: "home-hero", sortOrder: 0, isActive: true, isNew: true })}><Plus className="mr-1 inline h-4 w-4" /> New banner</button>
      </div>

      <DataTable
        columns={[
          { key: "title", label: "Banner", render: (b) => <div className="flex items-center gap-3">{b.image ? <Image src={b.image} alt="" width={64} height={40} unoptimized className="h-10 w-16 rounded-lg object-cover" /> : <div className="h-10 w-16 rounded-lg bg-slate-100 dark:bg-slate-800" />}<span className="font-semibold">{b.title}</span></div> },
          { key: "position", label: "Position", render: (b) => <span className="badge badge-neutral">{b.position}</span> },
          { key: "sortOrder", label: "Order", render: (b) => b.sortOrder },
          { key: "active", label: "Status", render: (b) => b.isActive ? <span className="badge badge-success">active</span> : <span className="badge badge-neutral">inactive</span> },
          { key: "link", label: "Link", render: (b) => b.link ? <span className="text-slate-500">{b.link}</span> : "—" },
        ]}
        rows={rows}
        emptyMessage="No banners yet"
        actions={(b) => (
          <div className="flex justify-end gap-1">
            <button className="btn-outline !p-2" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></button>
            <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete(b.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={submit} className="card relative max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing.isNew ? "New banner" : "Edit banner"}</h3>
            <div><label className="label">Title *</label><input className="input" value={form.title} required onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><label className="label">Subtitle</label><input className="input" value={form.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></div>
            <div><label className="label">Image URL</label><input className="input" value={form.image || ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></div>
            <div><label className="label">Link</label><input className="input" value={form.link || ""} onChange={(e) => setEditing({ ...editing, link: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Position</label>
                <select className="input" value={form.position} onChange={(e) => setEditing({ ...editing, position: e.target.value })}>
                  {["home-hero", "home-section", "category-top", "footer"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div><label className="label">Order</label><input type="number" className="input" value={form.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!form.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!pendingDelete} title="Delete banner?" message="This removes the banner from the storefront." confirmText="Delete" onConfirm={remove} onClose={() => setPendingDelete(null)} />
    </div>
  );
}