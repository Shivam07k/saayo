"use client";

export const SUPPORTED_3D_FORMATS = ["glb", "gltf", ".glb", ".gltf"];

export const ENVIRONMENT_PRESETS = ["city", "dawn", "night", "studio", "sunset", "warehouse", "park", "forest"];

export const FINISH_OPTIONS = [
  { id: "matte", label: "Matte", roughness: 0.85, metalness: 0.0 },
  { id: "glossy", label: "Glossy", roughness: 0.25, metalness: 0.0 },
  { id: "metallic", label: "Metallic", roughness: 0.3, metalness: 1.0 },
  { id: "satin", label: "Satin", roughness: 0.5, metalness: 0.1 },
];

export const COLOR_PALETTE = [
  "#1f2937",
  "#0f172a",
  "#e5e7eb",
  "#f5f5f4",
  "#92400e",
  "#b45309",
  "#1d4ed8",
  "#059669",
  "#be123c",
  "#7c3aed",
  "#0ea5e9",
  "#f59e0b",
];

export function getMaterialNode(model, name) {
  if (!model || !model.traverse) return null;
  let found = null;
  model.traverse((child) => {
    if (child.isMesh && (child.name === name || child.material?.name === name)) found = child;
  });
  return found;
}

export function applyColorToNode(model, nodeName, color) {
  const node = getMaterialNode(model, nodeName);
  if (!node?.material) return false;
  const mats = Array.isArray(node.material) ? node.material : [node.material];
  mats.forEach((m) => {
    if (m.color) m.color.set(color);
  });
  return mats[0];
}

export function applyFinishToNode(model, nodeName, finishId) {
  const finish = FINISH_OPTIONS.find((f) => f.id === finishId) || FINISH_OPTIONS[0];
  const node = getMaterialNode(model, nodeName);
  if (!node?.material) return false;
  const mats = Array.isArray(node.material) ? node.material : [node.material];
  mats.forEach((m) => {
    m.roughness = finish.roughness;
    m.metalness = finish.metalness;
    m.needsUpdate = true;
  });
  return true;
}

export function fitCameraToModel(camera, model, controls, offset = 2.4) {
  if (!model || !camera) return;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const dist = maxDim * offset;
  camera.position.set(center.x + dist, center.y + dist * 0.8, center.z + dist);
  camera.lookAt(center);
  if (controls) {
    controls.target.copy(center);
    controls.minDistance = maxDim * 0.5;
    controls.maxDistance = maxDim * 5;
    controls.update();
  }
  return { size, center, maxDim, dist };
}

export function isMobile() {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

export function supportsWebXR() {
  if (typeof window === "undefined") return false;
  return Boolean(navigator.xr && navigator.xr.isSessionSupported && navigator.xr.isSessionSupported("immersive-ar"));
}

export function isAppleDevice() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(window.navigator.userAgent);
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export function computeModelStats(gltf) {
  let verts = 0;
  let tris = 0;
  gltf.scene.traverse((obj) => {
    if (obj.isMesh && obj.geometry) {
      verts += obj.geometry.attributes.position?.count || 0;
      const index = obj.geometry.index;
      tris += index ? index.count / 3 : (obj.geometry.attributes.position?.count || 0) / 3;
    }
  });
  return { verts, tris: Math.floor(tris), polyCount: Math.floor(tris) };
}