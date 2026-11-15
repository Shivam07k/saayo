import { getStoreSettings } from "@/lib/storeSettings";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getStoreSettings();
  return Response.json({ settings }, { headers: { "Cache-Control": "no-store" } });
}