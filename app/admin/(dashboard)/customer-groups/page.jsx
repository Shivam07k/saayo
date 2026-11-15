"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function AdminCustomerGroupsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/customer-groups");
    setRows((await res.json()).groups || []);
  };
  useEffect(() => { load(); }, []);

  const form = editing || { name: "", description: "", discountPercent: 0 };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/customer-groups", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setEditing(null); await load(); router.refresh(); }
  };

  const remove = async () => {
    await fetch(`/api/admin/customer-groups?id=${pendingDelete}`, { method: "DELETE" });
    setPendingDelete(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Customer Groups</h2>
        {!editing && <button className="btn-primary" onClick={() => setEditing({ name: "", description: "", discountPercent: 0, isNew: true })}><Plus className="mr-1 inline h-4 w-4" /> New group</button>}
      </div>

      <div className="card rounded-lg border-l-4 border-brand-600 bg-brand-50/50 p-4 text-sm text-slate-600 dark:bg-slate-800/50">
        Group customers by tier, geography or segment and give each a loyalty discount. Assign groups to customers from the Customers page.
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name", render: (c) => <span className="font-semibold">{c.name}</span> },
          { key: "description", label: "Description", render: (c) => c.description || "—" },
          { key: "discount", label: "Discount", render: (c) => <span className="badge badge-success">{Number(c.discountPercent)}%</span> },
          { key: "members", label: "Members", render: (c) => c._count?.users ?? 0 },
        ]}
        rows={rows}
        emptyMessage="No groups yet"
        actions={(c) => (
          <div className="flex justify-end gap-1">
            <button className="btn-outline !p-2" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></button>
            <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete(c.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {editing && (
        <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={submit} className="card relative w-full max-w-md space-y-3 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing.isNew ? "New group" : "Edit group"}</h3>
            <div><label className="label">Name *</label><input className="input" value={form.name} required onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><label className="label">Discount %</label><input type="number" min="0" max="100" className="input" value={form.discountPercent} onChange={(e) => setEditing({ ...editing, discountPercent: Number(e.target.value) })} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!pendingDelete} title="Delete this group?" message="Members are kept but lose their group discount." confirmText="Delete" onConfirm={remove} onClose={() => setPendingDelete(null)} />
    </div>
  );
}