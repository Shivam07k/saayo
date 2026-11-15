import { prisma } from "@/lib/db";
import { apiRequireUser, jsonError, logAudit } from "@/lib/auth";

export async function PUT(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      avatar: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
      gender: data.gender !== undefined ? data.gender : undefined,
      dateOfBirth: data.dateOfBirth !== undefined ? (data.dateOfBirth ? new Date(data.dateOfBirth) : null) : undefined,
      newsletterOptIn: data.newsletterOptIn !== undefined ? data.newsletterOptIn : undefined,
      countryCode: data.countryCode !== undefined ? data.countryCode : undefined,
    },
    select: { id: true, name: true, email: true, phone: true, avatar: true, emailVerified: true, createdAt: true },
  });

  await logAudit({ userId: user.id, action: "profile.update", entityType: "User" });
  return Response.json({ user: updated });
}