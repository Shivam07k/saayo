import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import { Bell } from "lucide-react";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black">Notifications</h1>
      </header>
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="Order updates and offers will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className={cn("card flex items-start justify-between gap-3 p-5", !n.read && "border-brand-200 dark:border-brand-800")}>
              <div>
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-slate-500">{n.body}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
              </div>
              {n.orderId && <Link href={`/account/orders/${n.orderId}`} className="btn-outline btn-sm shrink-0">View</Link>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}