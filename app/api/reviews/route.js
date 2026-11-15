import { prisma } from "@/lib/db";
import { getSessionUser, jsonError } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";
import { getStoreSettings } from "@/lib/storeSettings";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = 10;
  const where = { status: "approved" };
  if (productId) where.productId = productId;

  const [reviews, count] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  const avg = count ? (await prisma.review.aggregate({ where: { productId: productId || undefined, status: "approved" }, _avg: { rating: true } }))._avg.rating : null;

  return Response.json({ reviews, count, avg: avg ? Math.round(avg * 10) / 10 : null, pagination: { page, limit, pages: Math.ceil(count / limit) } });
}

export async function POST(request) {
  const user = await getSessionUser();
  let data;
  try {
    data = reviewSchema.parse(await request.json());
  } catch (e) {
    return Response.json({ error: "Validation failed", fieldErrors: e.flatten?.()?.fieldErrors || e.errors }, { status: 400 });
  }

  if (!user) return jsonError("Login to submit a review", 401);

  const settings = await getStoreSettings();
  const review = await prisma.review.create({
    data: {
      productId: data.productId,
      userId: user.id,
      rating: data.rating,
      title: data.title || null,
      body: data.body || null,
      status: settings.autoApproveReviews ? "approved" : "pending",
    },
  });

  return Response.json({ review }, { status: 201 });
}