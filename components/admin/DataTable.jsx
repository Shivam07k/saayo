"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function DataTable({
  columns, rows, keyField = "id", searchable = true, onSearch, page, totalPages,
  onChangePage, actions, emptyMessage = "No records found",
}) {
  const [q, setQ] = useState("");

  return (
    <div className="card overflow-hidden">
      {(searchable || onSearch || page) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          {searchable && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input !pl-9"
                placeholder="Search…"
                value={q}
                onChange={(e) => { setQ(e.target.value); onSearch?.(e.target.value); }}
              />
            </div>
          )}
          {page !== undefined && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              Page {page} of {totalPages || 1}
              <button className="btn-outline !p-1.5" disabled={page <= 1} onClick={() => onChangePage?.(page - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="btn-outline !p-1.5" disabled={page >= (totalPages || 1)} onClick={() => onChangePage?.(page + 1)} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-semibold">{col.label}</th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-slate-400">{emptyMessage}</td></tr>
            )}
            {rows.map((row, i) => (
              <tr key={row[keyField] ?? i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-900/60">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">{actions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}