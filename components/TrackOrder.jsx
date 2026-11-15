"use client";

import { cn } from "@/lib/utils";

export function TrackOrder({ status, flow, flowIndex, cancelled, shipment }) {
  const steps = flow.map((s) => s.replace(/_/g, " "));

  if (cancelled) {
    return (
      <div className="card flex items-center gap-3 p-5 text-sm">
        <span className="badge bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">Order cancelled</span>
        {shipment?.trackingNumber && <span>Tracking: {shipment.trackingNumber}</span>}
      </div>
    );
  }

  const current = flowIndex >= 0 ? flowIndex : 0;

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-bold">Order status</h2>
        <span className="text-sm font-semibold capitalize text-brand-600">{status.replace(/_/g, " ")}</span>
      </div>
      <ol className="flex items-center">
        {steps.map((step, i) => {
          const done = i <= current;
          return (
            <li key={step} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
              <div className="flex flex-col items-center gap-1">
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                  done ? "border-brand-600 bg-brand-600 text-white" : i === current ? "border-brand-600 text-brand-600" : "border-slate-300 text-slate-400 dark:border-slate-600")}>
                  {i + 1}
                </span>
                <span className={cn("text-[10px] capitalize", done ? "font-semibold text-slate-800 dark:text-slate-100" : "text-slate-400")}>{step}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("mx-1 mt-0 h-1 flex-1 rounded", i < current ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-700")} />
              )}
            </li>
          );
        })}
      </ol>
      {shipment?.trackingNumber && (
        <p className="mt-4 text-xs text-slate-500">Courier: {shipment.provider || "—"} · Tracking no: {shipment.trackingNumber}</p>
      )}
    </div>
  );
}