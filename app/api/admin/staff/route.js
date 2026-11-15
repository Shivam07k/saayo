import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit, hashPassword } from "@/lib/auth";

export async function GET() {
  const { user, error, status } = await apiRequireAdmin({ permission: "staff:manage" });
  if (error) return jsonError(error, status);
  const roles = await prisma.role.findMany({ where: { isSystem: false }, include: { permissions: true, users: true } });
  return Response.json({
    roles: roles.map((r) => ({ ...r, users: r.users.map(({ passwordHash, ...u }) => u) })),
  });
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

  const role = await prisma.role.findUnique({ where: { id: data.roleId } });
  if (!role) return jsonError("Role not found", 404);

  const existing = await prisma.user.findUnique({ where: { email: (data.email || "").toLowerCase() } });
  if (existing) return jsonError("A user with that email already exists", 400);

  const staff = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone || null,
      passwordHash: data.password ? await hashPassword(data.password) : null,
      emailVerified: true,
      roleId: role.id,
      status: data.status || "active",
      internalNote: data.internalNote || null,
      avatar: data.avatar || null,
    },
  });
  await logAudit({ userId: user.id, action: "staff.create", entityType: "User", entityId: staff.id });
  const { passwordHash, ...safe } = staff;
  return Response.json({ staff: safe }, { status: 201 });
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
  const staff = await prisma.user.update({
    where: { id: data.id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      roleId: data.roleId !== undefined ? data.roleId : undefined,
      status: data.status !== undefined ? data.status : undefined,
      internalNote: data.internalNote !== undefined ? data.internalNote : undefined,
      avatar: data.avatar !== undefined ? data.avatar : undefined,
      passwordHash: data.password ? await hashPassword(data.password) : undefined,
    },
  });
  await logAudit({ userId: user.id, action: "staff.update", entityType: "User", entityId: data.id });
  const { passwordHash, ...safe } = staff;
  return Response.json({ staff: safe });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "staff:manage" });
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  if (id === user.id) return jsonError("You cannot delete yourself", 400);
  await prisma.user.update({ where: { id }, data: { status: "inactive" } });
  await logAudit({ userId: user.id, action: "staff.deactivate", entityType: "User", entityId: id });
  return Response.json({ success: true });
}