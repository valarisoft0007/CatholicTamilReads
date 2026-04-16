"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./ImageUpload";
import { getBookCoverPath } from "@/lib/firebase/storage";
import type { Book } from "@/types";

interface BookFormProps {
  book?: Book;
}

export function BookForm({ book }: BookFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(book?.title || "");
  const [description, setDescription] = useState(book?.description || "");
  const [authorName, setAuthorName] = useState(book?.authorName || "");
  const [coverImageUrl, setCoverImageUrl] = useState(book?.coverImageUrl || "");
  const [status, setStatus] = useState<"draft" | "published">(
    book?.status || "draft"
  );
  const [order, setOrder] = useState(book?.order || 0);
  const [isFree, setIsFree] = useState(book?.isFree || false);
  const [bookType, setBookType] = useState<"book" | "songs">(book?.bookType || "book");
  const [ebookFilename, setEbookFilename] = useState(book?.ebookFilename || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = { title, description, authorName, coverImageUrl, status, order, isFree, bookType, ebookFilename };

      if (book) {
        await fetch(`/api/admin/books/${book.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("/api/admin/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      router.push("/admin/books");
    } catch (err) {
      console.error("Failed to save book:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const bookId = book?.id || "new-book";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="flex gap-6">
        <ImageUpload
          currentUrl={coverImageUrl}
          storagePath={getBookCoverPath(bookId, "cover.jpg")}
          onUpload={setCoverImageUrl}
        />

        <div className="flex-1 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Author</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          eBook Download Filename{" "}
          <span className="font-normal text-muted">(English, no extension)</span>
        </label>
        <input
          type="text"
          value={ebookFilename}
          onChange={(e) => setEbookFilename(e.target.value)}
          placeholder="e.g. Confessions-of-a-Saint"
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <p className="mt-1 text-xs text-muted">
          Used as the filename when readers download the PDF/EPUB. Leave blank to auto-generate from title.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
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

        <div>
          <label className="mb-1 block text-sm font-medium">Book Type</label>
          <select
            value={bookType}
            onChange={(e) => setBookType(e.target.value as "book" | "songs")}
            className="rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="book">Book</option>
            <option value="songs">Songs</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-24 rounded-md border border-border px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            min={0}
          />
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="h-4 w-4 rounded accent-gold"
            />
            Free Book
            <span className="font-normal text-muted">(no login required)</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : book ? "Update Book" : "Create Book"}
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
