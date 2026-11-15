"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Image as ImageIcon, ShieldCheck, RotateCcw, Truck } from "lucide-react";
import ProductGallery from "@/components/ProductGallery";
import ProductConfigurator3D from "@/components/ProductConfigurator3D";
import ModelLoadingOverlay from "@/components/ModelLoadingOverlay";
import { cn } from "@/lib/utils";

const Viewer3D = dynamic(() => import("@/components/Product3DViewer"), {
  ssr: false,
  loading: () => <ModelProgressPlaceholder />,
});

function ModelProgressPlaceholder() {
  return <div className="relative w-full rounded-2xl bg-slate-50 dark:bg-slate-900" style={{ height: 480 }}><ModelLoadingOverlay progress={null} /></div>;
}

export default function ProductView({ product, settings }) {
  const [view, setView] = useState("3d");
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [config, setConfig] = useState(null);
  const [configCounter, setConfigCounter] = useState(0);

  const has3d = product.models?.length > 0;
  const enable3D = settings?.productEnable3D ?? true;
  useEffect(() => {
    if (!has3d || !enable3D) setView("images");
  }, [has3d, enable3D]);

  const variant = useMemo(
    () => product.variants?.find((v) => v.id === selectedVariantId) || product.variants?.find((v) => v.isDefault) || product.variants?.[0],
    [product.variants, selectedVariantId]
  );

  const model = useMemo(() => {
    const variantModel = variant?.id ? product.models?.find((m) => m.variantId === variant.id) : null;
    return variantModel || product.models?.find((m) => m.isDefault) || product.models?.[0];
  }, [product.models, variant]);

  const priceBase = variant?.salePrice || variant?.regularPrice || product.salePrice || product.regularPrice;

  const handleConfigChange = useCallback((cfg) => {
    setConfig(cfg);
    setConfigCounter((c) => c + 1);
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* viewer / gallery */}
      <div>
        <div className="mb-3 flex gap-1 rounded-xl border border-slate-200 p-1 dark:border-slate-800">
          {enable3D && has3d && (
            <button onClick={() => setView("3d")}
              className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold", view === "3d" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300")}>
              <Box className="h-4 w-4" /> 3D Viewer
            </button>
          )}
          <button onClick={() => setView("images")}
            className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold", view === "images" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300")}>
            <ImageIcon className="h-4 w-4" /> Photos
          </button>
        </div>

        {view === "3d" && model && enable3D ? (
          <>
            <Viewer3D
              key={`${model.id}-${configCounter}`}
              settings={settings}
              modelUrl={model.url}
              modelName={model.name}
              config={config}
              materialNodes={model.materialNodes}
              cameraAngle={model.cameraAngle}
              autoRotate={model.autoRotate ?? true}
              environment={model.environment || "city"}
              zoomMin={Number(model.zoomMin || 0.5)}
              zoomMax={Number(model.zoomMax || 12)}
              height={480}
              onModelEvent={(ev) => {
                if (ev.type === "view") {
                  fetch("/api/3d-models/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelId: model.id, event: "view" }) }).catch(() => {});
                }
              }}
            />
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex flex-wrap gap-2">
                {product.variants?.length > 0 ? (
                  <VariantChips
                    variants={product.variants}
                    active={variant?.id}
                    onChange={(id) => setSelectedVariantId(id)}
                  />
                ) : (
                  <span className="text-slate-400">Drag to rotate · Scroll to zoom</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <ProductGallery images={product.images || []} videoUrl={product.videoUrl} productName={product.name} />
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            [Truck, "Ships in 2-4 days", "Free over ₹4,999"],
            [ShieldCheck, "Secure checkout", "Stripe · Razorpay · COD"],
            [RotateCcw, "7-day returns", "Hassle-free returns"],
          ].map(([Icon, title, sub]) => (
            <div key={title} className="card flex flex-col items-center gap-1 p-3 text-center">
              <Icon className="h-5 w-5 text-brand-600" />
              <p className="text-xs font-bold">{title}</p>
              <p className="text-[11px] text-slate-500">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* details */}
      <div>
        <div className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            {product.brand && (
              <LinkBrandMono name={product.brand.name} />
            )}
            {product.category && <LinkCat name={product.category.name} />}
            {product.models?.length > 0 && (
              <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <Box className="h-3 w-3" /> Interactive 3D
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">{product.name}</h1>
          {product.ratingCount > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              ★ {Number(product.ratingAvg).toFixed(1)} · {product.ratingCount} ratings
            </p>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-black">{formatPriceLocal(priceBase)}</span>
            {product.salePrice && Number(product.salePrice) < Number(product.regularPrice) && (
              <span className="text-lg text-slate-400 line-through">{formatPriceLocal(product.regularPrice)}</span>
            )}
            {getDiscountPercentLocal(product) > 0 && (
              <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {getDiscountPercentLocal(product)}% off
              </span>
            )}
          </div>
          {Number(product.taxPercent) > 0 && <p className="mt-1 text-xs text-slate-500">Inclusive of {product.taxPercent}% tax</p>}

          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className={cn("badge", (variant?.stockQuantity ?? product.stockQuantity) > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400")}>
              {(variant?.stockQuantity ?? product.stockQuantity) > 0 ? `In stock · ${variant?.stockQuantity ?? product.stockQuantity} available` : "Out of stock"}
            </span>
          </div>
        </div>

        <ProductConfigurator3D
          settings={settings}
          product={product}
          model={model}
          variants={product.variants || []}
          variant={variant}
          onVariantChange={setSelectedVariantId}
          onConfigChange={handleConfigChange}
          priceBase={priceBase}
        />

        {product.shortDescription && (
          <p className="mt-6 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
            {product.shortDescription}
          </p>
        )}
        {product.description && (
          <div className="prose-content mt-4 text-sm">
            <p className="font-semibold text-slate-900 dark:text-white">Product details</p>
            <p>{product.description}</p>
          </div>
        )}
        {product.attributes?.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="mb-2 text-sm font-bold">Specifications</p>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {product.attributes.map((a) => (
                <div key={a.id} className="flex gap-2">
                  <dt className="font-medium text-slate-500">{a.name}</dt>
                  <dd>{a.value}</dd>
                </div>
              ))}
              {product.weight && <><dt className="font-medium text-slate-500">Weight</dt><dd>{product.weight} kg</dd></>}
              {product.sku && <><dt className="font-medium text-slate-500">SKU</dt><dd>{product.sku}</dd></>}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkBrandMono({ name }) {
  return <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">{name}</span>;
}
function LinkCat({ name }) {
  return <span className="text-slate-500">{name}</span>;
}
function VariantChips({ variants, active, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {variants.map((v) => (
        <button key={v.id} onClick={() => onChange(v.id)}
          className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold", active === v.id ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300")}>
          {v.name}
        </button>
      ))}
    </div>
  );
}
function formatPriceLocal(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}
function getDiscountPercentLocal(product) {
  const sale = product.salePrice ? Number(product.salePrice) : Number(product.regularPrice);
  const reg = Number(product.regularPrice);
  if (!reg || sale >= reg) return 0;
  return Math.round(((reg - sale) / reg) * 100);
}