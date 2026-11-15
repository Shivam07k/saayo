"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/StoreProvider";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

export default function AddressForm({ address = null, onDone }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const defaults = {
    type: address?.type || "shipping",
    label: address?.label || "",
    fullName: address?.fullName || "",
    phone: address?.phone || "",
    line1: address?.line1 || "",
    line2: address?.line2 || "",
    city: address?.city || "",
    state: address?.state || "",
    postalCode: address?.postalCode || "",
    country: address?.country || "India",
    isDefault: address?.isDefault || false,
  };
  const [form, setForm] = useState(defaults);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const res = await fetch("/api/account/addresses", {
      method: address ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: address?.id }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErrors(data.fieldErrors || { form: data.error || "Could not save address" });
      return;
    }
    toast(address ? "Address updated" : "Address added");
    router.refresh();
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {errors.form && <div className="col-span-full rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/50">{errors.form}</div>}
      <div className="sm:col-span-2 grid grid-cols-2 gap-3">
        <div>
          <label className="label">Label</label>
          <input className="input" placeholder="Home / Office" value={form.label} onChange={set("label")} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={set("type")}>
            <option value="shipping">Shipping</option>
            <option value="billing">Billing</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Full name</label>
        <input className="input" value={form.fullName} onChange={set("fullName")} required />
        {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" value={form.phone} onChange={set("phone")} required />
        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
      </div>
      <div className="sm:col-span-2"><label className="label">Address line 1</label><PlaceAutocomplete value={form.line1} onChange={set("line1")} onPlace={(a) => setForm((f) => ({ ...f, line1: a.line1 || a.formattedAddress || f.line1, line2: a.line2 || f.line2, city: a.city || f.city, state: a.state || f.state, postalCode: a.postalCode || f.postalCode, country: a.country || f.country }))} /></div>
      <div className="sm:col-span-2"><label className="label">Address line 2</label><input className="input" value={form.line2} onChange={set("line2")} /></div>
      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
        <div><label className="label">City</label><input className="input" value={form.city} onChange={set("city")} required /></div>
        <div><label className="label">State</label><input className="input" value={form.state} onChange={set("state")} required /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
        <div><label className="label">Postal code</label><input className="input" value={form.postalCode} onChange={set("postalCode")} required /></div>
        <div><label className="label">Country</label><input className="input" value={form.country} onChange={set("country")} required /></div>
      </div>
      <label className="col-span-full flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isDefault} onChange={set("isDefault")} className="h-4 w-4 accent-brand-600" /> Set as default address
      </label>
      <div className="col-span-full flex justify-end gap-2">
        <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
        <button className="btn-primary" disabled={loading}>{loading ? "Saving…" : address ? "Update" : "Add Address"}</button>
      </div>
    </form>
  );
}