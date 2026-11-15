"use client";

import { useState } from "react";
import { Check, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function ColorPicker3D({ label, colors = [], value, onChange }) {
  return (
    <div>
      {label && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            aria-label={`Color ${c}`}
            title={c}
            style={{ backgroundColor: c }}
            className={cn("flex h-8 w-8 items-center justify-center rounded-full border-2 transition",
              value === c ? "border-brand-600 ring-2 ring-brand-600/30" : "border-slate-300 hover:scale-110 dark:border-slate-600")}
          >
            {value === c && (c === "#ffffff" || c === "#e5e7eb" || c === "#f5f5f4" ? (
              <Check className="h-4 w-4 text-slate-800" />
            ) : (
              <Check className="h-4 w-4 text-white" />
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MaterialPicker3D({ label, options = [], value, onChange }) {
  return (
    <div>
      {label && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const item = typeof opt === "string" ? { id: opt, label: opt } : opt;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium transition capitalize",
                value === item.id
                  ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "border-slate-300 hover:border-slate-400 dark:border-slate-700")}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FinishPicker3D({ label, value, onChange }) {
  const finishes = [
    { id: "matte", label: "Matte" },
    { id: "glossy", label: "Glossy" },
    { id: "metallic", label: "Metallic" },
    { id: "satin", label: "Satin" },
  ];
  return (
    <div>
      {label && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {finishes.map((f) => (
          <button key={f.id} onClick={() => onChange(f.id)}
            className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition",
              value === f.id ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-slate-300 hover:border-slate-400 dark:border-slate-700")}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VariantSelector3D({ label, variants = [], value, onChange }) {
  const options = [...new Set(variants.map((v) => v.name))];
  return (
    <div>
      {label && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((name) => {
          const v = variants.find((x) => x.name === name);
          return (
            <button key={name} onClick={() => onChange(v?.id || name)} disabled={!v?.isActive}
              className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-40",
                value === (v?.id || name)
                  ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "border-slate-300 hover:border-slate-400 dark:border-slate-700")}>
              {name}
              {v?.stockQuantity === 0 && <span className="ml-1 text-xs text-red-500">· Sold out</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CreateArHint() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center">
      <p className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs text-white backdrop-blur">
        <ScanLine className="h-3.5 w-3.5" /> Drag to rotate · Scroll to zoom · Right-drag to pan
      </p>
    </div>
  );
}