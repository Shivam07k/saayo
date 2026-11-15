import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "warehouses:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("all") === "1";
  const where = includeInactive ? {} : { isActive: true };

  const warehouses = await prisma.warehouse.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { inventories: true } } },
  });
  return Response.json({ warehouses });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "warehouses:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.name) return jsonError("Name required", 400);
  const code = (data.code || data.name).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "-");

  const existing = await prisma.warehouse.findUnique({ where: { code } });
  if (existing) return jsonError("A warehouse with this code already exists", 409);

  const warehouse = await prisma.warehouse.create({
    data: { name: data.name, code, address: data.address || null, latitude: data.latitude ?? null, longitude: data.longitude ?? null, isActive: data.isActive ?? true },
  });
  await logAudit({ userId: user.id, action: "warehouse.create", entityType: "Warehouse", entityId: warehouse.id });
  return Response.json({ warehouse }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "warehouses:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);

  const warehouse = await prisma.warehouse.update({
    where: { id: data.id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      address: data.address !== undefined ? data.address : undefined,
      latitude: data.latitude !== undefined ? data.latitude : undefined,
      longitude: data.longitude !== undefined ? data.longitude : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  });
  await logAudit({ userId: user.id, action: "warehouse.update", entityType: "Warehouse", entityId: warehouse.id });
  return Response.json({ warehouse });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "warehouses:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.warehouse.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "warehouse.delete", entityType: "Warehouse", entityId: id });
  return Response.json({ success: true });
}