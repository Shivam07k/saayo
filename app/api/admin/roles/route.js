import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";

export async function GET() {
  const { user, error, status } = await apiRequireAdmin({ permission: "staff:manage" });
  if (error) return jsonError(error, status);

  const roles = await prisma.role.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      permissions: true,
      _count: { select: { users: true } },
    },
  });
  return Response.json({ roles });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "staff:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.name || !data.name.trim()) return jsonError("Name required", 400);

  const existing = await prisma.role.findUnique({ where: { name: data.name.trim() } });
  if (existing) return jsonError("A role with this name already exists", 409);

  const role = await prisma.role.create({
    data: {
      name: data.name.trim(),
      description: data.description || null,
      isSystem: false,
      permissions: data.permissionKeys?.length
        ? { create: data.permissionKeys.map((key) => ({ key })) }
        : undefined,
    },
    include: { permissions: true },
  });
  await logAudit({ userId: user.id, action: "role.create", entityType: "Role", entityId: role.id });
  return Response.json({ role }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "staff:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);

  const role = await prisma.role.findUnique({ where: { id: data.id } });
  if (!role) return jsonError("Role not found", 404);

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.role.update({
      where: { id: data.id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description : undefined,
      },
      include: { permissions: true },
    });

    if (Array.isArray(data.permissionKeys)) {
      await tx.permission.deleteMany({ where: { roleId: data.id } });
      if (data.permissionKeys.length) {
        await tx.permission.createMany({
          data: data.permissionKeys.map((key) => ({ key, roleId: data.id })),
          skipDuplicates: true,
        });
      }
      next.permissions = await tx.permission.findMany({ where: { roleId: data.id } });
    }

    return next;
  });

  if (role.name !== "Super Admin") {
    await logAudit({ userId: user.id, action: "role.update", entityType: "Role", entityId: data.id });
  }
  return Response.json({ role: updated });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "staff:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);

  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) return jsonError("Role not found", 404);
  if (role.isSystem) return jsonError("System roles cannot be deleted", 400);
  if (role._count?.users > 0) return jsonError("Cannot delete a role assigned to users", 400);

  await prisma.role.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "role.delete", entityType: "Role", entityId: id });
  return Response.json({ success: true });
}