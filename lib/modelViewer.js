"use client";

import { loadScript, isAppleDevice } from "@/lib/threeUtils";

const MODEL_VIEWER_CDN = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

let modelViewerLoaded = false;

export async function ensureModelViewerLoaded() {
  if (typeof window === "undefined") return false;
  if (modelViewerLoaded || window.customElements?.get("model-viewer")) {
    modelViewerLoaded = true;
    return true;
  }
  try {
    await loadScript(MODEL_VIEWER_CDN);
    modelViewerLoaded = true;
    return true;
  } catch {
    return false;
  }
}

export function buildArUsdzUrl(modelUrl) {
  // model-viewer can render GLB directly; iOS QuickLook uses USDZ.
  // If both GLB and USDZ exist, provide the USDZ with #iOSquicklook.
  if (!modelUrl) return modelUrl;
  if (modelUrl.endsWith(".usdz") || modelUrl.endsWith(".USDZ")) return `${modelUrl}#iOSquicklook`;
  return null;
}

export function openAr(modelUrl, scale = 1, position = { x: 0, y: 0, z: 0 }) {
  if (typeof document === "undefined") return { ok: false, reason: "not-supported" };
  const viewer = document.createElement("model-viewer");
  viewer.setAttribute("src", modelUrl);
  viewer.setAttribute("ar", "");
  viewer.setAttribute("ar-modes", "webxr scene-viewer quick-look");
  viewer.setAttribute("ar-scale", "auto");
  viewer.setAttribute("camera-controls", "");
  viewer.setAttribute("style", "position:fixed;inset:0;width:100%;height:100%;z-index:9999;background:rgba(0,0,0,.92)");
  if (scale) viewer.setAttribute("scale", `${scale} ${scale} ${scale}`);
  document.body.appendChild(viewer);
  viewer.addEventListener("load", () => {
    if (viewer.canActivateAR) viewer.activateAR().catch(() => {});
  });
  const close = () => {
    viewer.parentElement?.removeChild(viewer);
  };
  viewer.addEventListener("ar-status", (e) => {
    if (e.detail && e.detail.status === "not-presenting" && !viewer.canActivateAR) close();
  });
  return { ok: true, close };
}

export function describesArAvailability() {
  return {
    isApple: isAppleDevice(),
    webxrAr: typeof navigator !== "undefined" && Boolean(navigator.xr?.isSessionSupported),
  };
}