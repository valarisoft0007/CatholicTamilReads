"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

interface NewsItem {
  id: string;
  title: string;
  content: string;
}

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/news")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      setTitle("");
      setContent("");
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this news item?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    setUpdatingId(id);
    try {
      await fetch(`/api/admin/news/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, title: editTitle, content: editContent } : n
        )
      );
      cancelEdit();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">News</h1>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="mb-8 rounded-lg border border-border bg-card p-5 space-y-4"
      >
        <h2 className="font-semibold">Add News Item</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            placeholder="News headline"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            placeholder="News details..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add Item"}
        </button>
      </form>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">No news items yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) =>
            editingId === item.id ? (
              <div
                key={item.id}
                className="rounded-lg border border-gold/40 bg-card p-4 space-y-3"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Content</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(item.id)}
                    disabled={updatingId === item.id}
                    className="rounded-md bg-gold px-3 py-1.5 text-sm font-medium text-white hover:bg-gold-dark transition-colors disabled:opacity-60"
                  >
                    {updatingId === item.id ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-card-hover transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted line-clamp-2">
                    {item.content}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-sm text-danger hover:underline disabled:opacity-50"
                  >
                    {deletingId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
