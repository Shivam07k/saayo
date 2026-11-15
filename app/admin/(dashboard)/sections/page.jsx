"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { SECTION_TYPES, SECTION_PAGES } from "@/lib/sectionTypes";

const TYPE_OPTIONS = Object.entries(SECTION_TYPES).map(([value, meta]) => ({ value, ...meta }));
const PAGE_VALUES = SECTION_PAGES.map((p) => p.value);
const PAGE_OPTIONS = [...SECTION_PAGES, { value: "__custom__", label: "Other page…" }];
const SOURCES = [
  ["newest", "Newest"],
  ["featured", "Featured"],
  ["best-sellers", "Best sellers"],
  ["trending", "Trending"],
  ["flash-sale", "Flash sale"],
  ["category", "Category"],
  ["collection", "Collection"],
  ["brand", "Brand"],
];

export default function AdminSectionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [brands, setBrands] = useState([]);
  const [customPage, setCustomPage] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/sections");
    setRows((await res.json()).sections || []);
  };
  useEffect(() => {
    load();
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || [])).catch(() => {});
    fetch("/api/collections").then((r) => r.json()).then((d) => setCollections(d.collections || [])).catch(() => {});
    fetch("/api/brands").then((r) => r.json()).then((d) => setBrands(d.brands || [])).catch(() => {});
  }, []);

  const blank = () => ({
    page: "home", type: "banner", title: "", subtitle: "",
    sortOrder: rows.length, isActive: true, config: {},
  });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const pageValue = editing.page === "__custom__" ? (editing.customPage || "home") : editing.page;
    const body = { ...editing, page: pageValue, config: editing.config || {} };
    delete body.customPage;
    delete body.isNew;
    const res = await fetch("/api/admin/sections", {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setEditing(null); await load(); router.refresh(); }
    else if (data.error) alert(data.error);
  };

  const remove = async () => {
    await fetch(`/api/admin/sections?id=${pendingDelete}`, { method: "DELETE" });
    setPendingDelete(null);
    await load();
    router.refresh();
  };

  const toggleActive = async (row) => {
    await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, isActive: !row.isActive }),
    });
    await load();
  };

  const move = async (row, dir) => {
    const samePage = rows.filter((r) => r.page === row.page).sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = samePage.findIndex((r) => r.id === row.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= samePage.length) return;
    const ids = samePage.map((r) => r.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    const res = await fetch("/api/admin/sections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: row.page, ids }),
    });
    if (res.ok) await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">Page Sections</h2>
          <p className="text-sm text-slate-500">Add, edit, reorder and show/hide sections on your pages.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(blank())}><Plus className="mr-1 inline h-4 w-4" /> New section</button>
      </div>

      <DataTable
        columns={[
          { key: "page", label: "Page", render: (r) => <span className="badge badge-neutral">{r.page}</span> },
          { key: "type", label: "Type", render: (r) => <span className="font-semibold">{SECTION_TYPES[r.type]?.label || r.type}</span> },
          { key: "title", label: "Title", render: (r) => r.title || <span className="text-slate-400">—</span> },
          { key: "sortOrder", label: "Order", render: (r) => r.sortOrder },
          { key: "active", label: "Status", render: (r) =>
            r.isActive
              ? <button className="badge badge-success" onClick={() => toggleActive(r)} title="Click to hide"><Eye className="mr-1 inline h-3 w-3" /> visible</button>
              : <button className="badge badge-neutral" onClick={() => toggleActive(r)} title="Click to show"><EyeOff className="mr-1 inline h-3 w-3" /> hidden</button>
          },
        ]}
        rows={rows}
        searchable={false}
        emptyMessage="No sections yet. Click “New section” to build your first one."
        actions={(r) => (
          <div className="flex justify-end gap-1">
            <button className="btn-outline !p-2" aria-label="Move up" disabled={rows.filter((x) => x.page === r.page).sort((a, b) => a.sortOrder - b.sortOrder)[0]?.id === r.id} onClick={() => move(r, -1)}><ChevronUp className="h-4 w-4" /></button>
            <button className="btn-outline !p-2" aria-label="Move down" disabled={rows.filter((x) => x.page === r.page).sort((a, b) => a.sortOrder - b.sortOrder).at(-1)?.id === r.id} onClick={() => move(r, 1)}><ChevronDown className="h-4 w-4" /></button>
            <button className="btn-outline !p-2" onClick={() => { setEditing({ ...r, config: (r.config && typeof r.config === "object" ? r.config : {}) }); setCustomPage(!PAGE_VALUES.includes(r.page)); }}><Pencil className="h-4 w-4" /></button>
            <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete(r.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={submit} className="card relative max-h-[92vh] w-full max-w-xl space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing.id ? "Edit section" : "New section"}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Page</label>
                <select className="input" value={editing.page === "__custom__" ? "__custom__" : (PAGE_VALUES.includes(editing.page) ? editing.page : "__custom__")}
                  onChange={(e) => { const v = e.target.value; setEditing({ ...editing, page: v }); setCustomPage(v === "__custom__"); }}>
                  {PAGE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Section type</label>
                <select className="input" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value, config: {} })}>
                  {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label} — {t.description}</option>)}
                </select>
              </div>
            </div>

            {customPage && (
              <div><label className="label">Page slug (e.g. blog-title-1)</label>
                <input className="input" value={editing.customPage || ""} placeholder="custom-page-slug" onChange={(e) => setEditing({ ...editing, customPage: e.target.value })} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Title</label>
                <input className="input" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Section heading" />
              </div>
              <div><label className="label">Sort order</label>
                <input type="number" className="input" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div><label className="label">Subtitle</label>
              <input className="input" value={editing.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} placeholder="Short description under the heading" />
            </div>

            <ConfigFields editing={editing} setEditing={setEditing} categories={categories} collections={collections} brands={brands} />

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={!!editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              Visible on the page
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save section"}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!pendingDelete} title="Delete section?" message="This removes the section from the page." confirmText="Delete" onConfirm={remove} onClose={() => setPendingDelete(null)} />
    </div>
  );
}

function ConfigFields({ editing, setEditing, categories, collections, brands }) {
  const setCfg = (key, value) => setEditing({ ...editing, config: { ...(editing.config || {}), [key]: value } });
  const cfg = editing.config || {};

  switch (editing.type) {
    case "hero":
      return (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
          <Labeled label="Badge text"><Text v={cfg.badge} set={(x) => setCfg("badge", x)} /></Labeled>
          <Labeled label="Background image URL"><Text v={cfg.image} set={(x) => setCfg("image", x)} /></Labeled>
          <Labeled label="Button 1 label"><Text v={cfg.primaryButtonLabel} set={(x) => setCfg("primaryButtonLabel", x)} /></Labeled>
          <Labeled label="Button 1 link"><Text v={cfg.primaryButtonLink} set={(x) => setCfg("primaryButtonLink", x)} /></Labeled>
          <Labeled label="Button 2 label"><Text v={cfg.secondaryButtonLabel} set={(x) => setCfg("secondaryButtonLabel", x)} /></Labeled>
          <Labeled label="Button 2 link"><Text v={cfg.secondaryButtonLink} set={(x) => setCfg("secondaryButtonLink", x)} /></Labeled>
          <Labeled label="Gradient start (hex)"><Text v={cfg.gradientFrom} set={(x) => setCfg("gradientFrom", x)} /></Labeled>
          <Labeled label="Gradient end (hex)"><Text v={cfg.gradientTo} set={(x) => setCfg("gradientTo", x)} /></Labeled>
        </div>
      );
    case "flash-sale":
      return (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
          <Labeled label="Badge text"><Text v={cfg.badge} set={(x) => setCfg("badge", x)} /></Labeled>
        </div>
      );
    case "banner":
      return (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
          <Labeled label="Image URL"><Text v={cfg.image} set={(x) => setCfg("image", x)} /></Labeled>
          <Labeled label="Link"><Text v={cfg.link} set={(x) => setCfg("link", x)} /></Labeled>
          <Labeled label="Button label"><Text v={cfg.buttonLabel} set={(x) => setCfg("buttonLabel", x)} /></Labeled>
          <Labeled label="Background color (hex)"><Text v={cfg.backgroundColor} set={(x) => setCfg("backgroundColor", x)} /></Labeled>
        </div>
      );
    case "feature-banner":
      return (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
          <div className="col-span-2"><Labeled label="Override banner click-through (leave blank to use the Feature banner in Banners)">
            <Text v={cfg.link} set={(x) => setCfg("link", x)} /></Labeled></div>
          <Labeled label="Image URL"><Text v={cfg.image} set={(x) => setCfg("image", x)} /></Labeled>
          <Labeled label="Button label"><Text v={cfg.buttonLabel} set={(x) => setCfg("buttonLabel", x)} /></Labeled>
        </div>
      );
    case "product-grid": {
      const source = cfg.source || "newest";
      return (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
          <Labeled label="Product source">
            <select className="input" value={source} onChange={(e) => { const v = e.target.value; setCfg("source", v); if (v !== "category" && v !== "collection" && v !== "brand") setCfg("ref", null); }}>
              {SOURCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Labeled>
          {source === "category" && (
            <Labeled label="Category">
              <select className="input" value={cfg.ref || ""} onChange={(e) => setCfg("ref", e.target.value)}>
                <option value="">Select category…</option>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </Labeled>
          )}
          {source === "collection" && (
            <Labeled label="Collection">
              <select className="input" value={cfg.ref || ""} onChange={(e) => setCfg("ref", e.target.value)}>
                <option value="">Select collection…</option>
                {collections.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </Labeled>
          )}
          {source === "brand" && (
            <Labeled label="Brand">
              <select className="input" value={cfg.ref || ""} onChange={(e) => setCfg("ref", e.target.value)}>
                <option value="">Select brand…</option>
                {brands.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
              </select>
            </Labeled>
          )}
          <Labeled label="Max products"><input type="number" min="1" max="20" className="input" value={cfg.limit || 8} onChange={(e) => setCfg("limit", Number(e.target.value))} /></Labeled>
          <Labeled label="Columns (1-5)"><input type="number" min="1" max="5" className="input" value={cfg.columns || 4} onChange={(e) => setCfg("columns", Number(e.target.value))} /></Labeled>
          <div className="col-span-2"><Labeled label="“View all” link (optional)"><Text v={cfg.viewAllLink} set={(x) => setCfg("viewAllLink", x)} /></Labeled></div>
        </div>
      );
    }
    case "custom-html":
      return (
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
          <Labeled label="HTML">
            <textarea rows={6} className="input" value={cfg.html || ""} onChange={(e) => setCfg("html", e.target.value)} placeholder="<div class=&quot;...&quot;>Your content</div>" />
          </Labeled>
        </div>
      );
    default:
      return null;
  }
}

function Labeled({ label, children }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
function Text({ v, set }) {
  return <input className="input" value={v || ""} onChange={(e) => set(e.target.value)} />;
}