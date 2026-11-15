import { prisma } from "@/lib/db";
import { apiRequireUser, jsonError } from "@/lib/auth";
import { addressSchema } from "@/lib/validations";

export async function GET() {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });
  return Response.json({ addresses });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  let data;
  try {
    data = addressSchema.parse(await request.json());
  } catch (e) {
    return Response.json({ error: "Validation failed", fieldErrors: e.flatten?.()?.fieldErrors || e.errors }, { status: 400 });
  }

  const address = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: {
        userId: user.id,
        type: data.type,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country || "India",
        isDefault: data.isDefault,
      },
    });
  });

  return Response.json({ address }, { status: 201 });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  let data;
  try {
    data = addressSchema.parse(await request.json());
  } catch (e) {
    return Response.json({ error: "Validation failed", fieldErrors: e.flatten?.()?.fieldErrors || e.errors }, { status: 400 });
  }
  if (!data.id) return jsonError("id required", 400);

  const existing = await prisma.address.findFirst({ where: { id: data.id, userId: user.id } });
  if (!existing) return jsonError("Address not found", 404);

const address = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return tx.address.update({
      where: { id: data.id },
      data: {
        type: data.type,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country || "India",
        isDefault: data.isDefault,
      },
    });
  });

  return Response.json({ address });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);

  const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!existing) return jsonError("Address not found", 404);
  await prisma.address.delete({ where: { id } });
  return Response.json({ success: true });
}