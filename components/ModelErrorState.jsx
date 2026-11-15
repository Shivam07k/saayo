"use client";

import { AlertTriangle, RefreshCw, Image as ImageIcon } from "lucide-react";

export default function ModelErrorState({ onRetry, onView3D }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center dark:bg-slate-900">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h3 className="font-bold">Could not load the 3D model</h3>
      <p className="max-w-xs text-sm text-slate-500">
        The model failed to load. You can retry, or view the 2D product images instead.
      </p>
      <div className="flex gap-2">
        <button onClick={onRetry} className="btn-outline btn-sm">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
        {onView3D && (
          <button onClick={onView3D} className="btn-outline btn-sm">
            <ImageIcon className="h-3.5 w-3.5" /> View Images
          </button>
        )}
      </div>
    </div>
  );
}