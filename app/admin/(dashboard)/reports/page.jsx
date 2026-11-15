import Link from "next/link";
import { Download } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getAdminStats } from "@/lib/adminReports";
import StatCard from "@/components/admin/StatCard";
import SalesChart from "@/components/admin/SalesChart";
import { Wallet, ShoppingBag, Package, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const stats = await getAdminStats();

  const EXPORTS = [
    { type: "orders", label: "Orders CSV" },
    { type: "products", label: "Products CSV" },
    { type: "customers", label: "Customers CSV" },
    { type: "inventory", label: "Inventory CSV" },
    { type: "models", label: "3D Models CSV" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Reports & analytics</h2>
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map((e) => (
            <a key={e.type} href={`/api/admin/export?type=${e.type}`} className="btn-outline !px-3 !py-1.5 text-xs">
              <Download className="mr-1 inline h-3.5 w-3.5" /> {e.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (30d)" value={formatPrice(stats.revenueMonth)} icon={Wallet} tone="emerald" />
        <StatCard label="Orders (30d)" value={stats.orderCount} icon={ShoppingBag} tone="amber" />
        <StatCard label="Products" value={stats.productCount} icon={Package} tone="rose" />
        <StatCard label="Customers" value={stats.userCount} icon={Users} tone="brand" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SalesChart data={stats.series} />
        <div className="card p-5">
          <h3 className="mb-3 font-bold">Sales by payment method</h3>
          {stats.paymentBreakdown.length === 0 ? <p className="text-sm text-slate-400">No paid orders yet</p> : (
            <div className="space-y-3">
              {stats.paymentBreakdown.map((p) => {
                const pct = stats.revenueMonth ? Math.round((p.total / stats.revenueMonth) * 100) : 0;
                return (
                  <div key={p.method}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize font-medium">{p.method || "other"}</span>
                      <span className="font-bold">{formatPrice(p.total)} · {pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-indigo-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-bold">Bestsellers (last 30 days)</h3>
        {stats.bestsellers.length === 0 ? <p className="text-sm text-slate-400">No sales data yet</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
                  <th className="px-2 py-2 font-semibold">#</th>
                  <th className="px-2 py-2 font-semibold">Product</th>
                  <th className="px-2 py-2 font-semibold">Sold</th>
                  <th className="px-2 py-2 font-semibold">Stock left</th>
                </tr>
              </thead>
              <tbody>
                {stats.bestsellers.map((p, i) => (
                  <tr key={p.name} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-2 py-2 font-black text-slate-400">{i + 1}</td>
                    <td className="px-2 py-2 font-semibold">
                      <Link href="/admin/products" className="hover:underline">{p.name}</Link>
                    </td>
                    <td className="px-2 py-2">{p.sold}</td>
                    <td className={`px-2 py-2 ${p.stock <= 5 ? "font-bold text-red-500" : ""}`}>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}