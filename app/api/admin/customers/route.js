import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "customers:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = Math.min(50, parseInt(searchParams.get("limit"), 10) || 20);
  const q = searchParams.get("q") || "";
  const role = searchParams.get("role") || "";
  const statusFilter = searchParams.get("status") || "";

  const where = { role: { isNot: { name: "Super Admin" } } };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (statusFilter) where.status = statusFilter;
  if (role) where.role = { is: { name: role } };

  const [customers, count] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        gender: true,
        dateOfBirth: true,
        countryCode: true,
        status: true,
        newsletterOptIn: true,
        emailVerified: true,
        googleId: true,
        internalNote: true,
        customerGroupId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const summary = {
    total: await prisma.user.count({ where: { role: { isNot: { name: "Super Admin" } } } }),
    active: await prisma.user.count({ where: { role: { isNot: { name: "Super Admin" } }, status: "active" } }),
    blocked: await prisma.user.count({ where: { role: { isNot: { name: "Super Admin" } }, status: "blocked" } }),
  };

  return Response.json({ customers, pagination: { count, page, limit, pages: Math.ceil(count / limit) }, summary });
}

export async function PATCH(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "customers:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { id } = data;
  if (!id) return jsonError("id required", 400);
  const customer = await prisma.user.update({
    where: { id },
    data: {
      status: data.status !== undefined ? data.status : undefined,
      customerGroupId: data.customerGroupId !== undefined ? data.customerGroupId : undefined,
      internalNote: data.internalNote !== undefined ? data.internalNote : undefined,
      newsletterOptIn: data.newsletterOptIn !== undefined ? data.newsletterOptIn : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      customerGroupId: true,
      internalNote: true,
      newsletterOptIn: true,
      updatedAt: true,
    },
  });
  return Response.json({ customer });
}