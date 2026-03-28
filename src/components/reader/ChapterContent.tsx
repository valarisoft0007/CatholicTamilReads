"use client";

interface ChapterContentProps {
  html: string;
}

export function ChapterContent({ html }: ChapterContentProps) {
  return (
    <article
      className="chapter-content prose prose-base mx-auto max-w-3xl sm:prose-lg"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
