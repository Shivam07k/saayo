import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "suppliers:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const where = q
    ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
    : {};

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { purchaseOrders: true } } },
  });
  return Response.json({ suppliers });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "suppliers:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.name) return jsonError("Name required", 400);

  const supplier = await prisma.supplier.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      isActive: data.isActive ?? true,
    },
  });
  await logAudit({ userId: user.id, action: "supplier.create", entityType: "Supplier", entityId: supplier.id });
  return Response.json({ supplier }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "suppliers:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);

  const supplier = await prisma.supplier.update({
    where: { id: data.id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      email: data.email !== undefined ? data.email : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      address: data.address !== undefined ? data.address : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  });
  await logAudit({ userId: user.id, action: "supplier.update", entityType: "Supplier", entityId: supplier.id });
  return Response.json({ supplier });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "suppliers:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.supplier.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "supplier.delete", entityType: "Supplier", entityId: id });
  return Response.json({ success: true });
}