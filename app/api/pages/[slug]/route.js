import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/auth";

export async function GET(request, { params }) {
  const { slug } = params;
  const page = await prisma.page.findFirst({
    where: { slug, status: "published" },
  });
  if (!page) return jsonError("Page not found", 404);
  return Response.json({ page });
}