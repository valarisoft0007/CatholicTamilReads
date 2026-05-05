"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getBook } from "@/lib/firestore/books";
import { getChaptersPage } from "@/lib/firestore/chapters";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Book, Chapter } from "@/types";
import type { QueryDocumentSnapshot } from "firebase/firestore";

const PAGE_SIZE = 20;

export default function AdminChaptersPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [cursors, setCursors] = useState<(QueryDocumentSnapshot | null)[]>([null]);
  const [hasMore, setHasMore] = useState(false);

  const loadPage = useCallback(async (pageIndex: number, bookData?: Book | null) => {
    setLoading(true);
    const cursor = pageIndex < cursors.length ? cursors[pageIndex] : null;
    const [b, result] = await Promise.all([
      pageIndex === 0 ? getBook(bookId) : Promise.resolve(bookData ?? null),
      getChaptersPage(bookId, cursor),
    ]);
    if (pageIndex === 0 && b) setBook(b);
    setChapters(result.chapters);
    setHasMore(result.hasMore);
    if (result.lastDoc && cursors.length === pageIndex + 1) {
      setCursors((prev) => [...prev, result.lastDoc]);
    }
    setCurrentPage(pageIndex);
    setLoading(false);
    return b;
  }, [bookId, cursors]);

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    const previousChapters = chapters;

    const moved = arrayMove(chapters, oldIndex, newIndex);
    const total = moved.length;
    const reordered = moved.map((c, i) => ({ ...c, order: total - i + currentPage * PAGE_SIZE }));
    setChapters(reordered);

    const startOrder = currentPage * PAGE_SIZE + 1;

    try {
      await fetch(`/api/admin/books/${bookId}/chapters/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: [...reordered].reverse().map((c) => c.id),
          startOrder,
        }),
      });
    } catch {
      setChapters(previousChapters);
      alert("Reorder failed. Please refresh.");
    }
  };

  const handleDelete = async (chapterId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/books/${bookId}/chapters/${chapterId}`, { method: "DELETE" });
    // Reset to page 1 so cursor chain stays consistent after deletion
    setCursors([null]);
    setCurrentPage(0);
    await loadPage(0, book);
  };

  const handleToggleChapterFree = async (chapter: Chapter) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === chapter.id ? { ...c, isFree: !c.isFree } : c))
    );
    await fetch(`/api/admin/books/${bookId}/chapters/${chapter.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFree: !chapter.isFree }),
    });
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
          <h1 className="text-xl font-bold sm:text-2xl">{book?.bookType === "songs" ? "Songs" : "Chapters"}</h1>
          {book && <p className="text-sm text-muted">{book.title}</p>}
        </div>
        <Link
          href={`/admin/books/${bookId}/chapters/new`}
          className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
        >
          New {book?.bookType === "songs" ? "Song" : "Chapter"}
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
            onPublishChange={() => loadPage(currentPage, book)}
          />
        </div>
      )}

      {chapters.length === 0 && currentPage === 0 ? (
        <p className="py-10 text-center text-muted">
          No {book?.bookType === "songs" ? "songs" : "chapters"} yet. Add the first {book?.bookType === "songs" ? "song" : "chapter"}.
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">
            Drag to reorder within this page. To move a {book?.bookType === "songs" ? "song" : "chapter"} across pages, edit its order number directly.
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={chapters.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <SortableChapterItem
                    key={chapter.id}
                    chapter={chapter}
                    bookId={bookId}
                    onToggleFree={handleToggleChapterFree}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-6 flex items-center justify-between">
            <button
              disabled={currentPage === 0}
              onClick={() => loadPage(currentPage - 1, book)}
              className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-card transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted">
              {book && book.chapterCount > 0
                ? `Page ${currentPage + 1} of ${Math.ceil(book.chapterCount / PAGE_SIZE)}`
                : `Page ${currentPage + 1}`}
            </span>
            <button
              disabled={!hasMore}
              onClick={() => loadPage(currentPage + 1, book)}
              className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-card transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SortableChapterItem({
  chapter,
  bookId,
  onToggleFree,
  onDelete,
}: {
  chapter: Chapter;
  bookId: string;
  onToggleFree: (chapter: Chapter) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <Tooltip content="Drag to reorder" position="right">
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="touch-none cursor-grab text-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="11" cy="4" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="11" cy="12" r="1.5" />
          </svg>
        </button>
        </Tooltip>

        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-sm font-medium text-gold-dark">
          {chapter.order}
        </span>
        <div>
          <h3 className="font-medium">{chapter.title}</h3>
          <span
            className={`text-xs font-medium ${
              chapter.status === "published" ? "text-success" : "text-muted"
            }`}
          >
            {chapter.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Free sample toggle */}
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
          <button
            onClick={() => onToggleFree(chapter)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              chapter.isFree ? "bg-success" : "bg-border"
            }`}
            aria-label={`Toggle free sample for ${chapter.title}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                chapter.isFree ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          Free
        </label>

        <Link
          href={`/admin/books/${bookId}/chapters/${chapter.id}`}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-card-hover transition-colors"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(chapter.id, chapter.title)}
          className="rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger/5 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
