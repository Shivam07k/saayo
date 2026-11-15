"use client";

import {
  Component, Suspense, useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, useGLTF, useProgress } from "@react-three/drei";
import {
  Expand, Maximize, Minimize, RefreshCcw, Rotate3D, Box, Layers, Loader2,
} from "lucide-react";
import ModelLoadingOverlay from "@/components/ModelLoadingOverlay";
import ModelErrorState from "@/components/ModelErrorState";
import { CreateArHint } from "@/components/VariantPickers3D";
import { cn } from "@/lib/utils";
import { computeModelStats } from "@/lib/threeUtils";

class ModelBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

function PhysicalModel({ url, config, materialNodes, onStats }) {
  const gltf = useGLTF(url);
  const { scene } = gltf;

  useEffect(() => {
    if (!config?.selectedOptions) return;
    try {
      for (const def of materialNodes || []) {
        const mesh = findNode(scene, def.node);
        if (!mesh?.material) continue;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (def.colors?.length && config.selectedOptions[def.node]) {
            if (mat.color) mat.color.set(config.selectedOptions[def.node]);
          }
          if (mat.roughness !== undefined && config.finishes?.[def.node]) {
            const finish = FINISH_MAP[config.finishes[def.node]];
            if (finish) {
              mat.roughness = finish.roughness;
              mat.metalness = finish.metalness;
            }
          }
          mat.needsUpdate = true;
        });
      }
    } catch (e) {
      console.warn("config apply failed", e);
    }
  }, [config, materialNodes, scene]);

  useEffect(() => {
    try {
      const stats = computeModelStats(gltf);
      onStats?.(stats);
    } catch {
      /* noop */
    }
  }, [gltf, onStats]);

  return <primitive object={scene} />;
}

const FINISH_MAP = {
  matte: { roughness: 0.85, metalness: 0 },
  glossy: { roughness: 0.2, metalness: 0.05 },
  metallic: { roughness: 0.3, metalness: 1 },
  satin: { roughness: 0.45, metalness: 0.1 },
  default: { roughness: 0.6, metalness: 0.1 },
};

function findNode(root, name) {
  let found = null;
  root.traverse((child) => {
    if (child.isMesh && (child.name === name || child.material?.name === name || child.userData?.role === name)) {
      found = child;
    }
  });
  return found;
}

function Scene({ url, config, materialNodes, cameraAngle, autoRotate, environment, zoomMin, zoomMax, settings, onStats, onControls }) {
  const controlsRef = useRef(null);

  const effectiveAutoRotate = autoRotate ?? settings?.viewerAutoRotate ?? true;
  const effectiveEnvironment = environment ?? settings?.viewerEnvironment ?? "city";
  const effectiveZoomMin = zoomMin ?? settings?.viewerZoomMin ?? 0.5;
  const effectiveZoomMax = zoomMax ?? settings?.viewerZoomMax ?? 12;
  const effectiveCameraAngle = cameraAngle ?? (settings ? { theta: settings.viewerCameraTheta, phi: settings.viewerCameraPhi, radius: settings.viewerCameraRadius } : { theta: 30, phi: 40, radius: 3.2 });

  const [initial] = useState(() => effectiveCameraAngle);

  useFrame(() => {
    if (controlsRef.current && autoRotate) controlsRef.current.autoRotate = autoRotate;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 4]} intensity={1.4} castShadow />
      <spotLight position={[-6, 6, -4]} intensity={0.8} angle={0.4} penumbra={1} />
      <Suspense fallback={null}>
        <PhysicalModel url={url} config={config} materialNodes={materialNodes} onStats={onStats} />
        <ContactShadows position={[0, -1.2, 0]} opacity={0.45} scale={8} blur={2.4} far={3} />
      </Suspense>
      <Environment preset={environment || "city"} />
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        autoRotate={Boolean(autoRotate)}
        autoRotateSpeed={2}
        minDistance={zoomMin || 0.5}
        maxDistance={zoomMax || 12}
        target={[0, 0.5, 0]}
        makeDefault
      />
      <RigTilt />
    </>
  );
}

function RigTilt() {
  return null;
}

// Listens for GPU context loss / restore on the renderer's canvas.
// three.js needs `preventDefault()` on loss so the browser can attempt a
// restore; if it doesn't come back quickly the parent remounts a fresh
// renderer + context so the view always recovers instead of going blank.
function ContextGuard({ onLost, onRestored }) {
  const gl = useThree((state) => state.gl);
  const lostRef = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;
    const onContextLost = (e) => {
      e.preventDefault();
      if (!lostRef.current) {
        lostRef.current = true;
        onLost?.();
      }
    };
    const onContextRestored = () => {
      lostRef.current = false;
      onRestored?.();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
    };
  }, [gl, onLost, onRestored]);

  return null;
}

export default function Product3DViewer({
  modelUrl,
  modelName = "3D Model",
  config = null,
  materialNodes = null,
  autoRotate,
  cameraAngle,
  environment,
  zoomMin,
  zoomMax,
  height = 480,
  settings = null,
  onModelEvent,
}) {
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [ctxLost, setCtxLost] = useState(false);
  const wrapRef = useRef(null);
  const restoreTimer = useRef(null);

  const handleContextLost = useCallback(() => {
    setCtxLost(true);
    clearTimeout(restoreTimer.current);
    // If the browser doesn't restore the context itself within a second,
    // remount the Canvas to force a brand-new WebGLRenderer + context.
    restoreTimer.current = setTimeout(() => {
      setResetKey((k) => k + 1);
      setCtxLost(false);
    }, 1000);
  }, []);

  const handleContextRestored = useCallback(() => {
    clearTimeout(restoreTimer.current);
    setCtxLost(false);
  }, []);

  useEffect(() => () => clearTimeout(restoreTimer.current), []);

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (modelUrl && typeof onModelEvent === "function") {
      const t = setTimeout(() => onModelEvent({ type: "view" }), 3000);
      return () => clearTimeout(t);
    }
  }, [modelUrl, onModelEvent]);

  useEffect(() => {
    if (stats && typeof onModelEvent === "function") {
      onModelEvent({ type: "stats", stats });
    }
  }, [stats, onModelEvent]);

  if (!modelUrl) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <ProductPlaceholder />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-900" style={{ height }}>
      <Canvas key={resetKey} shadows dpr={[1, 2]}>
        <ContextGuard onLost={handleContextLost} onRestored={handleContextRestored} />
        <ModelBoundary fallback={(err) => {
          setError(err?.message || "Failed to load model");
          return null;
        }}>
          <Suspense fallback={null}>
            <Scene
              url={modelUrl}
              config={config}
              materialNodes={materialNodes}
              cameraAngle={cameraAngle}
              autoRotate={autoRotate}
              environment={environment}
              zoomMin={zoomMin}
              zoomMax={zoomMax}
              settings={settings}
              onStats={setStats}
            />
          </Suspense>
        </ModelBoundary>
      </Canvas>

      {/* controls */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
        <IconBtn label="Reset view" onClick={() => setResetKey((k) => k + 1)}>
          <RefreshCcw className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Toggle fullscreen" onClick={toggleFullscreen}>
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </IconBtn>
      </div>

      <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow dark:bg-slate-900/90 dark:text-slate-200">
        <Box className="h-3.5 w-3.5 text-brand-600" /> {modelName}
        {stats && <span className="text-slate-400">· {stats.polyCount.toLocaleString()} tris</span>}
      </div>

      <CreateArHint />

      {ctxLost && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-slate-50/95 text-slate-500 dark:bg-slate-900/95">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <p className="text-sm font-semibold">Restoring 3D view…</p>
        </div>
      )}

      {error && <ModelErrorState onRetry={() => setError(null)} />}
    </div>
  );
}

function IconBtn({ children, label, onClick }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow transition hover:text-brand-600 dark:bg-slate-900/90 dark:text-slate-300">
      {children}
    </button>
  );
}

function ProductPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-700">
      <Box className="h-16 w-16" />
      <p className="text-sm">No 3D model for this product</p>
    </div>
  );
}