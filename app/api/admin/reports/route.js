import { apiRequireAdmin, jsonError } from "@/lib/auth";
import { getAdminStats } from "@/lib/adminReports";

export async function GET() {
  const { user, error, status } = await apiRequireAdmin({ permission: "reports:view" });
  if (error) return jsonError(error, status);
  return Response.json(await getAdminStats());
}