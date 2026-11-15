"use client";

import { useEffect, useState } from "react";
import { Truck, Plus, Trash2 } from "lucide-react";

export default function AdminShippingPage() {
  const [data, setData] = useState({ rules: {}, defaultRate: null, ordersWithShipping: [] });
  const [flatRule, setFlatRule] = useState("");
  const [freeThreshold, setFreeThreshold] = useState("");
  const [zones, setZones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/shipping");
    const d = await res.json();
    setData(d);
    const rules = d.rules || {};
    setFlatRule(rules["shipping.flatRate"] ?? "");
    setFreeThreshold(rules["shipping.freeThreshold"] ?? "");
    try {
      setZones(JSON.parse(rules["shipping.zones"] || "[]"));
    } catch {
      setZones([]);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const rules = [
      { key: "shipping.flatRate", value: flatRule },
      { key: "shipping.freeThreshold", value: freeThreshold },
      { key: "shipping.defaultRate", value: flatRule },
      { key: "shipping.zones", value: JSON.stringify(zones) },
    ];
    const res = await fetch("/api/admin/shipping", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    });
    setSaving(false);
    if (res.ok) { setToast("Shipping settings saved"); setTimeout(() => setToast(""), 2500); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Shipping & zones</h2>

      <div className="card space-y-4 p-5">
        <h3 className="flex items-center gap-2 font-bold"><Truck className="h-4 w-4 text-brand-600" /> Rates</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Flat rate (INR)</label><input type="number" className="input" value={flatRule} onChange={(e) => setFlatRule(e.target.value)} /></div>
          <div><label className="label">Free shipping threshold (INR)</label><input type="number" className="input" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} /></div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Delivery zones</p>
            <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setZones([...zones, { name: "", countries: "", rate: "", minDays: 3, maxDays: 7 }])}><Plus className="mr-1 inline h-3.5 w-3.5" /> Add zone</button>
          </div>
          <div className="space-y-2">
            {zones.length === 0 && <p className="text-sm text-slate-400">No zones defined — flat rate applies everywhere.</p>}
            {zones.map((z, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_100px_100px_auto] dark:border-slate-800">
                <input className="input !py-1.5 text-sm" placeholder="Zone name" value={z.name} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <input className="input !py-1.5 text-sm" placeholder="Countries (comma)" value={z.countries} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, countries: e.target.value } : x))} />
                <input className="input !py-1.5 text-sm" placeholder="Rate (INR)" type="number" value={z.rate} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))} />
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <input type="number" className="input !w-12 !py-1.5" value={z.minDays} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, minDays: Number(e.target.value) } : x))} />
                  —<input type="number" className="input !w-12 !py-1.5" value={z.maxDays} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, maxDays: Number(e.target.value) } : x))} /> days
                </span>
                <button className="btn-outline !p-2" onClick={() => setZones(zones.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-bold">Recent orders with shipping</h3>
        {data.ordersWithShipping.length === 0 ? <p className="text-sm text-slate-400">No shipped orders yet</p> : (
          <div className="space-y-2 text-sm">
            {data.ordersWithShipping.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                <span className="font-semibold">{o.orderNumber}</span>
                <span className="text-slate-500">{o.shippingAddress?.state} {o.shippingAddress?.postalCode}</span>
                <span className="font-bold">{formatPrice(o.shippingTotal)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className="fixed bottom-6 right-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}

function formatPrice(v) {
  return `₹${Number(v).toLocaleString("en-IN")}`;
}