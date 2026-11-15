"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/StoreProvider";

export default function ProfileForm({ user }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [errors, setErrors] = useState({});
  const [pwErrors, setPwErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErrors(data.fieldErrors || { form: data.error || "Could not update profile" });
      return;
    }
    toast("Profile updated");
    router.refresh();
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    setPwErrors({});
    const res = await fetch("/api/account/profile/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pw),
    });
    const data = await res.json();
    setPwLoading(false);
    if (!res.ok) {
      setPwErrors(data.fieldErrors || { form: data.error || "Could not change password" });
      return;
    }
    toast("Password changed");
    setPw({ currentPassword: "", newPassword: "" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="card p-6">
        <h2 className="mb-4 text-lg font-bold">Profile details</h2>
        {errors.form && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{errors.form}</div>}
        <label className="label">Name</label>
        <input className="input mb-4" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <label className="label">Email <span className="text-slate-400">(cannot change)</span></label>
        <input className="input mb-4" value={user.email} disabled />
        <label className="label">Phone</label>
        <input className="input mb-4" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button className="btn-primary" disabled={loading}>{loading ? "Saving…" : "Save changes"}</button>
      </form>

      <form onSubmit={changePassword} className="card p-6">
        <h2 className="mb-4 text-lg font-bold">Change password</h2>
        {pwErrors.form && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{pwErrors.form}</div>}
        <label className="label">Current password</label>
        <input type="password" className="input mb-4" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
        <label className="label">New password</label>
        <input type="password" className="input mb-4" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required minLength={8} />
        {pwErrors.newPassword && <p className="mb-2 text-xs text-red-500">{pwErrors.newPassword}</p>}
        <button className="btn-outline" disabled={pwLoading}>{pwLoading ? "Updating…" : "Update password"}</button>
      </form>
    </div>
  );
}