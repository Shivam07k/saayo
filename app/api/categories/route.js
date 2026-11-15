import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return Response.json({ categories });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "categories:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.name) return jsonError("Name is required", 400);

  const slug = data.slug || String(data.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      image: data.image || data.imageUrl || null,
      parentId: data.parentId || null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  return Response.json({ category }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "categories:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);
  const category = await prisma.category.update({
    where: { id: data.id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      slug: data.slug !== undefined ? data.slug : undefined,
      description: data.description !== undefined ? data.description : undefined,
      image: data.image !== undefined ? data.image : (data.imageUrl !== undefined ? data.imageUrl : undefined),
      parentId: data.parentId !== undefined ? data.parentId : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : undefined,
    },
  });
  return Response.json({ category });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "categories:manage" });
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.category.delete({ where: { id } });
  return Response.json({ success: true });
}