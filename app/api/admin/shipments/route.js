import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";
import { sendOrderNotification } from "@/lib/mailer";

const SHIPMENT_STATUSES = ["created", "picked", "shipped", "out_for_delivery", "delivered", "failed"];

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "orders:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = Math.min(50, parseInt(searchParams.get("limit"), 10) || 20);
  const orderId = searchParams.get("orderId") || "";
  const shipStatus = searchParams.get("status") || "";

  const where = {};
  if (orderId) where.orderId = orderId;
  if (shipStatus) where.status = shipStatus;

  const [shipments, count] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { order: { select: { orderNumber: true, status: true, email: true } } },
    }),
    prisma.shipment.count({ where }),
  ]);

  return Response.json({ shipments, pagination: { count, page, limit, pages: Math.ceil(count / limit) } });
}

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "orders:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { orderId, provider, trackingNumber, trackingUrl, status: shipStatus } = data;
  if (!orderId) return jsonError("orderId required", 400);
  if (shipStatus && !SHIPMENT_STATUSES.includes(shipStatus)) return jsonError("Invalid shipment status", 400);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true, id: true } } },
  });
  if (!order) return jsonError("Order not found", 404);

  const nextStatus = shipStatus || "created";

  const shipment = await prisma.$transaction(async (tx) => {
    const created = await tx.shipment.create({
      data: {
        orderId,
        provider: provider || null,
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
        status: nextStatus,
        shippedAt: nextStatus === "shipped" ? new Date() : null,
        deliveredAt: nextStatus === "delivered" ? new Date() : null,
      },
    });

    if (trackingNumber) {
      await tx.order.update({
        where: { id: orderId },
        data: { trackingNumber, shippingProvider: provider || undefined },
      });
    }

    if (order.userId && (nextStatus === "shipped" || nextStatus === "delivered")) {
      await tx.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          type: "order",
          title: `Shipment ${nextStatus}`,
          body: `Your order ${order.orderNumber} is ${nextStatus}.${trackingNumber ? ` Tracking: ${trackingNumber}` : ""}`,
        },
      });
    }

    return created;
  });

  await logAudit({ userId: user.id, action: "shipment.create", entityType: "Shipment", entityId: shipment.id, meta: { orderId, trackingNumber } });

  if (nextStatus === "shipped" || nextStatus === "delivered") {
    try {
      await sendOrderNotification(order.user?.email || order.email, order.orderNumber, nextStatus);
    } catch (e) {
      console.error("shipment email failed", e.message);
    }
  }

  return Response.json({ shipment }, { status: 201 });
}

export async function PATCH(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "orders:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }
  const { id } = data;
  if (!id) return jsonError("id required", 400);
  if (data.status && !SHIPMENT_STATUSES.includes(data.status)) return jsonError("Invalid shipment status", 400);

  const existing = await prisma.shipment.findUnique({
    where: { id },
    include: { order: { include: { user: { select: { email: true, id: true } } } } },
  });
  if (!existing) return jsonError("Shipment not found", 404);

  const prevStatus = existing.status;
  const nextStatus = data.status || prevStatus;

  const shipment = await prisma.$transaction(async (tx) => {
    const updated = await tx.shipment.update({
      where: { id },
      data: {
        provider: data.provider !== undefined ? data.provider : undefined,
        trackingNumber: data.trackingNumber !== undefined ? data.trackingNumber : undefined,
        trackingUrl: data.trackingUrl !== undefined ? data.trackingUrl : undefined,
        status: nextStatus,
        shippedAt: !existing.shippedAt && nextStatus === "shipped" ? new Date() : undefined,
        deliveredAt: !existing.deliveredAt && nextStatus === "delivered" ? new Date() : undefined,
      },
    });

    if (data.trackingNumber !== undefined) {
      await tx.order.update({
        where: { id: existing.orderId },
        data: {
          trackingNumber: data.trackingNumber,
          shippingProvider: data.provider !== undefined ? data.provider : existing.order.shippingProvider || undefined,
        },
      });
    }

    if (existing.order.userId && ((nextStatus === "shipped" && prevStatus !== "shipped") || (nextStatus === "delivered" && prevStatus !== "delivered"))) {
      await tx.notification.create({
        data: {
          userId: existing.order.userId,
          orderId: existing.orderId,
          type: "order",
          title: `Shipment ${nextStatus}`,
          body: `Your order ${existing.order.orderNumber} is ${nextStatus}.${updated.trackingNumber ? ` Tracking: ${updated.trackingNumber}` : ""}`,
        },
      });
    }

    return updated;
  });

  await logAudit({ userId: user.id, action: "shipment.update", entityType: "Shipment", entityId: id, meta: { status: nextStatus } });

  if (prevStatus !== nextStatus && (nextStatus === "shipped" || nextStatus === "delivered")) {
    try {
      await sendOrderNotification(existing.order.user?.email || existing.order.email, existing.order.orderNumber, nextStatus);
    } catch (e) {
      console.error("shipment email failed", e.message);
    }
  }

  return Response.json({ shipment });
}

export async function DELETE(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "orders:manage" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required", 400);

  const existing = await prisma.shipment.findUnique({ where: { id } });
  if (!existing) return jsonError("Shipment not found", 404);

  await prisma.shipment.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "shipment.delete", entityType: "Shipment", entityId: id });
  return Response.json({ success: true });
}