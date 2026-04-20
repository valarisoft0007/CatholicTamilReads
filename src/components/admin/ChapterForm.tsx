"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";
import { ChapterContent } from "@/components/reader/ChapterContent";
import type { Chapter } from "@/types";

interface ChapterFormProps {
  bookId: string;
  chapter?: Chapter;
  bookType?: "book" | "songs";
  nextOrder?: number;
}

export function ChapterForm({ bookId, chapter, bookType, nextOrder }: ChapterFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [chapterId] = useState(chapter?.id || `new-${Date.now()}`);
  const [title, setTitle] = useState(chapter?.title || "");
  const [content, setContent] = useState(chapter?.content || "");
  const [order, setOrder] = useState(chapter?.order ?? nextOrder ?? 1);
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
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            {bookType === "songs" ? "Song" : "Chapter"} Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            placeholder={`${bookType === "songs" ? "Song" : "Chapter"} title`}
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
            ? `Update ${bookType === "songs" ? "Song" : "Chapter"}`
            : `Create ${bookType === "songs" ? "Song" : "Chapter"}`}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card transition-colors"
        >
          Preview
        </button>
      </div>
    </form>

    {showPreview && (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
        onClick={() => setShowPreview(false)}
      >
        <div
          className="relative mb-8 mt-8 w-full max-w-3xl rounded-lg bg-background shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold">{title || "Untitled Chapter"}</h2>
              <p className="text-xs text-muted-foreground">Preview — not saved</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="text-xl leading-none text-muted-foreground hover:text-foreground"
              aria-label="Close preview"
            >
              &times;
            </button>
          </div>
          <div className="px-6 py-8">
            {content ? (
              <ChapterContent html={content} />
            ) : (
              <p className="py-12 text-center text-muted-foreground">No content yet.</p>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
