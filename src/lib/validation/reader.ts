import { z } from "zod";

export const ReadingProgressSchema = z.object({
  bookId: z.string().min(1).max(128),
  lastChapterId: z.string().min(1).max(128),
  lastChapterOrder: z.number().int().min(1),
  scrollPosition: z.number().min(0).max(100),
});

export const AnalyticsViewSchema = z
  .object({
    type: z.enum(["book", "chapter"]),
    bookId: z.string().min(1).max(128),
    chapterId: z.string().min(1).max(128).optional(),
  })
  .refine((data) => data.type === "book" || data.chapterId !== undefined, {
    message: "chapterId is required when type is 'chapter'",
    path: ["chapterId"],
  });
