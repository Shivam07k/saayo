"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/StoreProvider";
import AddressForm from "@/components/AddressForm";
import EmptyState from "@/components/EmptyState";

export default function AddressList({ addresses }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const remove = async (id) => {
    if (!confirm("Delete this address?")) return;
    const res = await fetch("/api/account/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast("Address deleted");
      router.refresh();
    }
  };

  if (addresses.length === 0 && !adding) {
    return (
      <div>
        <EmptyState icon={MapPin} title="No saved addresses" description="Add a delivery address to speed up checkout." />
        <div className="flex justify-center"><button className="btn-primary" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add address</button></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((a) => (
        <div key={a.id} className="card relative p-5">
          {editing === a.id ? (
            <AddressForm address={a} onDone={() => setEditing(null)} />
          ) : (
            <>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-bold">{a.label || a.type}</span>
                {a.isDefault && <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">Default</span>}
              </div>
              <address className="not-italic text-sm text-slate-600 dark:text-slate-400">
                <p>{a.fullName} · {a.phone}</p>
                <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                <p>{a.city}, {a.state} {a.postalCode}</p>
                <p>{a.country}</p>
              </address>
              <div className="mt-3 flex gap-2">
                <button className="btn-outline btn-sm" onClick={() => setEditing(a.id)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button className="btn-outline btn-sm text-red-500" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </>
          )}
        </div>
      ))}

      {adding ? (
        <div className="card p-5">
          <AddressForm onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button className="btn-outline w-full" onClick={() => { setAdding(true); setEditing(null); }}>
          <Plus className="h-4 w-4" /> Add new address
        </button>
      )}
    </div>
  );
}