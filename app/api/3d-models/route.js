import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET() {
  const models = await prisma.product3DModel.findMany({ include: { product: { select: { id: true, name: true, slug: true } } }, orderBy: { createdAt: "desc" } });
  return Response.json({ models });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "models:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.productId || !data.url) return jsonError("productId and url are required", 400);

  const model = await prisma.product3DModel.create({
    data: {
      productId: data.productId,
      name: data.name || "3D model",
      url: data.url,
      format: data.format || "glb",
      isDefault: data.isDefault ?? false,
      arEnabled: data.arEnabled ?? true,
      arScale: data.arScale ?? 1,
      cameraAngle: data.cameraAngle || null,
      autoRotate: data.autoRotate ?? true,
      environment: data.environment || "studio",
      thumbnailUrl: data.thumbnailUrl || null,
      sizeBytes: data.sizeBytes || null,
    },
  });
  return Response.json({ model }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "models:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);
  const model = await prisma.product3DModel.update({
    where: { id: data.id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      url: data.url !== undefined ? data.url : undefined,
      format: data.format !== undefined ? data.format : undefined,
      isDefault: data.isDefault !== undefined ? data.isDefault : undefined,
      arEnabled: data.arEnabled !== undefined ? data.arEnabled : undefined,
      arScale: data.arScale !== undefined ? data.arScale : undefined,
      cameraAngle: data.cameraAngle !== undefined ? data.cameraAngle : undefined,
      autoRotate: data.autoRotate !== undefined ? data.autoRotate : undefined,
      environment: data.environment !== undefined ? data.environment : undefined,
      thumbnailUrl: data.thumbnailUrl !== undefined ? data.thumbnailUrl : undefined,
      sizeBytes: data.sizeBytes !== undefined ? data.sizeBytes : undefined,
    },
  });
  return Response.json({ model });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "models:manage" });
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.product3DModel.delete({ where: { id } });
  return Response.json({ success: true });
}