import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "collections:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : {};

  const collections = await prisma.collection.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });
  return Response.json({ collections });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "collections:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.name) return jsonError("Name required", 400);

  const slug = data.slug || slugify(data.name);
  const existing = await prisma.collection.findUnique({ where: { slug } });
  if (existing) return jsonError("A collection with this slug already exists", 409);

  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      image: data.image || data.imageUrl || null,
      isActive: data.isActive ?? true,
    },
  });
  await logAudit({ userId: user.id, action: "collection.create", entityType: "Collection", entityId: collection.id });
  return Response.json({ collection }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "collections:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);

  const collection = await prisma.collection.update({
    where: { id: data.id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      slug: data.slug !== undefined ? data.slug : undefined,
      description: data.description !== undefined ? data.description : undefined,
      image: data.image !== undefined ? data.image : (data.imageUrl !== undefined ? data.imageUrl : undefined),
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  });
  await logAudit({ userId: user.id, action: "collection.update", entityType: "Collection", entityId: collection.id });
  return Response.json({ collection });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "collections:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.collection.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "collection.delete", entityType: "Collection", entityId: id });
  return Response.json({ success: true });
}