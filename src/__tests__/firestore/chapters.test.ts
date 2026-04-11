import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { getTestDb, setupTestEnvironment, clearFirestore, teardownTestEnvironment } from './helpers'

vi.mock('@/lib/firebase/client', () => ({
  getClientDb: () => getTestDb(),
}))

import { createBook } from '@/lib/firestore/books'
import {
  createChapter,
  deleteChapter,
  getPublishedChapters,
  getAllChapters,
  getChapter,
} from '@/lib/firestore/chapters'
import { getBook } from '@/lib/firestore/books'

const baseBook = {
  title: 'Test Book',
  authorName: 'Author',
  description: '',
  coverImageUrl: '',
  status: 'published' as const,
  order: 1,
  isFree: false,
  ebookFilename: '',
  ebookPdfUrl: '',
  ebookEpubUrl: '',
  viewCount: 0,
}

const baseChapter = {
  title: 'Chapter 1',
  content: 'Some content',
  order: 1,
  status: 'published' as const,
  isFree: false,
  viewCount: 0,
}

let bookId: string

beforeAll(async () => {
  await setupTestEnvironment()
})

beforeEach(async () => {
  await clearFirestore()
  bookId = await createBook(baseBook)
})

afterAll(async () => {
  await teardownTestEnvironment()
})

describe('createChapter', () => {
  it('returns a new chapter ID', async () => {
    const chapterId = await createChapter(bookId, baseChapter)
    expect(typeof chapterId).toBe('string')
    expect(chapterId.length).toBeGreaterThan(0)
  })

  it('increments parent book chapterCount by 1', async () => {
    const before = await getBook(bookId)
    expect(before?.chapterCount).toBe(0)
    await createChapter(bookId, baseChapter)
    const after = await getBook(bookId)
    expect(after?.chapterCount).toBe(1)
  })

  it('increments chapterCount correctly for multiple chapters', async () => {
    await createChapter(bookId, { ...baseChapter, order: 1 })
    await createChapter(bookId, { ...baseChapter, order: 2 })
    const book = await getBook(bookId)
    expect(book?.chapterCount).toBe(2)
  })
})

describe('deleteChapter', () => {
  it('decrements parent book chapterCount by 1', async () => {
    const chapterId = await createChapter(bookId, baseChapter)
    const before = await getBook(bookId)
    expect(before?.chapterCount).toBe(1)
    await deleteChapter(bookId, chapterId)
    const after = await getBook(bookId)
    expect(after?.chapterCount).toBe(0)
  })

  it('removes the chapter document', async () => {
    const chapterId = await createChapter(bookId, baseChapter)
    await deleteChapter(bookId, chapterId)
    const chapter = await getChapter(bookId, chapterId)
    expect(chapter).toBeNull()
  })
})

describe('getPublishedChapters', () => {
  it('returns only published chapters', async () => {
    await createChapter(bookId, { ...baseChapter, status: 'draft', order: 1 })
    await createChapter(bookId, { ...baseChapter, status: 'published', order: 2 })
    const chapters = await getPublishedChapters(bookId)
    expect(chapters.length).toBe(1)
    expect(chapters[0].status).toBe('published')
  })

  it('returns chapters ordered by order asc', async () => {
    await createChapter(bookId, { ...baseChapter, status: 'published', order: 3 })
    await createChapter(bookId, { ...baseChapter, status: 'published', order: 1 })
    await createChapter(bookId, { ...baseChapter, status: 'published', order: 2 })
    const chapters = await getPublishedChapters(bookId)
    expect(chapters.map((c) => c.order)).toEqual([1, 2, 3])
  })
})

describe('getAllChapters', () => {
  it('returns all chapters regardless of status', async () => {
    await createChapter(bookId, { ...baseChapter, status: 'draft', order: 1 })
    await createChapter(bookId, { ...baseChapter, status: 'published', order: 2 })
    const chapters = await getAllChapters(bookId)
    expect(chapters.length).toBe(2)
  })

  it('returns chapters ordered by order asc', async () => {
    await createChapter(bookId, { ...baseChapter, order: 2 })
    await createChapter(bookId, { ...baseChapter, order: 1 })
    const chapters = await getAllChapters(bookId)
    expect(chapters[0].order).toBe(1)
  })

  it('includes bookId in each chapter', async () => {
    await createChapter(bookId, baseChapter)
    const chapters = await getAllChapters(bookId)
    expect(chapters[0].bookId).toBe(bookId)
  })
})
