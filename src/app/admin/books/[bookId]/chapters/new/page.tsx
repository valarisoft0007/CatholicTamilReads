"use client";
export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { ChapterForm } from "@/components/admin/ChapterForm";

export default function NewChapterPage() {
  const { bookId } = useParams<{ bookId: string }>();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">New Chapter</h1>
      <ChapterForm bookId={bookId} />
    </div>
  );
}
