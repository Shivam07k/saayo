import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError } from "@/lib/auth";
import Papa from "papaparse";

export async function GET(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "reports:view" });
  if (error) return jsonError(error, status);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "orders";

  let rows = [];
  let filename = "export";

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      include: { _count: { select: { items: true } } },
    });
    rows = orders.map((o) => ({
      orderNumber: o.orderNumber,
      email: o.email,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      tax: Number(o.tax),
      shipping: Number(o.shippingTotal),
      total: Number(o.total),
      items: o._count.items,
      placedAt: o.placedAt.toISOString(),
    }));
    filename = "orders";
  } else if (type === "products") {
    const products = await prisma.product.findMany({ include: { category: true, brand: true, _count: { select: { models: true } } } });
    rows = products.map((p) => ({
      name: p.name,
      sku: p.sku,
      slug: p.slug,
      category: p.category?.name || "",
      brand: p.brand?.name || "",
      regularPrice: Number(p.regularPrice),
      salePrice: p.salePrice ? Number(p.salePrice) : "",
      stock: p.stockQuantity,
      sold: p.soldCount,
      views3D: p.view3DCount,
      active: p.isActive,
    }));
    filename = "products";
  } else if (type === "customers") {
    const users = await prisma.user.findMany({
      where: { role: { isNot: { name: "Super Admin" } } },
      include: { _count: { select: { orders: true } } },
    });
    rows = users.map((u) => ({
      name: u.name,
      email: u.email,
      phone: u.phone,
      status: u.status,
      orders: u._count.orders,
      joined: u.createdAt.toISOString(),
    }));
    filename = "customers";
  } else if (type === "inventory") {
    const inv = await prisma.inventory.findMany({ include: { product: { select: { name: true, sku: true } }, warehouse: { select: { name: true } } } });
    rows = inv.map((i) => ({
      product: i.product?.name || "",
      sku: i.product?.sku || "",
      warehouse: i.warehouse?.name || "",
      available: i.availableQty,
      reserved: i.reservedQty,
      updatedAt: i.updatedAt.toISOString(),
    }));
    filename = "inventory";
  } else if (type === "models") {
    const models = await prisma.product3DModel.findMany({ include: { product: { select: { name: true } } } });
    rows = models.map((m) => ({
      product: m.product?.name || "",
      name: m.name,
      url: m.url,
      format: m.format,
      arEnabled: m.arEnabled,
      views: m.product?.view3DCount ?? 0,
    }));
    filename = "3d-models";
  } else if (type === "purchase-orders") {
    const pos = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { name: true } }, items: true },
    });
    rows = pos.map((po) => ({
      referenceNo: po.referenceNo,
      supplier: po.supplier?.name || "",
      status: po.status,
      lineItems: po.items.length,
      totalAmount: po.totalAmount ? Number(po.totalAmount) : "",
      expectedAt: po.expectedAt ? po.expectedAt.toISOString() : "",
      receivedAt: po.receivedAt ? po.receivedAt.toISOString() : "",
      createdAt: po.createdAt.toISOString(),
    }));
    filename = "purchase-orders";
  } else {
    return jsonError("Unsupported export type", 400);
  }

  const csv = Papa.unparse(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="saayo-${filename}-${Date.now()}.csv"`,
    },
  });
}