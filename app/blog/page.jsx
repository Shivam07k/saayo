import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import { Newspaper } from "lucide-react";

export const revalidate = 300;
export const metadata = { title: "Blog" };

export default async function BlogPage({ searchParams }) {
  const page = Math.max(1, parseInt(searchParams.page, 10) || 1);
  const perPage = 9;
  const where = { status: "published" };
  const [posts, count] = await Promise.all([
    prisma.blogPost.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * perPage, take: perPage }),
    prisma.blogPost.count({ where }),
  ]);

  if (posts.length === 0) {
    return (
      <div className="container-x py-16">
        <EmptyState icon={Newspaper} title="No articles yet" description="Follow us for 3D design tips and product drops." />
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-3xl font-black">Blog</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="card group overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-brand-600 to-indigo-700" />
            <div className="p-5">
              <p className="text-xs text-slate-400">{p.publishedAt ? formatDate(p.publishedAt, "medium") : ""}</p>
              <h2 className="mt-1 line-clamp-2 font-bold group-hover:text-brand-600">{p.title}</h2>
              {p.excerpt && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.excerpt}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}