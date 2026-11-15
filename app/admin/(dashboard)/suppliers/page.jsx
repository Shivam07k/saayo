"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function AdminSuppliersPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/suppliers?q=${encodeURIComponent(q)}`);
      setRows((await res.json()).suppliers || []);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const form = editing || { name: "", email: "", phone: "", address: "", isActive: true };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/suppliers", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setEditing(null); await refresh(); router.refresh(); }
  };
  const refresh = async () => {
    const res = await fetch(`/api/admin/suppliers?q=${encodeURIComponent(q)}`);
    setRows((await res.json()).suppliers || []);
  };

  const remove = async () => {
    await fetch(`/api/admin/suppliers?id=${pendingDelete}`, { method: "DELETE" });
    setPendingDelete(null);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Suppliers</h2>
        {!editing && <button className="btn-primary" onClick={() => setEditing({ name: "", email: "", phone: "", address: "", isActive: true, isNew: true })}><Plus className="mr-1 inline h-4 w-4" /> New supplier</button>}
      </div>

      <div className="card rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 p-4 text-sm text-slate-600 dark:bg-slate-800/50">
        Suppliers feed your <strong>Purchase Orders</strong> workflow — create a PO, then receive stock to top up inventory automatically.
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name", render: (s) => <span className="font-semibold">{s.name}</span> },
          { key: "email", label: "Email", render: (s) => s.email || "—" },
          { key: "phone", label: "Phone", render: (s) => s.phone || "—" },
          { key: "pos", label: "Purchase orders", render: (s) => s._count?.purchaseOrders ?? 0 },
          { key: "active", label: "Status", render: (s) => s.isActive ? <span className="badge badge-success">active</span> : <span className="badge badge-neutral">inactive</span> },
        ]}
        rows={rows}
        onSearch={setQ}
        emptyMessage="No suppliers yet"
        actions={(s) => (
          <div className="flex justify-end gap-1">
            <LinkBtn s={s} setEditing={setEditing} />
            <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete(s.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {editing && (
        <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={submit} className="card relative w-full max-w-md space-y-3 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing.isNew ? "New supplier" : "Edit supplier"}</h3>
            <div><label className="label">Name *</label><input className="input" value={form.name} required onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Email</label><input type="email" className="input" value={form.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
            </div>
            <div><label className="label">Address</label><textarea className="input" rows={2} value={form.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
            <div className="flex items-end"><label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!form.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!pendingDelete} title="Delete this supplier?" message="Their purchase history is removed too. Deactivate instead if you may order from them again." confirmText="Delete" onConfirm={remove} onClose={() => setPendingDelete(null)} />
    </div>
  );
}

function LinkBtn({ s, setEditing }) {
  return <button className="btn-outline !p-2" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></button>;
}