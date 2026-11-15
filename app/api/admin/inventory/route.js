import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "inventory:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = Math.min(50, parseInt(searchParams.get("limit"), 10) || 20);
  const q = searchParams.get("q") || "";
  const low = searchParams.get("low") === "1";
  const out = searchParams.get("out") === "1";

  const where = {};
  if (low) where.availableQty = { lte: 5 };
  if (out) where.availableQty = 0;
  if (q) {
    where.product = { is: { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } };
  }

  const [inventory, count] = await Promise.all([
    prisma.inventory.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, options: true, sku: true } },
        warehouse: { select: { name: true } },
      },
    }),
    prisma.inventory.count({ where }),
  ]);

  return Response.json({ inventory, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "inventory:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { inventoryId, adjustment, reason } = data;
  if (!inventoryId || !adjustment || Math.abs(adjustment) > 100000) return jsonError("Invalid adjustment", 400);

  const update = await prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.findUnique({ where: { id: inventoryId } });
    if (!inv) throw new Error("Inventory not found");
    const next = await tx.inventory.update({
      where: { id: inventoryId },
      data: { availableQty: { increment: adjustment }, updatedAt: new Date() },
    });

    if (inv.variantId) {
      await tx.productVariant.update({ where: { id: inv.variantId }, data: { stockQuantity: { increment: adjustment } } });
    } else {
      await tx.product.update({ where: { id: inv.productId }, data: { stockQuantity: { increment: adjustment } } });
    }

    await tx.inventoryLog.create({
      data: { inventoryId, type: adjustment > 0 ? "restock" : "adjustment", quantity: Math.abs(adjustment), note: reason || "Manual adjustment" },
    });
    return next;
  });

  await logAudit({ userId: user.id, action: "inventory.adjust", entityType: "Inventory", entityId: inventoryId, meta: { adjustment } });
  return Response.json({ inventory: update });
}