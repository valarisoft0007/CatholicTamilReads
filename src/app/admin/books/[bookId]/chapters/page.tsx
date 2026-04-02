"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBook } from "@/lib/firestore/books";
import { getAllChapters } from "@/lib/firestore/chapters";
import { ExportButtons } from "@/components/admin/ExportButtons";
import type { Book, Chapter } from "@/types";

export default function AdminChaptersPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [b, c] = await Promise.all([
      getBook(bookId),
      getAllChapters(bookId),
    ]);
    setBook(b);
    setChapters(c);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [bookId]);

  const handleDelete = async (chapterId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/books/${bookId}/chapters/${chapterId}`, { method: "DELETE" });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Chapters</h1>
          {book && <p className="text-sm text-muted">{book.title}</p>}
        </div>
        <Link
          href={`/admin/books/${bookId}/chapters/new`}
          className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
        >
          New Chapter
        </Link>
      </div>

      {/* eBook Export */}
      {book && (
        <div className="mb-6">
          <ExportButtons
            bookId={bookId}
            bookTitle={book.title}
            ebookFilename={book.ebookFilename}
            ebookPdfUrl={book.ebookPdfUrl}
            ebookEpubUrl={book.ebookEpubUrl}
            onPublishChange={loadData}
          />
        </div>
      )}

      {chapters.length === 0 ? (
        <p className="py-10 text-center text-muted">
          No chapters yet. Add the first chapter.
        </p>
      ) : (
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-sm font-medium text-gold-dark">
                  {chapter.order}
                </span>
                <div>
                  <h3 className="font-medium">{chapter.title}</h3>
                  <span
                    className={`text-xs font-medium ${
                      chapter.status === "published"
                        ? "text-success"
                        : "text-muted"
                    }`}
                  >
                    {chapter.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/books/${bookId}/chapters/${chapter.id}`}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-card-hover transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(chapter.id, chapter.title)}
                  className="rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger/5 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
