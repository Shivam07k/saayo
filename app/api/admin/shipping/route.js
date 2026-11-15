import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";

export async function GET() {
  const { user, error, status } = await apiRequireAdmin({ permission: "shipping:manage" });
  if (error) return jsonError(error, status);

  const [orders, settings, defaultRule] = await Promise.all([
    prisma.order.findMany({
      where: { shippingTotal: { gt: 0 } },
      select: { id: true, orderNumber: true, trackingNumber: true, shippingProvider: true, shippingTotal: true, shippingAddress: { select: { state: true, postalCode: true } } },
      take: 30,
    }),
    prisma.storeSetting.findMany({ where: { key: { startsWith: "shipping." } } }),
    prisma.storeSetting.findFirst({ where: { key: "shipping.defaultRate" } }),
  ]);

  const rules = {};
  for (const row of settings) rules[row.key] = row.value;

  return Response.json({
    ordersWithShipping: orders,
    rules,
    defaultRate: defaultRule?.value || null,
  });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "shipping:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }

  if (!Array.isArray(data.rules)) return jsonError("rules array required", 400);

  await prisma.$transaction(
    data.rules.map((rule) => {
      if (!rule.key) throw new Error("rule key required");
      return prisma.storeSetting.upsert({
        where: { key: rule.key },
        update: { value: String(rule.value) },
        create: { key: rule.key, value: String(rule.value) },
      });
    }),
  );

  await logAudit({ userId: user.id, action: "shipping_rules.update", entityType: "StoreSetting" });
  return Response.json({ success: true });
}