"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Star, Tag, Image as ImageIcon,
  CreditCard, Truck, BarChart3, Shield, Settings, ScrollText, Boxes, Newspaper, MessagesSquare, Box, Undo2,
  Grid, Stamp, Shapes, Warehouse, Factory, ClipboardList, UserCog, LayoutTemplate,
} from "lucide-react";

const NAV = [
  {
    section: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null },
      { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3, permission: "reports:view" },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, permission: "audit:view" },
    ],
  },
  {
    section: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package, permission: "products:manage" },
      { href: "/admin/categories", label: "Categories", icon: Grid, permission: "categories:manage" },
      { href: "/admin/brands", label: "Brands", icon: Stamp, permission: "brands:manage" },
      { href: "/admin/collections", label: "Collections", icon: Shapes, permission: "collections:manage" },
      { href: "/admin/3d-models", label: "3D Models", icon: Box, permission: "models:manage" },
    ],
  },
  {
    section: "Stock & Supply",
    items: [
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, permission: "inventory:manage" },
      { href: "/admin/warehouses", label: "Warehouses", icon: Warehouse, permission: "warehouses:manage" },
      { href: "/admin/suppliers", label: "Suppliers", icon: Factory, permission: "suppliers:manage" },
      { href: "/admin/purchase-orders", label: "Purchase Orders", icon: ClipboardList, permission: "suppliers:manage" },
    ],
  },
  {
    section: "Sales & Customers",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, permission: "orders:manage" },
      { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers:manage" },
      { href: "/admin/customer-groups", label: "Customer Groups", icon: UserCog, permission: "customers:manage" },
      { href: "/admin/reviews", label: "Reviews", icon: Star, permission: "reviews:manage" },
      { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payments:manage" },
      { href: "/admin/refunds", label: "Refunds", icon: Undo2, permission: "returns:manage" },
      { href: "/admin/shipping", label: "Shipping & Zones", icon: Truck, permission: "shipping:manage" },
    ],
  },
  {
    section: "Marketing & Content",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: Tag, permission: "coupons:manage" },
      { href: "/admin/sections", label: "Page Sections", icon: LayoutTemplate, permission: "sections:manage" },
      { href: "/admin/banners", label: "Banners", icon: ImageIcon, permission: "banners:manage" },
      { href: "/admin/pages", label: "Pages & Blog", icon: Newspaper, permission: "pages:manage" },
      { href: "/admin/questions", label: "Questions & Subscribers", icon: MessagesSquare, permission: "customers:manage" },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/admin/staff", label: "Staff & Roles", icon: Shield, permission: "staff:manage" },
      { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
    ],
  },
];

function NavList({ user, pathname, onClick }) {
  const perms = user?.permissions || [];
  return (
    <>
      {NAV.filter((group) => group.items.some((item) => !item.permission || hasPerm(perms, item.permission))).map((group) => (
        <div key={group.section} className="mb-3">
          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.section}</p>
          <div className="space-y-0.5">
            {group.items.filter((item) => !item.permission || hasPerm(perms, item.permission)).map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClick}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export default function AdminSidebar({ user }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-indigo-700 text-lg font-black text-white">S</div>
        <div>
          <p className="text-sm font-black leading-tight">Saayo Admin</p>
          <p className="text-[11px] text-slate-400">{user?.roleName || "Staff"}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <NavList user={user} pathname={pathname} />
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <Package className="h-4 w-4" /> View Storefront
        </Link>
      </div>
    </aside>
  );
}

// Compact nav for mobile drawer
export function AdminSidebarMobile({ user, onClose }) {
  const pathname = usePathname();
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-64 overflow-y-auto bg-white shadow-xl dark:bg-slate-900">
        <nav className="space-y-0.5 p-3 pt-5">
          <NavList user={user} pathname={pathname} onClick={onClose} />
        </nav>
      </aside>
    </div>
  );
}

function hasPerm(perms, perm) {
  return perms.includes(perm) || perms.includes("dashboard:view");
}