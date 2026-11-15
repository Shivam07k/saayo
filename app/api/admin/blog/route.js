import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET() {
  const { user, error, status } = await apiRequireAdmin({ permission: "pages:manage" });
  if (error) return jsonError(error, status);
  const posts = await prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
  return Response.json({ posts });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "pages:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.title) return jsonError("Title required", 400);
  const slug = data.slug || String(data.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt || null,
      content: data.content || "",
      coverImage: data.coverImage || null,
      authorId: user.id,
      status: data.status || "draft",
      publishedAt: data.status === "published" ? new Date() : null,
    },
  });
  return Response.json({ post }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "pages:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);
  const post = await prisma.blogPost.update({
    where: { id: data.id },
    data: {
      title: data.title !== undefined ? data.title : undefined,
      slug: data.slug !== undefined ? data.slug : undefined,
      excerpt: data.excerpt !== undefined ? data.excerpt : undefined,
      content: data.content !== undefined ? data.content : undefined,
      coverImage: data.coverImage !== undefined ? data.coverImage : undefined,
      status: data.status !== undefined ? data.status : undefined,
      publishedAt: data.status === "published" ? new Date() : data.publishedAt,
    },
  });
  return Response.json({ post });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "pages:manage" });
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.blogPost.delete({ where: { id } });
  return Response.json({ success: true });
}