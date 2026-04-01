import { Timestamp } from "firebase/firestore";

export interface Book {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  authorName: string;
  status: "draft" | "published";
  chapterCount: number;
  order: number;
  ebookPdfUrl?: string;
  ebookEpubUrl?: string;
  ebookFilename?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  content: string;
  order: number;
  status: "draft" | "published";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
}

export interface Bookmark {
  id: string;
  bookId: string;
  chapterId: string;
  bookTitle: string;
  chapterTitle: string;
  createdAt: Timestamp;
}

export interface Favorite {
  bookId: string;
  bookTitle: string;
  coverImageUrl: string;
  createdAt: Timestamp;
}

export interface ReadingProgress {
  bookId: string;
  lastChapterId: string;
  lastChapterOrder: number;
  scrollPosition: number;
  updatedAt: Timestamp;
}
