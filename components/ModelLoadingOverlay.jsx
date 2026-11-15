"use client";

import { Loader2, RefreshCcw } from "lucide-react";

export default function ModelLoadingOverlay({ progress }) {
  const pct = progress !== null ? Math.round(progress) : null;
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-600" />
        <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-brand-600" />
      </div>
      {pct !== null ? (
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading 3D model… {pct}%</p>
      ) : (
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Preparing 3D model…</p>
      )}
      <p className="text-xs text-slate-400">Optimized for smooth 360° interaction</p>
    </div>
  );
}

export function ModelRefreshButton({ onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} aria-label="Refresh model"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:text-brand-600 dark:bg-slate-900/90 dark:text-slate-300">
      <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
    </button>
  );
}