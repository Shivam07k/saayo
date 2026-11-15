import { apiRequireUser, jsonError } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request) {
  const { user, error, status } = await apiRequireUser();
  if (error) return jsonError(error, status);

  try {
    const body = await request.json();
    const { dataUrl, folder = "saayo", assetType = "image" } = body;
    if (!dataUrl) return jsonError("dataUrl required", 400);

    const result = await uploadToCloudinary({ dataUrl, folder, assetType });
    return Response.json({ ...result }, { status: 201 });
  } catch (e) {
    console.error("upload failed", e);
    return jsonError(e.message || "Upload failed. Check Cloudinary config.", 400);
  }
}