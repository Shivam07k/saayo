import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { getAdminStats } from "@/lib/adminReports";
import { getSessionUser } from "@/lib/auth";
import StatCard from "@/components/admin/StatCard";
import SalesChart from "@/components/admin/SalesChart";
import { Wallet, ShoppingBag, Package, Users, TrendingUp, AlertTriangle, Star, Plus, Tag, Image as ImageIcon, Newspaper, Palette, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/admin/products/new", label: "Add product", sub: "List an item with price, sale & stock", icon: Package, grad: "from-brand-600 to-indigo-700", perm: "products:manage" },
  { href: "/admin/settings", label: "Theme & branding", sub: "Colors, logo, announcement & SEO", icon: Palette, grad: "from-fuchsia-600 to-purple-700", perm: "settings:manage" },
  { href: "/admin/banners", label: "Add banner", sub: "Homepage hero & promo sections", icon: ImageIcon, grad: "from-amber-500 to-orange-600", perm: "banners:manage" },
  { href: "/admin/coupons", label: "Create coupon", sub: "Discount codes & sales campaigns", icon: Tag, grad: "from-indigo-600 to-blue-700", perm: "coupons:manage" },
  { href: "/admin/purchase-orders", label: "New purchase order", sub: "Restock from suppliers", icon: Plus, grad: "from-rose-600 to-red-700", perm: "suppliers:manage" },
  { href: "/admin/pages", label: "Write a page", sub: "Pages, blog & info content", icon: Newspaper, grad: "from-emerald-600 to-teal-700", perm: "pages:manage" },
];

export default async function AdminDashboardPage() {
  const [stats, user] = await Promise.all([getAdminStats(), getSessionUser()]);
  const perms = user?.permissions || [];
  const actions = QUICK_ACTIONS.filter((a) => !a.perm || perms.includes(a.perm));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${a.grad} text-white shadow`}>
              <a.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-bold">{a.label} <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" /></span>
              <span className="line-clamp-1 text-xs text-slate-500">{a.sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue today" value={formatPrice(stats.revenueToday)} icon={Wallet} tone="brand" />
        <StatCard label="Revenue (30 days)" value={formatPrice(stats.revenueMonth)} icon={TrendingUp} tone="emerald" />
        <StatCard label="Orders (30 days)" value={stats.orderCount} sub={`${stats.orderCountToday} today`} icon={ShoppingBag} tone="amber" />
        <StatCard label="Active products" value={stats.productCount} icon={Package} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={stats.series} />
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 font-bold">Health</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500"><AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock items</span>
                <Link href="/admin/inventory" className="font-black">{stats.lowStock}</Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500"><ShoppingBag className="h-4 w-4 text-brand-600" /> Pending orders</span>
                <Link href="/admin/orders" className="font-black">{stats.pendingOrders}</Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500"><Star className="h-4 w-4 text-amber-500" /> Reviews to moderate</span>
                <Link href="/admin/reviews" className="font-black">{stats.reviewsPending}</Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500"><Users className="h-4 w-4 text-emerald-500" /> Customers</span>
                <span className="font-black">{stats.userCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500"><Package className="h-4 w-4 text-rose-500" /> Awaiting stock (POs)</span>
                <Link href="/admin/purchase-orders" className="font-black">{stats.openPurchaseOrders}</Link>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="mb-3 font-bold">Bestsellers</h3>
            <div className="space-y-2">
              {stats.bestsellers.length === 0 && <p className="text-sm text-slate-400">No sales yet</p>}
              {stats.bestsellers.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="line-clamp-1 text-slate-600 dark:text-slate-300">{p.name}</span>
                  <span className="ml-2 shrink-0 font-bold">{p.sold} sold</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Recent orders</h3>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand-600 dark:text-brand-400">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
                <th className="px-2 py-2 font-semibold">Order</th>
                <th className="px-2 py-2 font-semibold">Email</th>
                <th className="px-2 py-2 font-semibold">Items</th>
                <th className="px-2 py-2 font-semibold">Total</th>
                <th className="px-2 py-2 font-semibold">Payment</th>
                <th className="px-2 py-2 font-semibold">Placed</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-2 py-2 font-semibold">
                    <Link href={`/admin/orders/${o.id}`} className="text-brand-600 hover:underline dark:text-brand-400">{o.orderNumber}</Link>
                  </td>
                  <td className="px-2 py-2 text-slate-500">{o.email}</td>
                  <td className="px-2 py-2">{o._count.items}</td>
                  <td className="px-2 py-2 font-bold">{formatPrice(o.total)}</td>
                  <td className="px-2 py-2">
                    <span className={`badge ${o.paymentStatus === "paid" ? "badge-success" : o.paymentStatus === "failed" ? "badge-danger" : "badge-warning"}`}>{o.paymentStatus}</span>
                  </td>
                  <td className="px-2 py-2 text-slate-500">{formatDate(o.placedAt, "short")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}