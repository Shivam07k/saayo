import Link from "next/link";
import { getStoreSettings } from "@/lib/storeSettings";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const settings = await getStoreSettings();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-black text-white">
        {settings.storeName.charAt(0)}
      </div>
      <h1 className="mt-6 text-3xl font-black">We&apos;ll be right back</h1>
      <p className="mt-3 max-w-md text-slate-500 dark:text-slate-400">
        {settings.storeName} is currently undergoing scheduled maintenance. Please check back shortly.
      </p>
      <Link href="/" className="btn-primary mt-6">Go back home</Link>
    </div>
  );
}