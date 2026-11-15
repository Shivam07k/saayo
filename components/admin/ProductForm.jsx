"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Search } from "lucide-react";

const EMPTY_VARIANT = {
  name: "", options: {}, sku: "", regularPrice: "", salePrice: "", costPrice: "",
  stockQuantity: 0, weight: "", isDefault: false, isActive: true,
};

export default function ProductForm({ id }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [relatedPickerOpen, setRelatedPickerOpen] = useState(false);
  const [relatedQuery, setRelatedQuery] = useState("");
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "", slug: "", shortDescription: "", description: "",
    sku: "", barcode: "", regularPrice: "", salePrice: "", costPrice: "",
    taxPercent: 0, stockQuantity: 0, lowStockLimit: 5, weight: "",
    lengthCm: "", widthCm: "", heightCm: "", tags: "",
    brandId: "", categoryId: "", collectionId: "",
    isFeatured: false, isBestSeller: false, isTrending: false, isFlashSale: false,
    flashSalePrice: "", flashSaleEndsAt: "", visibility: "public", isActive: true,
    scheduledAt: "", videoUrl: "", warranty: "", returnEligible: true, returnDays: 7,
    seoTitle: "", seoDescription: "",
    images: [{ url: "", alt: "" }], models: [], variants: [],
    attributes: [{ name: "", value: "" }], relatedIds: [],
  });

  useEffect(() => {
    (async () => {
      const [cats, brs, colls, prodRes] = await Promise.all([
        fetch("/api/categories?all=1").then((r) => r.json()),
        fetch("/api/brands?all=1").then((r) => r.json()),
        fetch("/api/admin/collections?all=1").then((r) => r.json()),
        fetch("/api/products?all=1&limit=50").then((r) => r.json()),
      ]);
      setCategories(cats.categories || []);
      setBrands(brs.brands || []);
      setCollections(colls.collections || []);
      setAllProducts(prodRes.products || []);
      if (id) {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        const p = data.product;
        setForm({
          ...p,
          tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
          flashSaleEndsAt: toLocalInput(p.flashSaleEndsAt),
          scheduledAt: toLocalInput(p.scheduledAt),
          images: p.images?.length ? p.images.map((img) => ({ url: img.url, alt: img.alt || "" })) : [{ url: "", alt: "" }],
          models: p.models || [],
          variants: p.variants?.length ? p.variants : [EMPTY_VARIANT],
          attributes: p.attributes?.length ? p.attributes.map((a) => ({ name: a.name, value: a.value })) : [{ name: "", value: "" }],
          relatedIds: p.relatedFrom?.map((r) => r.related.id) || [],
        });
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const slugFromName = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const buildPayload = () => ({
    name: form.name,
    slug: form.slug || slugFromName(form.name),
    shortDescription: form.shortDescription,
    description: form.description,
    sku: form.sku,
    barcode: form.barcode || "",
    regularPrice: Number(form.regularPrice),
    salePrice: form.salePrice === "" ? null : Number(form.salePrice),
    costPrice: form.costPrice === "" ? null : Number(form.costPrice),
    taxPercent: Number(form.taxPercent || 0),
    stockQuantity: Number(form.stockQuantity || 0),
    lowStockLimit: Number(form.lowStockLimit || 5),
    weight: form.weight === "" ? null : Number(form.weight),
    lengthCm: form.lengthCm === "" ? null : Number(form.lengthCm),
    widthCm: form.widthCm === "" ? null : Number(form.widthCm),
    heightCm: form.heightCm === "" ? null : Number(form.heightCm),
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    brandId: form.brandId || null,
    categoryId: form.categoryId || null,
    collectionId: form.collectionId || null,
    isFeatured: !!form.isFeatured,
    isBestSeller: !!form.isBestSeller,
    isTrending: !!form.isTrending,
    isFlashSale: !!form.isFlashSale,
    flashSalePrice: form.flashSalePrice === "" ? null : Number(form.flashSalePrice),
    flashSaleEndsAt: form.flashSaleEndsAt ? new Date(form.flashSaleEndsAt).toISOString() : null,
    isActive: !!form.isActive,
    visibility: form.visibility,
    scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    videoUrl: form.videoUrl || "",
    warranty: form.warranty || "",
    returnEligible: !!form.returnEligible,
    returnDays: Number(form.returnDays || 7),
    seoTitle: form.seoTitle || "",
    seoDescription: form.seoDescription || "",
    images: form.images.filter((i) => i.url),
    models: form.models.filter((m) => m.url),
    variants: form.variants.filter((v) => v.sku || v.name).map((v) => ({
      ...v,
      regularPrice: Number(v.regularPrice || 0),
      salePrice: v.salePrice === "" || v.salePrice === null ? null : Number(v.salePrice),
      costPrice: v.costPrice === "" || v.costPrice === null ? null : Number(v.costPrice),
      stockQuantity: Number(v.stockQuantity || 0),
      weight: v.weight === "" ? null : Number(v.weight),
      options: parseVariantOptions(v.options),
    })),
    attributes: form.attributes.filter((a) => a.name && a.value),
    relatedIds: form.relatedIds,
  });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = buildPayload();
    const res = await fetch(id ? `/api/products/${id}` : "/api/products", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || data.fieldErrors?.name?.join(", ") || "Save failed");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  };

  if (loading) return <div className="skeleton h-40 w-full" />;

  const inputCls = "input";
  const section = "card p-5";
  const label = "label";

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">{error}</div>}

      <div className={section}>
        <h3 className="mb-4 font-bold">Basics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className={label}>Slug</label>
            <input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from name" />
          </div>
          <div>
            <label className={label}>SKU</label>
            <input className={inputCls} value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div>
            <label className={label}>Barcode</label>
            <input className={inputCls} value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Short description</label>
            <textarea className={inputCls} rows={2} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Description</label>
            <textarea className={inputCls} rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <label className={label}>Category</label>
            <select className={inputCls} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Brand</label>
            <select className={inputCls} value={form.brandId} onChange={(e) => set("brandId", e.target.value)}>
              <option value="">—</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Collection</label>
            <select className={inputCls} value={form.collectionId} onChange={(e) => set("collectionId", e.target.value)}>
              <option value="">—</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Tags (comma separated)</label>
            <input className={inputCls} value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </div>
        </div>
      </div>

      <div className={section}>
        <h3 className="mb-4 font-bold">Pricing & stock</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={label}>Regular price (INR) *</label><input type="number" className={inputCls} value={form.regularPrice} onChange={(e) => set("regularPrice", e.target.value)} required min="0" step="0.01" /></div>
          <div><label className={label}>Sale price</label><input type="number" className={inputCls} value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} min="0" step="0.01" /></div>
          <div><label className={label}>Cost price</label><input type="number" className={inputCls} value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} min="0" step="0.01" /></div>
          <div><label className={label}>Stock Qty</label><input type="number" className={inputCls} value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} /></div>
          <div><label className={label}>Low stock alert</label><input type="number" className={inputCls} value={form.lowStockLimit} onChange={(e) => set("lowStockLimit", e.target.value)} /></div>
          <div><label className={label}>Tax %</label><input type="number" className={inputCls} value={form.taxPercent} onChange={(e) => set("taxPercent", e.target.value)} /></div>
          <div><label className={label}>Weight (g)</label><input type="number" className={inputCls} value={form.weight} onChange={(e) => set("weight", e.target.value)} /></div>
          <div><label className={label}>Length (cm)</label><input type="number" className={inputCls} value={form.lengthCm} onChange={(e) => set("lengthCm", e.target.value)} /></div>
          <div><label className={label}>Width (cm)</label><input type="number" className={inputCls} value={form.widthCm} onChange={(e) => set("widthCm", e.target.value)} /></div>
          <div><label className={label}>Height (cm)</label><input type="number" className={inputCls} value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} /></div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-3 text-sm font-bold">Status</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className={label}>Visibility</label>
              <select className={inputCls} value={form.visibility} onChange={(e) => set("visibility", e.target.value)}>
                {["public", "hidden", "draft", "scheduled"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div><label className={label}>Scheduled publish</label><input type="datetime-local" className={inputCls} value={form.scheduledAt || ""} onChange={(e) => set("scheduledAt", e.target.value)} /></div>
            <div className="flex items-end"><label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active (buyable)</label></div>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-3 text-sm font-bold">Badges & flash sale</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["isFeatured", "Featured"], ["isBestSeller", "Bestseller"], ["isTrending", "Trending"], ["isFlashSale", "Flash sale"],
            ].map(([key, lbl]) => (
              <label key={key} className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!form[key]} onChange={(e) => set(key, e.target.checked)} />
                {lbl}
              </label>
            ))}
          </div>
          {form.isFlashSale && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div><label className={label}>Flash price</label><input type="number" className={inputCls} value={form.flashSalePrice} onChange={(e) => set("flashSalePrice", e.target.value)} min="0" step="0.01" /></div>
              <div><label className={label}>Flash ends at</label><input type="datetime-local" className={inputCls} value={form.flashSaleEndsAt || ""} onChange={(e) => set("flashSaleEndsAt", e.target.value)} /></div>
            </div>
          )}
        </div>
      </div>

      <div className={section}>
        <h3 className="mb-4 font-bold">Shipping & returns</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><label className={label}>Video URL (product demo)</label><input className={inputCls} value={form.videoUrl || ""} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://…" /></div>
          <div><label className={label}>Warranty</label><input className={inputCls} value={form.warranty || ""} onChange={(e) => set("warranty", e.target.value)} placeholder="e.g. 1 year" /></div>
          <div><label className={label}>Return days</label><input type="number" min="0" max="90" className={inputCls} value={form.returnDays} onChange={(e) => set("returnDays", e.target.value)} /></div>
          <div className="flex items-end"><label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!form.returnEligible} onChange={(e) => set("returnEligible", e.target.checked)} /> Return eligible</label></div>
        </div>
      </div>

      <div className={section}>
        <h3 className="mb-4 font-bold">Variants <span className="text-xs font-normal text-slate-400">(size, color, etc.)</span></h3>
        {form.variants.map((v, i) => (
          <div key={i} className="mb-3 grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-12 dark:border-slate-700">
            <div className="sm:col-span-2"><label className={label}>Name</label><input className={inputCls} placeholder="e.g. S / Black" value={v.name} onChange={(e) => setVariant(i, "name", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className={label}>SKU</label><input className={inputCls} value={v.sku} onChange={(e) => setVariant(i, "sku", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className={label}>Price</label><input type="number" className={inputCls} value={v.regularPrice} onChange={(e) => setVariant(i, "regularPrice", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className={label}>Sale</label><input type="number" className={inputCls} value={v.salePrice ?? ""} onChange={(e) => setVariant(i, "salePrice", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className={label}>Stock</label><input type="number" className={inputCls} value={v.stockQuantity} onChange={(e) => setVariant(i, "stockQuantity", e.target.value)} /></div>
            <div className="sm:col-span-2">
              <div className="flex items-center gap-1 pt-6">
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!v.isDefault} onChange={(e) => setVariant(i, "isDefault", e.target.checked)} /> default</label>
                <button type="button" className="btn-outline !p-1.5 ml-auto" onClick={() => set("variants", form.variants.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="sm:col-span-4"><label className={label}>Options (JSON, e.g. {"{"}&quot;size&quot;:&quot;M&quot;,&quot;color&quot;:&quot;Navy&quot;{"}"})</label><input className={inputCls} value={typeof v.options === "string" ? v.options : JSON.stringify(v.options || {})} onChange={(e) => setVariant(i, "options", e.target.value)} /></div>
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => set("variants", [...form.variants, { ...EMPTY_VARIANT }])}><Plus className="mr-1 inline h-4 w-4" /> Add variant</button>
        <p className="mt-2 text-xs text-slate-500">Each row becomes its own selectable SKU with stock tracking on the storefront.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className={section}>
          <h3 className="mb-4 font-bold">Attributes / specs</h3>
          {form.attributes.map((a, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input className={inputCls} placeholder="Name (e.g. Fabric)" value={a.name} onChange={(e) => setAttr(i, "name", e.target.value)} />
              <input className={inputCls} placeholder="Value (e.g. 100% Cotton)" value={a.value} onChange={(e) => setAttr(i, "value", e.target.value)} />
              <button type="button" className="btn-outline !px-3" onClick={() => set("attributes", form.attributes.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" className="btn-outline" onClick={() => set("attributes", [...form.attributes, { name: "", value: "" }])}><Plus className="mr-1 inline h-4 w-4" /> Add attribute</button>
        </div>

        <div className={section}>
          <h3 className="mb-4 font-bold">Related products</h3>
          <button type="button" className="btn-outline" onClick={() => setRelatedPickerOpen(true)}><Search className="mr-1 inline h-4 w-4" /> Pick related products</button>
          {form.relatedIds.length > 0 && (
            <ul className="mt-3 space-y-1">
              {allProducts.filter((p) => form.relatedIds.includes(p.id) && p.id !== id).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                  <span>{p.name}</span>
                  <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => set("relatedIds", form.relatedIds.filter((rid) => rid !== p.id))}>remove</button>
                </li>
              ))}
            </ul>
          )}

          {relatedPickerOpen && (
            <div className="card fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRelatedPickerOpen(false)}>
              <div className="card relative max-h-[80vh] w-full max-w-md overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="mb-3 font-bold">Related products</h3>
                <input className="input mb-3" placeholder="Search products…" value={relatedQuery} onChange={(e) => setRelatedQuery(e.target.value)} />
                <ul className="space-y-1">
                  {allProducts.filter((p) => p.id !== id && (p.name + p.sku || "").toLowerCase().includes(relatedQuery.toLowerCase())).map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                      <span>{p.name}</span>
                      <button
                        type="button"
                        className={`btn-outline !px-3 !py-1 text-xs ${form.relatedIds.includes(p.id) ? "!bg-emerald-600 !text-white" : ""}`}
                        onClick={() => set("relatedIds", form.relatedIds.includes(p.id) ? form.relatedIds.filter((rid) => rid !== p.id) : [...form.relatedIds, p.id])}
                      >
                        {form.relatedIds.includes(p.id) ? "Added" : "Add"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={section}>
        <h3 className="mb-4 font-bold">Images</h3>
        {form.images.map((img, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input className={inputCls} placeholder="Image URL" value={img.url} onChange={(e) => set("images", form.images.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
            <input className={inputCls} placeholder="Alt" value={img.alt} onChange={(e) => set("images", form.images.map((x, j) => j === i ? { ...x, alt: e.target.value } : x))} />
            <button type="button" className="btn-outline !px-3" onClick={() => set("images", form.images.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => set("images", [...form.images, { url: "", alt: "" }])}><Plus className="mr-1 inline h-4 w-4" /> Add image</button>
      </div>

      <div className={section}>
        <h3 className="mb-4 font-bold">3D Models</h3>
        {form.models.map((m, i) => (
          <div key={i} className="mb-2 grid gap-2 sm:grid-cols-[2fr_1fr_auto_auto]">
            <input className={inputCls} placeholder="GLB URL" value={m.url} onChange={(e) => set("models", form.models.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
            <input className={inputCls} placeholder="Name" value={m.name || ""} onChange={(e) => set("models", form.models.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!m.isDefault} onChange={(e) => set("models", form.models.map((x, j) => j === i ? { ...x, isDefault: e.target.checked } : x))} /> default</label>
            <button type="button" className="btn-outline !px-3" onClick={() => set("models", form.models.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" className="btn-outline" onClick={() => set("models", [...form.models, { name: "Default", url: "", format: "glb", isDefault: false, arEnabled: true, arScale: 1, autoRotate: true, environment: "studio" }])}><Plus className="mr-1 inline h-4 w-4" /> Add 3D model</button>
        {(form.models.length === 0 || !form.models.some((m) => m.url)) && (
          <p className="mt-2 text-xs text-slate-500">Tip: run <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run gen:models</code> and use /models/sample-tshirt.glb or /models/sample-tshirt-oversized.glb for testing.</p>
        )}
      </div>

      <div className={section}>
        <h3 className="mb-4 font-bold">SEO</h3>
        <div className="grid gap-4">
          <div><label className={label}>Meta title</label><input className={inputCls} value={form.seoTitle || ""} onChange={(e) => set("seoTitle", e.target.value)} maxLength={160} /></div>
          <div><label className={label}>Meta description</label><textarea className={inputCls} rows={2} value={form.seoDescription || ""} onChange={(e) => set("seoDescription", e.target.value)} maxLength={300} /></div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-outline" onClick={() => router.push("/admin/products")}>Cancel</button>
        <button className="btn-primary" disabled={saving}><Save className="mr-1 inline h-4 w-4" /> {saving ? "Saving…" : id ? "Update product" : "Create product"}</button>
      </div>
    </form>
  );

  function setVariant(i, key, value) {
    set("variants", form.variants.map((x, j) => (j === i ? { ...x, [key]: value } : x)));
  }
  function setAttr(i, key, value) {
    set("attributes", form.attributes.map((x, j) => (j === i ? { ...x, [key]: value } : x)));
  }
}

function parseVariantOptions(value) {
  if (!value) return null;
  if (typeof value === "object") return Object.keys(value).length ? value : null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && Object.keys(parsed).length ? parsed : null;
  } catch {
    return null;
  }
}

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}