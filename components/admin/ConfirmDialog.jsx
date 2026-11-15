"use client";

import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, title = "Are you sure?", message, confirmText = "Confirm", onConfirm, onClose, loading = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="card relative w-full max-w-sm p-6">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-950">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
        {message && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50" onClick={onConfirm} disabled={loading}>
            {loading ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}