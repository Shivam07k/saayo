import { prisma } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit"), 10) || 10));
  const q = searchParams.get("q") || "";

  const where = { status: "published" };
  if (q) where.title = { contains: q, mode: "insensitive" };

  const [posts, count] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return Response.json({ posts, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}