import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return Response.json({ banners });
}