import { prisma } from "@/lib/db";

export async function getAdminStats() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    revenueToday,
    revenueMonth,
    orderCount,
    orderCountToday,
    pendingOrders,
    productCount,
    lowStock,
    userCount,
    reviewsPending,
    salesSeries,
    topOrders,
    topProducts,
    paymentBreakdown,
    openPurchaseOrders,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: "paid", placedAt: { gte: startOfToday } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { paymentStatus: "paid", placedAt: { gte: thirtyDaysAgo } }, _sum: { total: true } }),
    prisma.order.count({ where: { paymentStatus: "paid", placedAt: { gte: thirtyDaysAgo } } }),
    prisma.order.count({ where: { placedAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.inventory.count({ where: { availableQty: { lte: 5 } } }),
    prisma.user.count({ where: { role: { isNot: { name: "Super Admin" } } } }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.order.groupBy({ by: ["placedAt"], where: { paymentStatus: "paid", placedAt: { gte: thirtyDaysAgo } }, _sum: { total: true }, orderBy: { placedAt: "asc" } }),
    prisma.order.findMany({ orderBy: { placedAt: "desc" }, take: 8, include: { _count: { select: { items: true } } } }),
    prisma.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 8 }),
    prisma.order.groupBy({ by: ["paymentMethod"], where: { paymentStatus: "paid", placedAt: { gte: thirtyDaysAgo } }, _sum: { total: true } }),
    prisma.purchaseOrder.count({ where: { status: { in: ["draft", "ordered", "partial"] } } }),
  ]);

  const byDay = {};
  for (const row of salesSeries) {
    const key = row.placedAt.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] || 0) + Number(row._sum.total);
  }
  const series = Object.entries(byDay).sort().map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }));

  const topProductRows = await prisma.product.findMany({
    where: { id: { in: topProducts.map((t) => t.productId) } },
    select: { id: true, name: true, stockQuantity: true },
  });
  const bestsellers = topProducts.map((t) => {
    const p = topProductRows.find((x) => x.id === t.productId);
    return { name: p?.name || "Unknown", sold: t._sum.quantity || 0, stock: p?.stockQuantity ?? 0 };
  });

  return {
    revenueToday: Math.round(Number(revenueToday._sum.total || 0) * 100) / 100,
    revenueMonth: Math.round(Number(revenueMonth._sum.total || 0) * 100) / 100,
    orderCount,
    orderCountToday,
    pendingOrders,
    productCount,
    lowStock,
    userCount,
    reviewsPending,
    series,
    recentOrders: topOrders,
    bestsellers,
    openPurchaseOrders,
    paymentBreakdown: paymentBreakdown.map((p) => ({ method: p.paymentMethod, total: Math.round(Number(p._sum.total || 0) * 100) / 100 })),
  };
}