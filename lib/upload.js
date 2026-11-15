import { v2 as cloudinary } from "cloudinary";

export function uploadConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export async function uploadToCloudinary({ dataUrl, folder = "saayo", assetType = "image" }) {
  if (!uploadConfigured()) {
    throw new Error("Cloudinary is not configured (CLOUDINARY_* env vars)");
  }
  const cld = getCloudinary();
  const options = { folder, resource_type: assetType === "model" ? "raw" : assetType };
  const updated = await cld.uploader.upload(dataUrl, options);
  return {
    url: updated.secure_url,
    publicId: updated.public_id,
    width: updated.width ?? null,
    height: updated.height ?? null,
    bytes: updated.bytes,
    format: updated.format,
    assetType,
  };
}

// Server-side upload of a GLB from a file buffer (e.g. admin form).
export async function uploadModelBuffer({ buffer, folder = "saayo/models", publicIdPrefix = "model" }) {
  if (!uploadConfigured()) throw new Error("Cloudinary is not configured (CLOUDINARY_* env vars)");
  const cld = getCloudinary();
  const updated = await cld.uploader.upload_stream(
    { folder, resource_type: "raw", public_id: `${publicIdPrefix}-${Date.now()}` },
    (error, result) => {
      if (error) throw error;
      return result;
    },
  ).end(buffer);
  return { url: updated.secure_url, publicId: updated.public_id, bytes: updated.bytes };
}