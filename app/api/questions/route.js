import { prisma } from "@/lib/db";
import { apiRequireUser, jsonError } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return jsonError("productId required", 400);

  const questions = await prisma.productQuestion.findMany({
    where: { productId, status: "answered" },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ questions });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { productId, question } = data;
  if (!productId) return jsonError("productId required", 400);
  if (!question || !String(question).trim()) return jsonError("Question text required", 400);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return jsonError("Product not found", 404);

  const created = await prisma.productQuestion.create({
    data: { productId, userId: user.id, question: String(question).trim() },
  });
  return Response.json({ question: created }, { status: 201 });
}