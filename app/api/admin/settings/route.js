import { prisma } from "@/lib/db";
import { apiRequireAdmin, jsonError, logAudit } from "@/lib/auth";
import { SETTING_KEYS, STORE_DEFAULTS } from "@/lib/storeSettings";

export async function GET() {
  const { user, error, status } = await apiRequireAdmin({ permission: "settings:manage" });
  if (error) return jsonError(error, status);
  const rows = await prisma.storeSetting.findMany({ where: { key: { in: Object.keys(SETTING_KEYS) } } });
  const settings = { ...STORE_DEFAULTS };
  for (const row of rows) {
    const type = SETTING_KEYS[row.key];
    settings[row.key] = type === "number" ? Number(row.value) : type === "boolean" ? row.value === "true" : row.value;
  }
  return Response.json({ settings });
}

export async function PUT(request) {
  const { user, error, status } = await apiRequireAdmin({ permission: "settings:manage" });
  if (error) return jsonError(error, status);
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }

  for (const [key, value] of Object.entries(data)) {
    if (!SETTING_KEYS[key]) continue;
    await prisma.storeSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }

  await logAudit({ userId: user.id, action: "settings.update", entityType: "StoreSetting" });
  return Response.json({ success: true });
}