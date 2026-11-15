"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/DataTable";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [data, setData] = useState({ logs: [], pagination: { page: 1, pages: 1 } });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(async () => {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      setData(await res.json());
    }, 300);
    return () => clearTimeout(t);
  }, [page, q]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Audit logs</h2>
      <DataTable
        columns={[
          { key: "action", label: "Action", render: (l) => <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">{l.action}</span> },
          { key: "user", label: "User", render: (l) => l.user?.name || <span className="text-slate-400">system</span> },
          { key: "entity", label: "Entity", render: (l) => <div><p className="text-xs text-slate-400">{l.entityType || "—"}</p><p className="font-mono text-xs">{l.entityId ? l.entityId.slice(0, 8) : ""}</p></div> },
          { key: "ip", label: "IP", render: (l) => l.ip || "—" },
          { key: "createdAt", label: "Time", render: (l) => formatDate(l.createdAt, "medium") },
        ]}
        rows={data.logs}
        onSearch={setQ}
        page={page}
        totalPages={data.pagination.pages}
        onChangePage={setPage}
        emptyMessage="No audit entries yet"
      />
    </div>
  );
}