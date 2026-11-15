import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";

const ACTIONS = ["archive", "activate", "delete", "setCategory"];

export async function POST(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "products:manage" });
  if (error) return jsonError(error, status);

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }

  const action = data.action;
  const ids = Array.isArray(data.ids) ? data.ids.filter(Boolean) : [];

  if (!ACTIONS.includes(action)) return jsonError("Unknown action", 400);
  if (!ids.length) return jsonError("Select at least one product", 400);

  let count = 0;

  if (action === "delete") {
    const del = await prisma.product.deleteMany({ where: { id: { in: ids } } });
    count = del.count;
  } else if (action === "archive") {
    const upd = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isActive: false } });
    count = upd.count;
  } else if (action === "activate") {
    const upd = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isActive: true, visibility: "public" } });
    count = upd.count;
  } else if (action === "setCategory") {
    if (!data.categoryId) return jsonError("Choose a category", 400);
    const upd = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { categoryId: data.categoryId } });
    count = upd.count;
  }

  await logAudit({ userId: user.id, action: `products.bulk.${action}`, entityType: "Product", meta: { ids, count } });
  return Response.json({ success: true, count });
}