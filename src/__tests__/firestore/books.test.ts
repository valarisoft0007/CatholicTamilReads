import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { getTestDb, setupTestEnvironment, clearFirestore, teardownTestEnvironment } from './helpers'

// Point the client module at the emulator Firestore instance
vi.mock('@/lib/firebase/client', () => ({
  getClientDb: () => getTestDb(),
}))

import {
  createBook,
  getBook,
  getPublishedBooks,
  getAllBooks,
  updateBook,
  deleteBook,
} from '@/lib/firestore/books'

const baseBook = {
  title: 'Test Book',
  authorName: 'Test Author',
  description: 'A test book',
  coverImageUrl: '',
  status: 'draft' as const,
  order: 1,
  isFree: false,
  ebookFilename: '',
  ebookPdfUrl: '',
  ebookEpubUrl: '',
  viewCount: 0,
}

beforeAll(async () => {
  await setupTestEnvironment()
})

beforeEach(async () => {
  await clearFirestore()
})

afterAll(async () => {
  await teardownTestEnvironment()
})

describe('createBook', () => {
  it('returns a new document ID', async () => {
    const id = await createBook(baseBook)
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('sets chapterCount to 0 on creation', async () => {
    const id = await createBook(baseBook)
    const book = await getBook(id)
    expect(book?.chapterCount).toBe(0)
  })

  it('sets createdAt and updatedAt timestamps', async () => {
    const id = await createBook(baseBook)
    const book = await getBook(id)
    expect(book?.createdAt).toBeDefined()
    expect(book?.updatedAt).toBeDefined()
  })
})

describe('getBook', () => {
  it('returns null for non-existent book', async () => {
    const result = await getBook('nonexistent-id')
    expect(result).toBeNull()
  })

  it('returns book data with id for existing book', async () => {
    const id = await createBook(baseBook)
    const book = await getBook(id)
    expect(book?.id).toBe(id)
    expect(book?.title).toBe('Test Book')
  })
})

describe('getPublishedBooks', () => {
  it('returns only published books', async () => {
    await createBook({ ...baseBook, status: 'draft', order: 1 })
    await createBook({ ...baseBook, status: 'published', order: 2 })
    const books = await getPublishedBooks()
    expect(books.every((b) => b.status === 'published')).toBe(true)
    expect(books.length).toBe(1)
  })

  it('returns books ordered by order asc', async () => {
    await createBook({ ...baseBook, status: 'published', order: 3 })
    await createBook({ ...baseBook, status: 'published', order: 1 })
    await createBook({ ...baseBook, status: 'published', order: 2 })
    const books = await getPublishedBooks()
    expect(books.map((b) => b.order)).toEqual([1, 2, 3])
  })
})

describe('getAllBooks', () => {
  it('returns all books regardless of status', async () => {
    await createBook({ ...baseBook, status: 'draft', order: 1 })
    await createBook({ ...baseBook, status: 'published', order: 2 })
    const books = await getAllBooks()
    expect(books.length).toBe(2)
  })

  it('returns books ordered by order asc', async () => {
    await createBook({ ...baseBook, order: 2 })
    await createBook({ ...baseBook, order: 1 })
    const books = await getAllBooks()
    expect(books[0].order).toBe(1)
    expect(books[1].order).toBe(2)
  })
})

describe('updateBook', () => {
  it('updates the specified fields', async () => {
    const id = await createBook(baseBook)
    await updateBook(id, { title: 'Updated Title' })
    const book = await getBook(id)
    expect(book?.title).toBe('Updated Title')
  })

  it('updates updatedAt but preserves createdAt', async () => {
    const id = await createBook(baseBook)
    const before = await getBook(id)
    await updateBook(id, { title: 'Changed' })
    const after = await getBook(id)
    expect(after?.createdAt).toEqual(before?.createdAt)
    expect(after?.updatedAt).toBeDefined()
  })
})

describe('deleteBook', () => {
  it('removes the book document', async () => {
    const id = await createBook(baseBook)
    await deleteBook(id)
    const book = await getBook(id)
    expect(book).toBeNull()
  })
})
