"use client";

interface DownloadButtonsProps {
  bookId: string;
  ebookPdfUrl?: string;
  ebookEpubUrl?: string;
}

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export function DownloadButtons({ bookId, ebookPdfUrl, ebookEpubUrl }: DownloadButtonsProps) {
  if (!ebookPdfUrl && !ebookEpubUrl) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium text-muted">Download eBook</p>
      <div className="flex flex-wrap gap-2">
        {ebookPdfUrl && (
          <a
            href={`/api/books/${bookId}/download?format=pdf`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-gold/30 hover:bg-card-hover"
          >
            <DownloadIcon />
            PDF
          </a>
        )}
        {ebookEpubUrl && (
          <a
            href={`/api/books/${bookId}/download?format=epub`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-gold/30 hover:bg-card-hover"
          >
            <DownloadIcon />
            EPUB
          </a>
        )}
      </div>
    </div>
  );
}
