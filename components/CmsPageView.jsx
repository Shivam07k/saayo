import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { fontCss } from "@/lib/fonts";

// Renders a CMS-managed page with its selected font applied.
export default function CmsPageView({ page }) {
  return (
    <article className="container-x max-w-3xl py-10" style={{ fontFamily: fontCss(page?.fontFamily) }}>
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">{page.title}</span>
      </nav>
      <h1 className="mb-6 text-3xl font-black">{page.title}</h1>
      <div className="prose-content" dangerouslySetInnerHTML={{ __html: page.content || "<p>Coming soon.</p>" }} />
    </article>
  );
}

export async function metadataFor(page) {
  const name = page?.title || "Page";
  return {
    title: page?.seoTitle || name,
    description: page?.seoDescription || undefined,
  };
}