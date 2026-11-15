"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function SalesChart({ data }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 font-bold">Sales (last 30 days)</h3>
      {(!data || data.length === 0) ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">No sales data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={288}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d?.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenue)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}