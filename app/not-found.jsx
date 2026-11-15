import Link from "next/link";
import { Box } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
        <Box className="h-10 w-10" />
      </span>
      <h1 className="text-6xl font-black text-brand-600">404</h1>
      <h2 className="text-2xl font-bold">Page not found</h2>
      <p className="max-w-md text-sm text-slate-500">
        The page you are looking for doesn&apos;t exist or has been moved. Try browsing the shop instead.
      </p>
      <div className="mt-2 flex gap-3">
        <Link href="/" className="btn-primary">Go Home</Link>
        <Link href="/shop" className="btn-outline">Browse Shop</Link>
      </div>
    </div>
  );
}