"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import { formatBytes, formatDate } from "@/lib/utils";

export default function Admin3DModelsPage() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ productId: "", name: "Default", url: "", format: "glb", isDefault: false, arEnabled: true, arScale: 1, autoRotate: true, environment: "studio" });
  const [toast, setToast] = useState("");

  const load = async () => {
    const res = await fetch("/api/3d-models");
    setRows((await res.json()).models || []);
    const res2 = await fetch("/api/products?limit=50");
    setProducts((await res2.json()).products || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/3d-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setToast("3D model attached");
      setTimeout(() => setToast(""), 2500);
      setOpen(null);
      await load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">3D models</h2>
        <button className="btn-primary" onClick={() => setOpen(true)}>Attach model</button>
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Model", render: (m) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-indigo-700 text-white"><Box className="h-4 w-4" /></div><div><p className="font-semibold">{m.name}</p><p className="text-xs text-slate-400">{m.format.toUpperCase()}{m.sizeBytes ? ` · ${formatBytes(m.sizeBytes)}` : ""}</p></div></div> },
          { key: "product", label: "Product", render: (m) => m.product ? <Link href={`/admin/products/${m.product.id}`} className="hover:underline">{m.product.name}</Link> : "—" },
          { key: "ar", label: "AR", render: (m) => m.arEnabled ? <span className="badge badge-success">enabled</span> : <span className="badge badge-neutral">off</span> },
          { key: "default", label: "Default", render: (m) => m.isDefault ? "★" : "—" },
          { key: "createdAt", label: "Added", render: (m) => formatDate(m.createdAt, "short") },
        ]}
        rows={rows}
        emptyMessage="No 3D models yet"
        actions={(m) => (
          <a href={m.url} target="_blank" rel="noreferrer" className="btn-outline !px-3 !py-1.5 text-xs">View</a>
        )}
      />

      <div className="card p-5">
        <h3 className="mb-2 font-bold">Tips</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-500">
          <li>Host <code>glb</code> on Cloudinary (raw), S3, or <code>/public/models</code> for testing.</li>
          <li>Run <code>npm run gen:models</code> to generate <code>/models/sample-tshirt.glb</code> and <code>/models/sample-tshirt-oversized.glb</code>.</li>
          <li>The tee model exposes <code>body</code>, <code>sleeves</code>, <code>collar</code> (and <code>pocket</code>) material nodes for color &amp; finish picking.</li>
        </ul>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(null)}>
          <form onSubmit={submit} className="card relative w-full max-w-md space-y-3 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Attach a 3D model</h3>
            <div><label className="label">Product *</label>
              <select className="input" required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">GLB URL *</label><input className="input" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="/models/sample-tshirt.glb" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Format</label>
                <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                  <option value="glb">glb</option><option value="gltf">gltf</option>
                </select>
              </div>
              <div><label className="label">AR scale</label><input type="number" step="0.1" className="input" value={form.arScale} onChange={(e) => setForm({ ...form, arScale: Number(e.target.value) })} /></div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> Default view</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={form.arEnabled} onChange={(e) => setForm({ ...form, arEnabled: e.target.checked })} /> Enable AR</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={form.autoRotate} onChange={(e) => setForm({ ...form, autoRotate: e.target.checked })} /> Auto-rotate</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setOpen(null)}>Cancel</button>
              <button className="btn-primary">Save model</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}