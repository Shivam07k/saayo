"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Pencil, X } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import { formatDate } from "@/lib/utils";

export default function AdminStaffPage() {
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", roleId: "", password: "", status: "active", isNew: true });

  const load = async () => {
    const res = await fetch("/api/admin/staff");
    setRoles((await res.json()).roles || []);
  };
  useEffect(() => { load(); }, []);

  const users = roles.flatMap((r) => r.users.map((u) => ({ ...u, roleName: r.name })));

  const openNew = () => {
    setSelected(null);
    setForm({ name: "", email: "", phone: "", roleId: roles[0]?.id || "", password: "", status: "active", isNew: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/admin/staff", {
      method: form.isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: selected?.id }),
    });
    if (res.ok) {
      setToast(form.isNew ? "Staff member created" : "Staff member updated");
      setTimeout(() => setToast(""), 2500);
      await load();
      setSelected(null);
    } else {
      setToast((await res.json()).error || "Failed to save");
      setTimeout(() => setToast(""), 2500);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Staff & roles</h2>
        <button className="btn-primary" onClick={openNew}><Plus className="mr-1 inline h-4 w-4" /> Add staff</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            columns={[
              { key: "name", label: "Staff", render: (u) => <div><p className="font-semibold">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></div> },
              { key: "roleName", label: "Role", render: (u) => <span className="badge badge-info">{u.roleName}</span> },
              { key: "status", label: "Status", render: (u) => <span className={`badge ${u.status === "active" ? "badge-success" : "badge-neutral"}`}>{u.status}</span> },
              { key: "createdAt", label: "Added", render: (u) => formatDate(u.createdAt, "short") },
            ]}
            rows={users}
            actions={(u) => (
              <button className="btn-outline !p-2" onClick={() => { setSelected(u); setForm({ name: u.name, email: u.email, phone: u.phone || "", roleId: u.roleId, password: "", status: u.status, isNew: false }); }}><Pencil className="h-4 w-4" /></button>
            )}
          />
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold"><Shield className="h-4 w-4 text-brand-600" /> Roles</h3>
          </div>
          <div className="space-y-3">
            {roles.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-slate-400">{r.users.length} member(s) · {r.permissions.length} permissions</p>
              </div>
            ))}
            <p className="text-xs text-slate-500">Edit roles and their permissions in the database (Role/Permission tables) or via Prisma Studio.</p>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <form onSubmit={submit} className="card relative max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{form.isNew ? "Add staff member" : "Edit staff member"}</h3>
              <button type="button" className="btn-outline !p-1.5" onClick={() => setSelected(null)}><X className="h-4 w-4" /></button>
            </div>
            <div><label className="label">Name *</label><input className="input" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Email *</label><input type="email" className="input" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">Role</label>
              <select className="input" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div><label className="label">{form.isNew ? "Password" : "New password (leave blank to keep)"}</label><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["active", "inactive"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn-primary">{form.isNew ? "Create" : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}