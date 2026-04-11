import { describe, it, expect } from 'vitest'
import {
  BookCreateSchema,
  BookUpdateSchema,
  ChapterCreateSchema,
  ChapterUpdateSchema,
  ReorderSchema,
} from '@/lib/validation/book'

const validBook = {
  title: 'Test Book',
  authorName: 'Test Author',
  status: 'draft' as const,
  order: 0,
}

describe('BookCreateSchema', () => {
  it('accepts valid book data', () => {
    expect(BookCreateSchema.safeParse(validBook).success).toBe(true)
  })

  it('applies defaults for optional fields', () => {
    const result = BookCreateSchema.safeParse(validBook)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('')
      expect(result.data.coverImageUrl).toBe('')
      expect(result.data.isFree).toBe(false)
      expect(result.data.ebookFilename).toBe('')
      expect(result.data.ebookPdfUrl).toBe('')
      expect(result.data.ebookEpubUrl).toBe('')
    }
  })

  it('rejects empty title', () => {
    expect(BookCreateSchema.safeParse({ ...validBook, title: '' }).success).toBe(false)
  })

  it('rejects title over 200 chars', () => {
    expect(BookCreateSchema.safeParse({ ...validBook, title: 'a'.repeat(201) }).success).toBe(false)
  })

  it('rejects empty authorName', () => {
    expect(BookCreateSchema.safeParse({ ...validBook, authorName: '' }).success).toBe(false)
  })

  it('accepts status "published"', () => {
    expect(BookCreateSchema.safeParse({ ...validBook, status: 'published' }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(BookCreateSchema.safeParse({ ...validBook, status: 'active' }).success).toBe(false)
  })

  it('accepts order = 0', () => {
    expect(BookCreateSchema.safeParse({ ...validBook, order: 0 }).success).toBe(true)
  })

  it('rejects negative order', () => {
    expect(BookCreateSchema.safeParse({ ...validBook, order: -1 }).success).toBe(false)
  })

  it('rejects float order', () => {
    expect(BookCreateSchema.safeParse({ ...validBook, order: 1.5 }).success).toBe(false)
  })

  it('rejects description over 2000 chars', () => {
    expect(BookCreateSchema.safeParse({ ...validBook, description: 'a'.repeat(2001) }).success).toBe(false)
  })

  it('accepts description of exactly 2000 chars', () => {
    expect(BookCreateSchema.safeParse({ ...validBook, description: 'a'.repeat(2000) }).success).toBe(true)
  })
})

describe('BookUpdateSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(BookUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts partial update with only title', () => {
    expect(BookUpdateSchema.safeParse({ title: 'New Title' }).success).toBe(true)
  })

  it('still validates field rules when provided', () => {
    expect(BookUpdateSchema.safeParse({ title: '' }).success).toBe(false)
  })
})

const validChapter = {
  title: 'Chapter 1',
  content: 'Some content',
  order: 1,
  status: 'draft' as const,
}

describe('ChapterCreateSchema', () => {
  it('accepts valid chapter data', () => {
    expect(ChapterCreateSchema.safeParse(validChapter).success).toBe(true)
  })

  it('rejects order = 0 (min is 1)', () => {
    expect(ChapterCreateSchema.safeParse({ ...validChapter, order: 0 }).success).toBe(false)
  })

  it('accepts order = 1', () => {
    expect(ChapterCreateSchema.safeParse({ ...validChapter, order: 1 }).success).toBe(true)
  })

  it('accepts very large content (no length limit)', () => {
    expect(ChapterCreateSchema.safeParse({ ...validChapter, content: 'x'.repeat(100000) }).success).toBe(true)
  })

  it('rejects empty title', () => {
    expect(ChapterCreateSchema.safeParse({ ...validChapter, title: '' }).success).toBe(false)
  })

  it('rejects invalid status', () => {
    expect(ChapterCreateSchema.safeParse({ ...validChapter, status: 'archived' }).success).toBe(false)
  })

  it('defaults isFree to false', () => {
    const result = ChapterCreateSchema.safeParse(validChapter)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isFree).toBe(false)
    }
  })
})

describe('ChapterUpdateSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(ChapterUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('still validates order min when provided', () => {
    expect(ChapterUpdateSchema.safeParse({ order: 0 }).success).toBe(false)
  })
})

describe('ReorderSchema', () => {
  it('accepts a valid array of IDs', () => {
    expect(ReorderSchema.safeParse({ orderedIds: ['id1', 'id2'] }).success).toBe(true)
  })

  it('accepts a single-element array', () => {
    expect(ReorderSchema.safeParse({ orderedIds: ['id1'] }).success).toBe(true)
  })

  it('rejects empty array', () => {
    expect(ReorderSchema.safeParse({ orderedIds: [] }).success).toBe(false)
  })

  it('rejects array containing empty strings', () => {
    expect(ReorderSchema.safeParse({ orderedIds: ['id1', ''] }).success).toBe(false)
  })

  it('rejects missing orderedIds', () => {
    expect(ReorderSchema.safeParse({}).success).toBe(false)
  })
})
