"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatDate } from "@/lib/utils";
import { FONT_OPTIONS } from "@/lib/fonts";

export default function AdminPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("pages");
  const [editingPage, setEditingPage] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [p, b] = await Promise.all([
      fetch("/api/admin/pages").then((r) => r.json()),
      fetch("/api/admin/blog").then((r) => r.json()),
    ]);
    setPages(p.pages || []);
    setPosts(b.posts || []);
  };
  useEffect(() => { load(); }, []);

  const submitPage = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/pages", {
      method: editingPage?.isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingPage),
    });
    setSaving(false);
    if (res.ok) { setEditingPage(null); await load(); router.refresh(); }
  };

  const submitPost = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/blog", {
      method: editingPost?.isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingPost),
    });
    setSaving(false);
    if (res.ok) { setEditingPost(null); await load(); router.refresh(); }
  };

  const remove = async () => {
    const url = pendingDelete.type === "post" ? "/api/admin/blog" : "/api/admin/pages";
    await fetch(`${url}?id=${pendingDelete.id}`, { method: "DELETE" });
    setPendingDelete(null);
    await load();
  };

  const newPost = () => setEditingPost({ title: "", slug: "", excerpt: "", content: "", coverImage: "", status: "draft", isNew: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Pages & blog</h2>
        {tab === "blog" && <button className="btn-primary" onClick={newPost}><Plus className="mr-1 inline h-4 w-4" /> New post</button>}
        {tab === "pages" && <button className="btn-primary" onClick={() => setEditingPage({ title: "", slug: "", content: "", seoTitle: "", seoDescription: "", fontFamily: "inter", status: "draft", isNew: true })}><Plus className="mr-1 inline h-4 w-4" /> New page</button>}
      </div>

      <div className="flex gap-2">
        {[["pages", "Pages"], ["blog", "Blog posts"]].map(([k, lbl]) => (
          <button key={k} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === k ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setTab(k)}>{lbl}</button>
        ))}
      </div>

      {tab === "pages" && (
        <DataTable
          columns={[
            { key: "title", label: "Page", render: (p) => <div><p className="font-semibold">{p.title}</p><p className="text-xs text-slate-400"><code>/{p.slug}</code></p></div> },
            { key: "status", label: "Status", render: (p) => <span className={`badge ${p.status === "published" ? "badge-success" : "badge-neutral"}`}>{p.status}</span> },
            { key: "updatedAt", label: "Updated", render: (p) => formatDate(p.updatedAt, "short") },
          ]}
          rows={pages}
          emptyMessage="No custom pages yet"
          actions={(p) => (
            <div className="flex justify-end gap-1">
              <button className="btn-outline !p-2" onClick={() => setEditingPage(p)}><Pencil className="h-4 w-4" /></button>
              <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete({ id: p.id, type: "page" })}><Trash2 className="h-4 w-4" /></button>
            </div>
          )}
        />
      )}

      {tab === "blog" && (
        <DataTable
          columns={[
            { key: "title", label: "Post", render: (p) => <div className="flex items-center gap-3">{p.coverImage ? <Image src={p.coverImage} alt="" width={64} height={40} unoptimized className="h-10 w-16 rounded-lg object-cover" /> : <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"><Newspaper className="h-4 w-4 text-slate-400" /></div>}<span className="font-semibold">{p.title}</span></div> },
            { key: "slug", label: "Slug", render: (p) => <code>{p.slug}</code> },
            { key: "status", label: "Status", render: (p) => <span className={`badge ${p.status === "published" ? "badge-success" : "badge-warning"}`}>{p.status}</span> },
            { key: "publishedAt", label: "Published", render: (p) => p.publishedAt ? formatDate(p.publishedAt, "short") : "—" },
          ]}
          rows={posts}
          emptyMessage="No blog posts yet"
          actions={(p) => (
            <div className="flex justify-end gap-1">
              <button className="btn-outline !p-2" onClick={() => setEditingPost(p)}><Pencil className="h-4 w-4" /></button>
              <button className="btn-outline !border-red-200 !text-red-500 !p-2" onClick={() => setPendingDelete({ id: p.id, type: "post" })}><Trash2 className="h-4 w-4" /></button>
            </div>
          )}
        />
      )}

      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingPage(null)}>
          <form onSubmit={submitPage} className="card relative max-h-[90vh] w-full max-w-2xl space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editingPage.isNew ? "New page" : editingPage.title}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Title *</label><input className="input" value={editingPage.title} required onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })} /></div>
              <div><label className="label">Slug *</label><input className="input" value={editingPage.slug} required onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })} /></div>
            </div>
            <div><label className="label">Content (HTML)</label><textarea className="input font-mono text-xs" rows={12} value={editingPage.content || ""} onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })} /></div>
            <div>
              <label className="label">Font style</label>
              <select className="input" value={editingPage.fontFamily || "inter"} onChange={(e) => setEditingPage({ ...editingPage, fontFamily: e.target.value })}>
                {FONT_OPTIONS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-400">Controls the typography used on this page on the storefront.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">SEO title</label><input className="input" value={editingPage.seoTitle || ""} onChange={(e) => setEditingPage({ ...editingPage, seoTitle: e.target.value })} /></div>
              <div><label className="label">Status</label>
                <select className="input" value={editingPage.status} onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value })}>
                  <option value="draft">Draft</option><option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditingPage(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save page"}</button>
            </div>
          </form>
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingPost(null)}>
          <form onSubmit={submitPost} className="card relative max-h-[90vh] w-full max-w-2xl space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editingPost.isNew ? "New post" : editingPost.title}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Title *</label><input className="input" value={editingPost.title} required onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} /></div>
              <div><label className="label">Slug</label><input className="input" value={editingPost.slug || ""} onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })} /></div>
            </div>
            <div><label className="label">Excerpt</label><input className="input" value={editingPost.excerpt || ""} onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })} /></div>
            <div><label className="label">Content (HTML)</label><textarea className="input font-mono text-xs" rows={12} value={editingPost.content || ""} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Cover image</label><input className="input" value={editingPost.coverImage || ""} onChange={(e) => setEditingPost({ ...editingPost, coverImage: e.target.value })} /></div>
              <div><label className="label">Status</label>
                <select className="input" value={editingPost.status} onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value })}>
                  <option value="draft">Draft</option><option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setEditingPost(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save post"}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this?"
        message="This deletes it permanently. Pages that are part of the storefront will fall back to their static content."
        confirmText="Delete"
        onConfirm={remove}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}