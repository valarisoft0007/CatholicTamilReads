export interface ExportableBook {
  title: string;
  authorName: string;
  description: string;
  coverImageUrl: string;
}

export interface ExportableChapter {
  title: string;
  content: string; // HTML from Tiptap editor
  order: number;
}

export type ExportFormat = "pdf" | "epub" | "docx";
