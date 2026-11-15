import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/auth";

export async function GET(request, { params }) {
  const { slug } = params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "published" },
  });
  if (!post) return jsonError("Blog post not found", 404);
  return Response.json({ post });
}