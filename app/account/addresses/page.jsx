import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import AddressList from "@/components/AddressList";
import EmptyState from "@/components/EmptyState";
import { MapPin } from "lucide-react";

export const metadata = { title: "My Addresses" };

export default async function AddressesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { isDefault: "desc" },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black">Saved Addresses</h1>
        <p className="text-sm text-slate-500">Manage delivery and billing addresses</p>
      </header>
      <AddressList addresses={addresses} />
    </div>
  );
}