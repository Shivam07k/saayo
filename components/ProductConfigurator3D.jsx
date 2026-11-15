"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookmarkPlus, Check, Link2, MapPin, Minus, Package, Plus, Share2, ShoppingCart, SlidersHorizontal, Truck, Zap,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { ColorPicker3D, FinishPicker3D, MaterialPicker3D, VariantSelector3D } from "@/components/VariantPickers3D";
import ARButton from "@/components/ARButton";
import { useStore } from "@/components/StoreProvider";

const OPTION_PRICE_DELTAS = {
  metallic: 800,
  glossy: 250,
  satin: 150,
};

export default function ProductConfigurator3D({
  product,
  model,
  variants = [],
  variant,
  onVariantChange,
  onConfigChange,
  priceBase,
  settings,
}) {
  const router = useRouter();
  const { addToCart, buyNow, toast } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);

  const materialNodes = useMemo(() => {
    const defs = model?.materialNodes;
    if (Array.isArray(defs)) return defs;
    if (defs && typeof defs === "object") return [defs];
    return [];
  }, [model]);

  const enable3D = settings?.productEnable3D ?? true;
  const enableAR = settings?.productEnableAR ?? true;

  const defaultConfig = useMemo(() => {
    const selectedOptions = {};
    const finishes = {};
    for (const def of materialNodes) {
      const colors = def.colors || def.colorOptions || [];
      const mats = def.materials || [];
      selectedOptions[def.node] = colors[0] || null;
      finishes[def.node] = def.finishes?.[0] || "matte";
      if (mats[0]) selectedOptions[`${def.node}_material`] = mats[0];
    }
    return { selectedOptions, finishes };
  }, [materialNodes]);

  const [config, setConfig] = useState(defaultConfig);

  const parseHashConfig = useCallback(() => {
    if (typeof window === "undefined") return null;
    const raw = window.location.hash.replace(/^#config=/, "");
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const shared = parseHashConfig();
    if (shared?.selectedOptions) {
      setConfig(shared);
    } else {
      setConfig(defaultConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model?.id]);

  const onConfigChangeRef = useRef(onConfigChange);
  useEffect(() => {
    onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  useEffect(() => {
    onConfigChangeRef.current?.(config);
  }, [config]);

  const priceDelta = useMemo(() => {
    let delta = 0;
    for (const finish of Object.values(config.finishes || {})) {
      delta += OPTION_PRICE_DELTAS[finish] || 0;
    }
    return delta;
  }, [config]);

  const unitPrice = Math.max(0, Number(priceBase || 0) + priceDelta);
  const totalPrice = unitPrice * quantity;

  const setNodeColor = (node, color) =>
    setConfig((c) => ({ ...c, selectedOptions: { ...c.selectedOptions, [node]: color } }));

  const setNodeMaterial = (node, material) =>
    setConfig((c) => ({ ...c, selectedOptions: { ...c.selectedOptions, [`${node}_material`]: material } }));

  const setNodeFinish = (node, finish) =>
    setConfig((c) => ({ ...c, finishes: { ...c.finishes, [node]: finish } }));

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#config=${encodeURIComponent(JSON.stringify(config))}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast("Configuration link copied", "success");
  };

  const saveConfig = () => {
    setSaving(true);
    setTimeout(() => {
      try {
        const savedList = JSON.parse(localStorage.getItem("saayo_saved_configs") || "[]");
        savedList.push({ productId: product.id, productName: product.name, config, savedAt: Date.now() });
        localStorage.setItem("saayo_saved_configs", JSON.stringify(savedList));
        setSaved(true);
        toast("Configuration saved", "success");
      } catch {
        toast("Could not save configuration", "error");
      }
      setSaving(false);
    }, 300);
  };

  const cartPayload = () => ({
    productId: product.id,
    variantId: variant?.id || null,
    quantity,
    // product/variant let the store render the line instantly, before the server replies
    product,
    variant: variant || null,
    configuration: {
      selectedOptions: config.selectedOptions,
      finishes: config.finishes,
      priceDelta,
    },
  });

  const handleAddToCart = async () => {
    await addToCart(cartPayload());
  };

  const handleBuyNow = async () => {
    setBuying(true);
    const ok = await buyNow(cartPayload());
    setBuying(false);
    if (ok) router.push("/checkout");
  };

  const checkDelivery = async () => {
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setDeliveryStatus({ serviceable: false, message: "Please enter a valid 6-digit pincode" });
      return;
    }
    setCheckingDelivery(true);
    setDeliveryStatus(null);
    try {
      const res = await fetch(`/api/pincode/check?pincode=${encodeURIComponent(pincode)}`);
      const data = await res.json();
      setDeliveryStatus(data);
    } catch {
      setDeliveryStatus({ serviceable: false, message: "Could not check delivery right now. Please try again." });
    }
    setCheckingDelivery(false);
  };

  const variantSelection = variant ? { id: variant.id, name: variant.name } : null;

  function stock() {
    return variant?.stockQuantity ?? product?.stockQuantity ?? 99;
  }

  return (
    <div className="space-y-4">
      {/* variant selector */}
      {variants.length > 1 && (
        <VariantSelector3D
          label="Variant"
          variants={variants}
          value={variantSelection?.id || variants[0]?.id}
          onChange={(vid) => onVariantChange?.(vid)}
        />
      )}

      {/* configurator controls */}
      {enable3D && materialNodes.length > 0 && (
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <button
            className="flex w-full items-center justify-between text-sm font-bold"
            onClick={() => setShowControls((s) => !s)}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Customize in 3D
            </span>
            <span>{showControls ? "Hide" : "Show"}</span>
          </button>

          {showControls && (
            <div className="mt-4 space-y-4">
              {materialNodes.map((def) => {
                const colors = def.colors || def.colorOptions || [];
                const materials = def.materials || [];
                const finishes = def.finishes || ["matte", "glossy", "metallic", "satin"];
                const label = def.label || def.node.replace(/[-_]/g, " ");
                const nodeConfig = config;

                if (def.flexibleOptions) {
                  return (
                    <div key={def.node}>
                      <MaterialPicker3D
                        label={`${label} material`}
                        options={materials}
                        value={nodeConfig.selectedOptions[`${def.node}_material`]}
                        onChange={(m) => setNodeMaterial(def.node, m)}
                      />
                    </div>
                  );
                }
                return (
                  <div key={def.node} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    {colors.length > 1 && (
                      <ColorPicker3D colors={colors} value={nodeConfig.selectedOptions[def.node]} onChange={(c) => setNodeColor(def.node, c)} />
                    )}
                    {materials.length > 0 && (
                      <MaterialPicker3D label="Material" options={materials} value={nodeConfig.selectedOptions[`${def.node}_material`]} onChange={(m) => setNodeMaterial(def.node, m)} />
                    )}
                    <FinishPicker3D label="Finish" value={nodeConfig.finishes[def.node]} onChange={(f) => setNodeFinish(def.node, f)} />
                  </div>
                );
              })}

              <div className="flex gap-2 pt-1">
                <button onClick={share} className="btn-outline btn-sm flex-1">
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
                <button onClick={saveConfig} disabled={saving} className="btn-outline btn-sm flex-1">
                  {saved ? <Check className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                  {saved ? "Saved" : "Save design"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* price + qty + actions */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">Total price</p>
          <p className="text-3xl font-black text-brand-700 dark:text-brand-400">{formatPrice(totalPrice)}</p>
          {priceDelta > 0 && (
            <p className="text-xs text-emerald-600">+{formatPrice(priceDelta)} from custom options</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline rounded-full p-2" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center font-bold">{quantity}</span>
          <button className="btn-outline rounded-full p-2" onClick={() => setQuantity((q) => Math.min(stock(), q + 1))} aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleAddToCart} className="btn-primary w-full py-3 text-base">
          <ShoppingCart className="h-5 w-5" /> Add to Cart
        </button>
        <button onClick={handleBuyNow} disabled={buying} className="btn-dark w-full py-3 text-base">
          <Zap className="h-5 w-5" /> {buying ? "Redirecting…" : "Buy Now"}
        </button>
      </div>

      {/* pincode delivery check */}
      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
          <Truck className="h-4 w-4 text-brand-600" /> Check delivery
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && checkDelivery()}
              placeholder="Enter delivery pincode"
              className="input !py-2 pl-8"
            />
          </div>
          <button onClick={checkDelivery} disabled={checkingDelivery || pincode.length !== 6} className="btn-outline whitespace-nowrap !py-2 text-sm">
            {checkingDelivery ? "Checking…" : "Check"}
          </button>
        </div>
        {deliveryStatus && (
          <div className={`mt-2 flex items-start gap-2 rounded-lg p-2 text-sm ${deliveryStatus.serviceable ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"}`}>
            {deliveryStatus.serviceable ? <Package className="mt-0.5 h-4 w-4 shrink-0" /> : <MapPin className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>
              {deliveryStatus.message}
              {deliveryStatus.serviceable && deliveryStatus.estimatedDays && (
                <span className="block text-xs opacity-80">Estimated delivery: {deliveryStatus.estimatedDays}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {enableAR && model?.arEnabled && (
        <ARButton modelUrl={model.url} modelName={model.name} arScale={Number(model.arScale || 1) || 1}
          onLaunch={() => fetch("/api/3d-models/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelId: model.id, event: "ar" }) }).catch(() => {})} />
      )}
    </div>
  );
}