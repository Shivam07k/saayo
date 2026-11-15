import { requireAdmin } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Saayo Admin" };

export default async function AdminLayout({ children }) {
  const user = await requireAdmin();
  const full = await getSessionUser();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="flex">
        <AdminSidebar user={{ roleName: user.roleName, permissions: full?.permissions || [] }} />
        <div className="min-w-0 flex-1">
          <AdminHeader user={{ name: user.name, roleName: user.roleName }} />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}