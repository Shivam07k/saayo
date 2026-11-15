import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "banners:manage" });
  if (error) return jsonError(error, status);
  const banners = await prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return Response.json({ banners });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "banners:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.title) return jsonError("Title required", 400);
  const banner = await prisma.banner.create({
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      image: data.image || data.imageUrl || null,
      link: data.link || null,
      position: data.position || "home-hero",
      sortOrder: data.sortOrder ?? data.order ?? 0,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      isActive: data.isActive ?? true,
    },
  });
  await logAudit({ userId: user.id, action: "banner.create", entityType: "Banner", entityId: banner.id });
  return Response.json({ banner }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "banners:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);
  const banner = await prisma.banner.update({
    where: { id: data.id },
    data: {
      title: data.title !== undefined ? data.title : undefined,
      subtitle: data.subtitle !== undefined ? data.subtitle : undefined,
      image: data.image !== undefined ? data.image : (data.imageUrl !== undefined ? data.imageUrl : undefined),
      link: data.link !== undefined ? data.link : undefined,
      position: data.position !== undefined ? data.position : undefined,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : (data.order !== undefined ? data.order : undefined),
      startAt: data.startAt !== undefined ? (data.startAt ? new Date(data.startAt) : null) : undefined,
      endAt: data.endAt !== undefined ? (data.endAt ? new Date(data.endAt) : null) : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  });
  return Response.json({ banner });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "banners:manage" });
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.banner.delete({ where: { id } });
  return Response.json({ success: true });
}