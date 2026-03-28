"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChapterForm } from "@/components/admin/ChapterForm";
import { getChapter } from "@/lib/firestore/chapters";
import type { Chapter } from "@/types";

export default function EditChapterPage() {
  const { bookId, chapterId } = useParams<{
    bookId: string;
    chapterId: string;
  }>();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChapter(bookId, chapterId)
      .then(setChapter)
      .finally(() => setLoading(false));
  }, [bookId, chapterId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!chapter) {
    return <p className="py-10 text-center text-muted">Chapter not found.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">Edit Chapter</h1>
      <ChapterForm bookId={bookId} chapter={chapter} />
    </div>
  );
}
