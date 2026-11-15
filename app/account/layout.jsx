import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, Heart, MapPin, User, Bell } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  ["/account", "Overview", LayoutDashboard],
  ["/account/orders", "My Orders", Package],
  ["/account/wishlist", "Wishlist", Heart],
  ["/account/addresses", "Addresses", MapPin],
  ["/account/profile", "Profile", User],
  ["/account/notifications", "Notifications", Bell],
];

export default async function AccountLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="card h-fit p-3 lg:sticky lg:top-28">
        <div className="mb-3 border-b border-slate-100 px-3 pb-3 dark:border-slate-800">
          <p className="font-bold">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <nav className="space-y-1">
          {LINKS.map(([href, label, Icon]) => (
            <AccountLink key={href} href={href} label={label} Icon={Icon} />
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function AccountLink({ href, label, Icon }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900">
      <Icon className="h-4 w-4 text-slate-400" /> {label}
    </Link>
  );
}