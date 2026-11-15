import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "customers:manage" });
  if (error) return jsonError(error, status);

  const groups = await prisma.customerGroup.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });
  return Response.json({ groups });
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
  if (!data.name) return jsonError("Name required", 400);

  const existing = await prisma.customerGroup.findUnique({ where: { name: data.name } });
  if (existing) return jsonError("A group with this name already exists", 409);

  const group = await prisma.customerGroup.create({
    data: {
      name: data.name,
      description: data.description || null,
      discountPercent: data.discountPercent ?? 0,
    },
  });
  await logAudit({ userId: user.id, action: "customerGroup.create", entityType: "CustomerGroup", entityId: group.id });
  return Response.json({ group }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "customers:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);

  const group = await prisma.customerGroup.update({
    where: { id: data.id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      description: data.description !== undefined ? data.description : undefined,
      discountPercent: data.discountPercent !== undefined ? data.discountPercent : undefined,
    },
  });
  await logAudit({ userId: user.id, action: "customerGroup.update", entityType: "CustomerGroup", entityId: group.id });
  return Response.json({ group });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "customers:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);

  await prisma.customerGroup.update({ where: { id }, data: { users: { set: [] } } });
  await prisma.customerGroup.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "customerGroup.delete", entityType: "CustomerGroup", entityId: id });
  return Response.json({ success: true });
}