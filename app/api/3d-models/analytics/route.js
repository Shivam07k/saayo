import { prisma } from "@/lib/db";
import { jsonError, isRateLimited } from "@/lib/auth";

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`model:${ip}`, 60, 60000)) return jsonError("Too many requests", 429);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { productId, modelId, event, eventType, attribute, tumbleCount, duration, loadedAt } = data;

  let product = null;
  if (productId) {
    product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return jsonError("Product not found", 404);
  } else if (modelId) {
    product = await prisma.product.findFirst({
      where: {
        models: { some: { id: modelId } },
      },
    });
  }
  if (!product) return jsonError("productId or a valid modelId required", 400);

  const type = eventType || event || "view";
  const analytics = await prisma.modelAnalytics.create({
    data: {
      productId: product.id,
      modelId: modelId || null,
      eventType: type,
      attribute: attribute || null,
      tumbleCount: tumbleCount ?? null,
      durationSeconds: duration != null ? Math.round(duration) : null,
      arUsed: type === "ar",
    },
  });

  await prisma.product.update({
    where: { id: product.id },
    data: { view3DCount: { increment: 1 } },
  });

  return Response.json({ success: true, id: analytics.id }, { status: 201 });
}