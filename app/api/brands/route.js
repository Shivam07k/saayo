import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  return Response.json({ brands });
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

  const brand = await prisma.brand.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      logo: data.logo || data.logoUrl || null,
      isActive: data.isActive ?? true,
    },
  });
  return Response.json({ brand }, { status: 201 });
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
  const brand = await prisma.brand.update({
    where: { id: data.id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      slug: data.slug !== undefined ? data.slug : undefined,
      description: data.description !== undefined ? data.description : undefined,
      logo: data.logo !== undefined ? data.logo : (data.logoUrl !== undefined ? data.logoUrl : undefined),
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  });
  return Response.json({ brand });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "categories:manage" });
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.brand.delete({ where: { id } });
  return Response.json({ success: true });
}