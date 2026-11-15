import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";

const STATUSES = ["draft", "ordered", "partial", "received", "cancelled"];

async function attachProducts(items) {
  const ids = [...new Set(items.map((i) => i.productId).filter(Boolean))];
  const products = ids.length
    ? await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, sku: true } })
    : [];
  const map = Object.fromEntries(products.map((p) => [p.id, p]));
  return items.map((i) => ({ ...i, product: map[i.productId] || { id: i.productId, name: "Unknown", sku: "" } }));
}

const ITEM_INCLUDE = {
  items: true,
};

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "suppliers:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = Math.min(50, parseInt(searchParams.get("limit"), 10) || 20);
  const q = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "";

  const where = {};
  if (statusFilter && STATUSES.includes(statusFilter)) where.status = statusFilter;
  if (q) {
    where.OR = [
      { referenceNo: { contains: q, mode: "insensitive" } },
      { supplier: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [purchaseOrders, count] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { supplier: { select: { id: true, name: true } }, ...ITEM_INCLUDE },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  const enriched = await Promise.all(purchaseOrders.map(async (po) => ({ ...po, items: await attachProducts(po.items) })));
  return Response.json({ purchaseOrders: enriched, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
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
  if (!data.supplierId) return jsonError("supplierId required", 400);
  const items = Array.isArray(data.items) ? data.items.filter((i) => i.productId && Number(i.quantity) > 0) : [];
  if (!items.length) return jsonError("Add at least one line item", 400);

  const referenceNo = data.referenceNo || `PO-${Date.now()}`;
  const totalAmount = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitCost || 0), 0);

  const po = await prisma.purchaseOrder.create({
    data: {
      supplierId: data.supplierId,
      referenceNo,
      status: data.status && STATUSES.includes(data.status) ? data.status : "draft",
      totalAmount,
      expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost || 0),
        })),
      },
    },
  });
  const full = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: po.id },
    include: { supplier: { select: { name: true } }, ...ITEM_INCLUDE },
  });
  const purchaseOrder = { ...full, items: await attachProducts(full.items) };

  await logAudit({ userId: user.id, action: "purchaseOrder.create", entityType: "PurchaseOrder", entityId: purchaseOrder.id, meta: { totalAmount } });
  return Response.json({ purchaseOrder }, { status: 201 });
}

export async function PATCH(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "suppliers:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (!data.id) return jsonError("id required", 400);

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: data.id },
    include: { items: true },
  });
  if (!po) return jsonError("Purchase order not found", 404);
  if (po.status === "cancelled") return jsonError("Cancelled purchase orders cannot be changed", 400);
  if (po.status === "received" && data.status !== "cancelled") return jsonError("Already received", 400);

  const incoming = data.status || "";
  if (!STATUSES.includes(incoming)) return jsonError("Invalid status", 400);

  await prisma.$transaction(async (tx) => {
    if (incoming === "cancelled") {
      await tx.purchaseOrder.update({ where: { id: po.id }, data: { status: "cancelled", receivedAt: null } });
      return;
    }

    // Receive some or all remaining quantities. Default = receive everything still outstanding.
    const receiveMap = {};
    for (const r of data.items || []) receiveMap[r.itemId] = Number(r.receivedQty || 0);

    let anyReceived = false;
    let allReceived = true;

    for (const item of po.items) {
      const outstanding = Number(item.quantity) - item.receivedQty;
      const desired = receiveMap[item.id] !== undefined ? receiveMap[item.id] : outstanding;
      const delta = Math.max(0, Math.min(desired, outstanding));
      if (delta <= 0) continue;

      anyReceived = true;

      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: { receivedQty: { increment: delta } },
      });

      // Top up product + its inventory row (create in the first active warehouse if missing)
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Line item product no longer exists (${item.productId})`);

      let inv = await tx.inventory.findFirst({ where: { productId: item.productId, variantId: null } });
      if (!inv) {
        const wh = await tx.warehouse.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
        inv = await tx.inventory.create({
          data: { productId: item.productId, warehouseId: wh?.id || null, availableQty: 0, reservedQty: 0 },
        });
      }
      await tx.inventory.update({
        where: { id: inv.id },
        data: { availableQty: { increment: delta }, updatedAt: new Date() },
      });
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: delta } },
      });
      await tx.inventoryLog.create({
        data: {
          inventoryId: inv.id,
          type: "restock",
          quantity: delta,
          note: `Purchase order ${po.referenceNo} received`,
          referenceId: po.id,
          createdById: user.id,
        },
      });
    }

    // Recompute received state after the loop
    for (const item of po.items) {
      const fresh = await tx.purchaseOrderItem.findUnique({ where: { id: item.id } });
      if (fresh.receivedQty < Number(item.quantity)) allReceived = false;
    }

    const actualStatus = anyReceived ? (allReceived ? "received" : "partial") : incoming;
    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: { status: actualStatus, receivedAt: actualStatus === "received" ? new Date() : po.receivedAt },
    });
  });

  const full = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: po.id },
    include: { supplier: { select: { name: true } }, ...ITEM_INCLUDE },
  });
  const purchaseOrder = { ...full, items: await attachProducts(full.items) };

  await logAudit({ userId: user.id, action: `purchaseOrder.${incoming}`, entityType: "PurchaseOrder", entityId: po.id, meta: { items: data.items } });
  return Response.json({ purchaseOrder });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "suppliers:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);
  await prisma.purchaseOrder.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "purchaseOrder.delete", entityType: "PurchaseOrder", entityId: id });
  return Response.json({ success: true });
}