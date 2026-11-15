import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET() {
  const { user, error, status } = await apiRequireAdmin({ permission: "customers:manage" });
  if (error) return jsonError(error, status);
  const [questions, subscribers] = await Promise.all([
    prisma.productQuestion.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
  ]);
  return Response.json({ questions, subscribers });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "customers:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.questionId) return jsonError("questionId required", 400);
  const question = await prisma.productQuestion.update({
    where: { id: data.questionId },
    data: { answer: data.answer || null, status: data.status || "answered" },
  });
  return Response.json({ question });
}