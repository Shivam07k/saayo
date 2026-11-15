import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";
import { SECTION_TYPE_VALUES } from "@/lib/sections";

const TYPES_SET = new Set(SECTION_TYPE_VALUES);

function invalidate(page) {
  revalidatePath(`/${page || "home"}`);
  revalidatePath("/");
  revalidatePath(`/${page}`, "layout");
}

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "sections:manage" });
  if (error) return jsonError(error, status);
  const page = new URL(request.url).searchParams.get("page") || undefined;
  const sections = await prisma.section.findMany({
    where: page ? { page } : undefined,
    orderBy: [{ page: "asc" }, { sortOrder: "asc" }],
  });
  return Response.json({ sections });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "sections:manage" });
  if (error) return jsonError(error, status);
  let d;
  try {
    d = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!d.type) return jsonError("type required", 400);
  if (!TYPES_SET.has(d.type)) return jsonError("Invalid section type", 400);
  const page = d.page || "home";
  const maxOrder = await prisma.section.aggregate({ where: { page }, _max: { sortOrder: true } });
  const section = await prisma.section.create({
    data: {
      page,
      type: d.type,
      title: d.title || null,
      subtitle: d.subtitle || null,
      config: d.config || {},
      sortOrder: d.sortOrder != null ? Number(d.sortOrder) : (maxOrder._max.sortOrder ?? -1) + 1,
      isActive: d.isActive ?? true,
    },
  });
  await logAudit({ userId: user.id, action: "section.create", entityType: "Section", entityId: section.id });
  invalidate(page);
  return Response.json({ section }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "sections:manage" });
  if (error) return jsonError(error, status);
  let d;
  try {
    d = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!d.id) return jsonError("id required", 400);
  if (d.type && !TYPES_SET.has(d.type)) return jsonError("Invalid section type", 400);
  const section = await prisma.section.update({
    where: { id: d.id },
    data: {
      page: d.page !== undefined ? d.page : undefined,
      type: d.type !== undefined ? d.type : undefined,
      title: d.title !== undefined ? d.title : undefined,
      subtitle: d.subtitle !== undefined ? d.subtitle : undefined,
      config: d.config !== undefined ? d.config : undefined,
      sortOrder: d.sortOrder !== undefined ? Number(d.sortOrder) : undefined,
      isActive: d.isActive !== undefined ? d.isActive : undefined,
    },
  });
  await logAudit({ userId: user.id, action: "section.update", entityType: "Section", entityId: section.id });
  invalidate(d.page !== undefined ? d.page : section.page);
  return Response.json({ section });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "sections:manage" });
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  const existing = await prisma.section.findUnique({ where: { id }, select: { page: true } });
  await prisma.section.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "section.delete", entityType: "Section", entityId: id });
  invalidate(existing?.page);
  return Response.json({ success: true });
}

// Reorder: body = { page, ids: [ordered section ids] }
export async function PATCH(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "sections:manage" });
  if (error) return jsonError(error, status);
  let d;
  try {
    d = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!Array.isArray(d.ids)) return jsonError("ids required", 400);
  const updates = await Promise.all(
    d.ids.map((id, i) =>
      prisma.section.update({ where: { id }, data: { sortOrder: i } }).then(() => null).catch(() => null)
    )
  );
  await updates;
  await logAudit({ userId: user.id, action: "section.reorder", entityType: "Section", entityId: d.ids.join(",") });
  invalidate(d.page);
  return Response.json({ success: true });
}