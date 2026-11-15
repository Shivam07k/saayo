"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAppleDevice } from "@/lib/threeUtils";
import { ensureModelViewerLoaded, openAr } from "@/lib/modelViewer";

export default function ARButton({
  modelUrl,
  modelName = "Product",
  config = null,
  arScale = 1,
  className = "",
  onLaunch,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const launch = async () => {
    if (!modelUrl) return;
    setLoading(true);
    setError(false);
    try {
      const ok = await ensureModelViewerLoaded();
      if (!ok) throw new Error("AR viewer unavailable");
      const res = openAr(modelUrl, arScale, config?.arPosition);
      if (!res.ok) throw new Error("AR not supported");
      onLaunch?.({ type: "ar" });
    } catch (e) {
      setError(true);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={launch}
        disabled={loading || !modelUrl}
        className={cn("btn flex w-full items-center justify-center gap-2 border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300", className)}
      >
        <ScanLine className="h-4 w-4" />
        {loading ? "Starting AR…" : "Preview in AR"}
        {isAppleDevice() ? "" : " · 3D"}
        {modelName ? <span className="hidden sm:inline opacity-60">· {modelName}</span> : null}
      </button>
      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          AR isn&apos;t supported on this device/browser. Try Chrome or Safari on a mobile device.
        </p>
      )}
    </div>
  );
}