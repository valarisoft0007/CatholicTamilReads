"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";
import type { Chapter } from "@/types";

interface ChapterFormProps {
  bookId: string;
  chapter?: Chapter;
}

export function ChapterForm({ bookId, chapter }: ChapterFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [chapterId] = useState(chapter?.id || `new-${Date.now()}`);
  const [title, setTitle] = useState(chapter?.title || "");
  const [content, setContent] = useState(chapter?.content || "");
  const [order, setOrder] = useState(chapter?.order || 1);
  const [status, setStatus] = useState<"draft" | "published">(
    chapter?.status || "draft"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = { title, content, order, status };

      if (chapter) {
        await fetch(`/api/admin/books/${bookId}/chapters/${chapter.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch(`/api/admin/books/${bookId}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      router.push(`/admin/books/${bookId}/chapters`);
    } catch (err) {
      console.error("Failed to save chapter:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            Chapter Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            placeholder="Chapter title"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-24 rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            min={1}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Content</label>
        <RichTextEditor content={content} onChange={setContent} bookId={bookId} chapterId={chapterId} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : chapter
            ? "Update Chapter"
            : "Create Chapter"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
