import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

export const revalidate = 300;

export default async function BlogPostPage({ params }) {
  const post = await prisma.blogPost.findFirst({ where: { slug: params.slug, status: "published" } });
  if (!post) notFound();
  return (
    <article className="container-x max-w-3xl py-10">
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/blog" className="hover:text-brand-600">Blog</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{post.title}</span>
      </nav>
      <h1 className="text-3xl font-black">{post.title}</h1>
      <div className="prose-content mt-6" dangerouslySetInnerHTML={{ __html: post.content || "<p>Coming soon.</p>" }} />
    </article>
  );
}