import { z } from "zod";

export const NewsCreateSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(5000),
});

export const NewsUpdateSchema = NewsCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field (title or content) must be provided" }
);
