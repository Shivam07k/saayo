import { prisma } from "@/lib/db";

export async function GET() {
  const collections = await prisma.collection.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  return Response.json({ collections });
}