"use client";

import { useRef, useState } from "react";

interface ExportButtonsProps {
  bookId: string;
  bookTitle: string;
  ebookFilename?: string;
  ebookPdfUrl?: string;
  ebookEpubUrl?: string;
  onPublishChange?: () => void;
}

type PublishFormat = "pdf" | "epub";
type GenerateFormat = "pdf" | "epub" | "docx";

export function ExportButtons({
  bookId,
  bookTitle,
  ebookFilename,
  ebookPdfUrl,
  ebookEpubUrl,
  onPublishChange,
}: ExportButtonsProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingEpub, setGeneratingEpub] = useState(false);
  const [generatingDocx, setGeneratingDocx] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingEpub, setUploadingEpub] = useState(false);
  const [unpublishingPdf, setUnpublishingPdf] = useState(false);
  const [unpublishingEpub, setUnpublishingEpub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const epubInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async (format: GenerateFormat) => {
    const setGenerating =
      format === "pdf" ? setGeneratingPdf :
      format === "epub" ? setGeneratingEpub :
      setGeneratingDocx;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/books/${bookId}/export?format=${format}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const rawTitle = ebookFilename?.trim() || bookTitle;
      const sanitizedTitle = rawTitle
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s\-_]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "") || "ebook";
      a.download = `${sanitizedTitle}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (format: PublishFormat, file: File) => {
    const setUploading = format === "pdf" ? setUploadingPdf : setUploadingEpub;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", format);

      const res = await fetch(`/api/admin/books/${bookId}/export/publish`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Upload failed");
      }

      onPublishChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUnpublish = async (format: PublishFormat) => {
    if (!confirm(`Unpublish ${format.toUpperCase()}? Readers will lose access to this download.`)) return;

    const setUnpublishing = format === "pdf" ? setUnpublishingPdf : setUnpublishingEpub;
    setUnpublishing(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/books/${bookId}/export/unpublish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Unpublish failed");
      }

      onPublishChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unpublish failed");
    } finally {
      setUnpublishing(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">eBook Export</h3>

      {error && (
        <div className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* PDF Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-12 text-xs font-medium text-muted">PDF</span>
          <button
            onClick={() => handleGenerate("pdf")}
            disabled={generatingPdf}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-card-hover transition-colors disabled:opacity-50"
          >
            {generatingPdf ? <SpinnerLabel label="Generating..." /> : "Generate & Download"}
          </button>

          {/* Hidden file input */}
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload("pdf", file);
              e.target.value = "";
            }}
          />

          {ebookPdfUrl ? (
            <>
              <span className="text-xs text-success">&#10003; Published</span>
              <button
                onClick={() => handleUnpublish("pdf")}
                disabled={unpublishingPdf}
                className="rounded-md border border-danger/30 px-3 py-1.5 text-xs text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
              >
                {unpublishingPdf ? <SpinnerLabel label="Unpublishing..." /> : "Unpublish"}
              </button>
            </>
          ) : (
            <button
              onClick={() => pdfInputRef.current?.click()}
              disabled={uploadingPdf}
              className="rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-gold-dark transition-colors disabled:opacity-50"
            >
              {uploadingPdf ? <SpinnerLabel label="Uploading..." /> : "Upload for Readers"}
            </button>
          )}
        </div>

        {/* EPUB Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-12 text-xs font-medium text-muted">EPUB</span>
          <button
            onClick={() => handleGenerate("epub")}
            disabled={generatingEpub}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-card-hover transition-colors disabled:opacity-50"
          >
            {generatingEpub ? <SpinnerLabel label="Generating..." /> : "Generate & Download"}
          </button>

          {/* Hidden file input */}
          <input
            ref={epubInputRef}
            type="file"
            accept=".epub,application/epub+zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload("epub", file);
              e.target.value = "";
            }}
          />

          {ebookEpubUrl ? (
            <>
              <span className="text-xs text-success">&#10003; Published</span>
              <button
                onClick={() => handleUnpublish("epub")}
                disabled={unpublishingEpub}
                className="rounded-md border border-danger/30 px-3 py-1.5 text-xs text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
              >
                {unpublishingEpub ? <SpinnerLabel label="Unpublishing..." /> : "Unpublish"}
              </button>
            </>
          ) : (
            <button
              onClick={() => epubInputRef.current?.click()}
              disabled={uploadingEpub}
              className="rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-gold-dark transition-colors disabled:opacity-50"
            >
              {uploadingEpub ? <SpinnerLabel label="Uploading..." /> : "Upload for Readers"}
            </button>
          )}
        </div>

        {/* DOCX Row — admin only, no publish */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-12 text-xs font-medium text-muted">DOCX</span>
          <button
            onClick={() => handleGenerate("docx")}
            disabled={generatingDocx}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-card-hover transition-colors disabled:opacity-50"
          >
            {generatingDocx ? <SpinnerLabel label="Generating..." /> : "Generate & Download"}
          </button>
          <span className="text-xs text-muted">Admin only</span>
        </div>
      </div>
    </div>
  );
}

function SpinnerLabel({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
      {label}
    </span>
  );
}
