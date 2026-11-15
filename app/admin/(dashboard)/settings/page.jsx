"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Save, X } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/settings");
      const d = await res.json();
      setSettings(d.settings);
    })();
  }, []);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) {
      setToast("Settings saved. Changes apply to the storefront immediately.");
      setTimeout(() => setToast(""), 3500);
    } else {
      setToast("Failed to save settings");
      setTimeout(() => setToast(""), 3500);
    }
  };

  if (!settings) {
    return <div className="animate-pulse text-sm text-slate-500">Loading settings…</div>;
  }

const input = "input";
const label = "label";

const THEME_PRESETS = [
  ["Blue", "#2563eb"], ["Indigo", "#4f46e5"], ["Violet", "#7c3aed"], ["Purple", "#9333ea"],
  ["Pink", "#db2777"], ["Rose", "#e11d48"], ["Red", "#dc2626"], ["Orange", "#ea580c"],
  ["Amber", "#d97706"], ["Emerald", "#059669"], ["Teal", "#0d9488"], ["Cyan", "#0891b2"],
  ["Sky", "#0284c7"], ["Slate", "#334155"],
].map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Settings</h2>
        <button className="btn-primary" onClick={save} disabled={saving}>
          <Save className="mr-1 inline h-4 w-4" /> {saving ? "Saving…" : "Save all"}
        </button>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Branding</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Store name</label><input className={input} value={settings.storeName} onChange={(e) => set("storeName", e.target.value)} /></div>
          <div><label className={label}>Tagline</label><input className={input} value={settings.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
        </div>
        <ImageUrlField label="Logo" hint="PNG/JPG with transparent background works best. Shown in the header & footer." value={settings.logoUrl} onChange={(v) => set("logoUrl", v)} />
        <ImageUrlField label="Favicon" hint="Small square icon shown in the browser tab." value={settings.faviconUrl} onChange={(v) => set("faviconUrl", v)} />
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Theme</h3>
        <p className="text-xs text-slate-500">Pick a brand color. It recalculates all 11 brand shades (buttons, links, highlights, homepage gradient) across the whole site instantly.</p>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.value}
              title={preset.label}
              type="button"
              onClick={() => set("primaryColor", preset.value)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${settings.primaryColor?.toLowerCase() === preset.value ? "border-slate-900 ring-2 ring-offset-2 dark:border-white" : "border-transparent hover:scale-110"}`}
              style={{ backgroundColor: preset.value }}
            >
              {settings.primaryColor?.toLowerCase() === preset.value && <span className="h-2 w-2 rounded-full bg-white/90" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700" style={{ backgroundColor: settings.primaryColor || "#2563eb" }}>
            <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={settings.primaryColor || "#2563eb"} onChange={(e) => set("primaryColor", e.target.value)} aria-label="Custom brand color" />
          </div>
          <input className="input !w-32 font-mono" value={settings.primaryColor || ""} onChange={(e) => set("primaryColor", e.target.value)} placeholder="#2563eb" />
          <span className="text-sm text-slate-500">Custom color (pick or paste a hex value)</span>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Announcement bar</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={settings.announcementEnabled} onChange={(e) => set("announcementEnabled", e.target.checked)} />
            Show announcement bar
          </label>
          <div><label className={label}>Link (optional)</label><input className={input} value={settings.announcementLink} onChange={(e) => set("announcementLink", e.target.value)} placeholder="/shop?sale=1" /></div>
        </div>
        <div><label className={label}>Announcement text</label><input className={input} value={settings.announcementText} onChange={(e) => set("announcementText", e.target.value)} placeholder="Free shipping on all orders over ₹4,999 — this weekend only!" /></div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">SEO</h3>
        <div><label className={label}>Default page title</label><input className={input} value={settings.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /></div>
        <div><label className={label}>Meta description</label><textarea className={input} rows={3} value={settings.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} /></div>
        <p className="text-xs text-slate-500">Page titles become “{settings.seoTitle}” for the rest of the site via a “&lt;section&gt; | Store name” template.</p>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Homepage</h3>
        <div><label className={label}>Hero badge</label><input className={input} value={settings.heroBadge} onChange={(e) => set("heroBadge", e.target.value)} placeholder="New · 3D Configurator + AR Try-On" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">USP {n}</div>
              <input className="input mb-2" value={settings[`usp${n}Title`]} onChange={(e) => set(`usp${n}Title`, e.target.value)} placeholder="Title" />
              <input className="input" value={settings[`usp${n}Text`]} onChange={(e) => set(`usp${n}Text`, e.target.value)} placeholder="Short description" />
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Store operations</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Currency (display)</label>
            <select className={input} value={settings.currency} onChange={(e) => set("currency", e.target.value)}>
              {["INR", "USD", "EUR", "GBP", "AED"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-xs text-slate-500">Checkout amounts still follow STRIPE_PRICE_CURRENCY / CURRENCY env vars.</p>
          </div>
          <div><label className={label}>Free shipping threshold</label><input type="number" className={input} value={settings.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", e.target.value)} /></div>
          <div><label className={label}>COD minimum amount</label><input type="number" className={input} value={settings.codMinAmount} onChange={(e) => set("codMinAmount", e.target.value)} /></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={settings.shippingEnabled} onChange={(e) => set("shippingEnabled", e.target.checked)} /> Shipping enabled</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={settings.taxEnabled} onChange={(e) => set("taxEnabled", e.target.checked)} /> Tax enabled</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={settings.codEnabled} onChange={(e) => set("codEnabled", e.target.checked)} /> Cash on delivery enabled</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={settings.autoApproveReviews} onChange={(e) => set("autoApproveReviews", e.target.checked)} /> Auto-approve reviews</label>
        </div>
        <WarningSwitch value={settings.maintenanceMode} onChange={(v) => set("maintenanceMode", v)} />
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Support phone</label><input className={input} value={settings.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} /></div>
          <div><label className={label}>Support email</label><input className={input} value={settings.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={label}>Address</label><textarea className={input} rows={2} value={settings.address} onChange={(e) => set("address", e.target.value)} /></div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Social</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Instagram", "socialInstagram"], ["Facebook", "socialFacebook"], ["Twitter / X", "socialTwitter"],
            ["YouTube", "socialYoutube"], ["TikTok", "socialTiktok"], ["LinkedIn", "socialLinkedin"],
            ["WhatsApp", "socialWhatsApp"],
          ].map(([labelText, key]) => (
            <div key={key}><label className={label}>{labelText}</label><input className={input} value={settings[key] || ""} onChange={(e) => set(key, e.target.value)} placeholder="https://…" /></div>
          ))}
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Footer</h3>
        <div><label className={label}>About text</label><textarea className={input} rows={2} value={settings.footerAbout} onChange={(e) => set("footerAbout", e.target.value)} /></div>
        <div><label className={label}>Payment methods line</label><input className={input} value={settings.paymentsBadge} onChange={(e) => set("paymentsBadge", e.target.value)} /></div>
        <div><label className={label}>Copyright text (optional)</label><input className={input} value={settings.copyrightText} onChange={(e) => set("copyrightText", e.target.value)} placeholder="Defaults to © {year} {store name}. All rights reserved." /></div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Refund policy</h3>
        <textarea className="input" rows={5} value={settings.refundPolicy} onChange={(e) => set("refundPolicy", e.target.value)} placeholder="Paste your return & refund policy here. Used in the /return-refund-policy page." />
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">3D Viewer</h3>
        <p className="text-xs text-slate-500">Global defaults for the product 3D viewer. Individual products can override via their 3D model config.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Auto-rotate</label>
            <select className={input} value={settings.viewerAutoRotate ? "true" : "false"} onChange={(e) => set("viewerAutoRotate", e.target.value === "true")}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select></div>
          <div><label className={label}>Environment preset</label>
            <select className={input} value={settings.viewerEnvironment} onChange={(e) => set("viewerEnvironment", e.target.value)}>
              {["city", "studio", "warehouse", "forest", "apartment", "parking", "sunrise", "dawn", "night", "lobby"].map((e) => <option key={e} value={e}>{e}</option>)}
            </select></div>
          <div><label className={label}>Zoom min</label><input type="number" step="0.1" min="0.1" className={input} value={settings.viewerZoomMin} onChange={(e) => set("viewerZoomMin", Number(e.target.value))} /></div>
          <div><label className={label}>Zoom max</label><input type="number" step="0.1" min="0.1" className={input} value={settings.viewerZoomMax} onChange={(e) => set("viewerZoomMax", Number(e.target.value))} /></div>
          <div><label className={label}>Camera theta (deg)</label><input type="number" className={input} value={settings.viewerCameraTheta} onChange={(e) => set("viewerCameraTheta", Number(e.target.value))} /></div>
          <div><label className={label}>Camera phi (deg)</label><input type="number" className={input} value={settings.viewerCameraPhi} onChange={(e) => set("viewerCameraPhi", Number(e.target.value))} /></div>
          <div><label className={label}>Camera radius</label><input type="number" step="0.1" className={input} value={settings.viewerCameraRadius} onChange={(e) => set("viewerCameraRadius", Number(e.target.value))} /></div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Product page</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={settings.productEnable3D} onChange={(e) => set("productEnable3D", e.target.checked)} /> Enable 3D viewer</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={settings.productEnableAR} onChange={(e) => set("productEnableAR", e.target.checked)} /> Enable AR try-on</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={settings.productEnableReviews} onChange={(e) => set("productEnableReviews", e.target.checked)} /> Show reviews</label>
          <div><label className={label}>Related products limit</label><input type="number" min="0" max="12" className={input} value={settings.productRelatedLimit} onChange={(e) => set("productRelatedLimit", Number(e.target.value))} /></div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h3 className="font-bold">Checkout</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={settings.checkoutGuestEnabled} onChange={(e) => set("checkoutGuestEnabled", e.target.checked)} /> Guest checkout</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={settings.checkoutShowOrderSummary} onChange={(e) => set("checkoutShowOrderSummary", e.target.checked)} /> Show order summary sidebar</label>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}

function WarningSwitch({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" className="h-4 w-4 rounded accent-red-600" checked={value} onChange={(e) => { if (e.target.checked) setOpen(true); else onChange(false); }} />
        Maintenance mode
      </label>
      <span className="text-xs text-amber-700 dark:text-amber-400">
        {value ? "LIVE — customers see a maintenance page. You can still access /admin." : "Turn on to take the storefront offline."}
      </span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Enable maintenance mode?</h3>
            <p className="mt-1 text-sm text-slate-500">The public storefront will be replaced by a maintenance page. The admin panel stays accessible.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary !bg-red-600 hover:!bg-red-700" onClick={() => { onChange(true); setOpen(false); }}>Enable</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageUrlField({ label, hint, value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl: reader.result, folder: "saayo/brand", assetType: "image" }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Upload failed");
        onChange(d.url);
      } catch (e) {
        setError(e.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="label">{label}</label>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          {/* admin can paste any host; next/image would reject hosts missing from remotePatterns */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt={label} className="h-full w-full object-contain" /> : <ImagePlus className="h-5 w-5 text-slate-300" />}
        </div>
        <input className="input min-w-0 flex-1" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="https://res.cloudinary.com/… or upload" />
        <button type="button" className="btn-outline !p-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
        {value && (
          <button type="button" className="btn-outline !p-2" onClick={() => onChange("")} title="Clear">
            <X className="h-4 w-4" />
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}