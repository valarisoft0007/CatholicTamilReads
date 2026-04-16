import { z } from "zod";

export const BookCreateSchema = z.object({
  title: z.string().min(1).max(200),
  authorName: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  coverImageUrl: z.string().max(500).optional().default(""),
  status: z.enum(["draft", "published"]),
  order: z.number().int().min(0),
  isFree: z.boolean().optional().default(false),
  bookType: z.enum(["book", "songs"]).optional().default("book"),
  ebookFilename: z.string().max(200).optional().default(""),
  ebookPdfUrl: z.string().max(500).optional().default(""),
  ebookEpubUrl: z.string().max(500).optional().default(""),
});

export const BookUpdateSchema = BookCreateSchema.partial();

export const ChapterCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  order: z.number().int().min(1),
  status: z.enum(["draft", "published"]),
  isFree: z.boolean().optional().default(false),
});

export const ChapterUpdateSchema = ChapterCreateSchema.partial();

export const ReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
