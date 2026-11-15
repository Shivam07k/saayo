"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Map as MapIcon, MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import MapView from "@/components/MapView";
import { hasMapsKey, reverseGeocode } from "@/lib/maps";

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

export default function AdminWarehousesPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/warehouses?all=${showAll ? "1" : "0"}`);
    setRows((await res.json()).warehouses || []);
  }, [showAll]);
  useEffect(() => { load(); }, [load]);

  const form = editing || { name: "", code: "", address: "", latitude: null, longitude: null, isActive: true };

  const setFormField = (k, v) => setEditing((e) => ({ ...(e || {}), [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/warehouses", {
      method: editing?.isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing?.isNew ? { ...form, isNew: undefined } : form),
    });
    setSaving(false);
    if (res.ok) { setEditing(null); await load(); router.refresh(); }
  };

  const remove = async () => {
    await fetch(`/api/admin/warehouses?id=${pendingDelete}`, { method: "DELETE" });
    setPendingDelete(null);
    await load();
  };

  const onMapPick = async ({ lat, lng }) => {
    setFormField("latitude", lat);
    setFormField("longitude", lng);
    try {
      const res = await reverseGeocode({ lat, lng });
      if (res.address && !editing?.address) setFormField("address", res.address);
    } catch { /* keep existing address text */ }
  };

  const markers = useMemo(
    () =>
      (rows || [])
        .filter((w) => typeof w.latitude === "number" && typeof w.longitude === "number")
        .map((w) => ({ lat: w.latitude, lng: w.longitude, title: w.name, info: `<b>${w.name}</b><br/>${w.address || ""}` })),
    [rows]
  );

  const mapCenter = useMemo(() => {
    const first = markers[0];
    return first ? { lat: first.lat, lng: first.lng } : DEFAULT_CENTER;
  }, [markers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black">Warehouses</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
            Show inactive
          </label>
          {hasMapsKey() && rows.length > 0 && (
            <button className="btn-outline" onClick={() => { setShowMap((s) => !s); setMapKey((k) => k + 1); }}>
              <MapIcon className="mr-1 inline h-4 w-4" /> {showMap ? "Hide map" : "Map view"}
            </button>
          )}
          {!editing && <button className="btn-primary" onClick={() => setEditing({ name: "", code: "", address: "", latitude: null, longitude: null, isActive: true, isNew: true })}><Plus className="mr-1 inline h-4 w-4" /> New warehouse</button>}
        </div>
      </div>

      {showMap && (
        <div className="card p-4">
          {markers.length === 0 ? (
            <p className="text-sm text-slate-500">No warehouses have map coordinates yet. Edit a warehouse and pick its location on the map to add a pin.</p>
          ) : (
            <MapView
              key={mapKey}
              markers={markers}
              center={mapCenter}
              zoom={5}
              className="h-96 w-full"
            />
          )}
        </div>
      )}

      <DataTable
        columns={[
          { key: "name", label: "Name", render: (w) => <span className="font-semibold">{w.name}</span> },
          { key: "code", label: "Code", render: (w) => <code>{w.code}</code> },
          { key: "address", label: "Address", render: (w) => w.address || "—" },
          { key: "location", label: "Map", render: (w) => (typeof w.latitude === "number" && typeof w.longitude === "number" ? <span className="inline-flex items-center gap-1 text-xs text-brand-600"><MapPin className="h-3.5 w-3.5" /> Pinned</span> : <span className="text-slate-400">—</span>) },
          { key: "bins", label: "Stock rows", render: (w) => w._count?.inventories ?? 0 },
          { key: "active", label: "Status", render: (w) => w.isActive ? <span className="badge badge-success">active</span> : <span className="badge badge-neutral">inactive</span> },
        ]}
        rows={rows}
        emptyMessage="No warehouses yet"
        actions={(w) => (
          <div className="flex justify-end gap-1">
            <button className="btn-outline !p-2" onClick={() => setEditing({ ...w, isNew: false })}><Pencil className="h-4 w-4" /></button>
            <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete(w.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {editing && (
        <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={submit} className="card relative max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing.isNew ? "New warehouse" : "Edit warehouse"}</h3>
            <div><label className="label">Name *</label><input className="input" value={form.name} required onChange={(e) => setFormField("name", e.target.value)} /></div>
            <div><label className="label">Code</label><input className="input" value={form.code || ""} onChange={(e) => setFormField("code", e.target.value)} placeholder="auto from name" /></div>
            <div><label className="label">Address</label><textarea className="input" rows={2} value={form.address || ""} onChange={(e) => setFormField("address", e.target.value)} /></div>

            {hasMapsKey() && (
              <div>
                <label className="label">Pin location on map</label>
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  {typeof form.latitude === "number" && typeof form.longitude === "number" ? (
                    <MapView
                      markers={[{ lat: form.latitude, lng: form.longitude, title: form.name || "Warehouse" }]}
                      center={{ lat: form.latitude, lng: form.longitude }}
                      zoom={15}
                      picker
                      onPick={onMapPick}
                      className="h-56 w-full"
                    />
                  ) : (
                    <MapView picker onPick={onMapPick} className="h-56 w-full" />
                  )}
                </div>
                {typeof form.latitude === "number" && typeof form.longitude === "number" && (
                  <p className="mt-1 text-xs text-slate-500">Pin set · {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)} — click the map to move it.</p>
                )}
              </div>
            )}

            <div className="flex items-end"><label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!form.isActive} onChange={(e) => setFormField("isActive", e.target.checked)} /> Active</label></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!pendingDelete} title="Delete this warehouse?" message="Remove it only if it has no inventory rows, otherwise deactivate it instead." confirmText="Delete" onConfirm={remove} onClose={() => setPendingDelete(null)} />
    </div>
  );
}