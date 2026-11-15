"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatDate } from "@/lib/utils";

export default function AdminCouponsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/coupons");
    setRows((await res.json()).coupons || []);
  };
  useEffect(() => { load(); }, []);

  const form = editing || {
    code: "", description: "", type: "percent", value: "", maxDiscount: "",
    minOrderAmount: "", usageLimit: "", perUserLimit: "", startsAt: "", expiresAt: "", isActive: true, isNew: true,
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/coupons", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setEditing(null); await load(); router.refresh(); }
  };

  const remove = async () => {
    await fetch(`/api/coupons?id=${pendingDelete}`, { method: "DELETE" });
    setPendingDelete(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Coupons</h2>
        <button className="btn-primary" onClick={() => setEditing({ code: "", description: "", type: "percent", value: "", maxDiscount: "", minOrderAmount: "", usageLimit: "", perUserLimit: "", startsAt: "", expiresAt: "", isActive: true, isNew: true })}><Plus className="mr-1 inline h-4 w-4" /> New coupon</button>
      </div>

      <DataTable
        columns={[
          { key: "code", label: "Code", render: (c) => <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-bold dark:bg-slate-800">{c.code}</span> },
          { key: "type", label: "Type", render: (c) => <span className="badge badge-info">{c.type}</span> },
          { key: "value", label: "Value", render: (c) => c.type === "percent" ? `${c.value}%` : `₹${c.value}` },
          { key: "used", label: "Used", render: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
          { key: "active", label: "Status", render: (c) => c.isActive ? <span className="badge badge-success">active</span> : <span className="badge badge-neutral">inactive</span> },
          { key: "expiresAt", label: "Expires", render: (c) => c.expiresAt ? formatDate(c.expiresAt, "short") : "—" },
        ]}
        rows={rows}
        emptyMessage="No coupons yet"
        actions={(c) => (
          <div className="flex justify-end gap-1">
            <button className="btn-outline !p-2" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></button>
            <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete(c.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={submit} className="card relative max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing.isNew ? "New coupon" : `Edit ${editing.code}`}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Code *</label><input className="input" value={form.code} required onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></div>
              <div><label className="label">Type</label>
                <select className="input" value={form.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </div>
              <div><label className="label">Value</label><input type="number" className="input" value={form.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} /></div>
              <div><label className="label">Max discount</label><input type="number" className="input" value={form.maxDiscount} onChange={(e) => setEditing({ ...editing, maxDiscount: e.target.value })} /></div>
              <div><label className="label">Min order amount</label><input type="number" className="input" value={form.minOrderAmount} onChange={(e) => setEditing({ ...editing, minOrderAmount: e.target.value })} /></div>
              <div><label className="label">Usage limit</label><input type="number" className="input" value={form.usageLimit} onChange={(e) => setEditing({ ...editing, usageLimit: e.target.value })} /></div>
              <div><label className="label">Per-user limit</label><input type="number" className="input" value={form.perUserLimit} onChange={(e) => setEditing({ ...editing, perUserLimit: e.target.value })} /></div>
              <div className="flex h-full items-end pb-1"><label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!form.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label></div>
              <div><label className="label">Starts</label><input type="date" className="input" value={(form.startsAt || "").slice(0, 10)} onChange={(e) => setEditing({ ...editing, startsAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : "" })} /></div>
              <div><label className="label">Expires</label><input type="date" className="input" value={(form.expiresAt || "").slice(0, 10)} onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value ? `${e.target.value}T23:59:59.000Z` : "" })} /></div>
            </div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!pendingDelete} title="Delete coupon?" message="Coupons already applied to orders remain intact." confirmText="Delete" onConfirm={remove} onClose={() => setPendingDelete(null)} />
    </div>
  );
}