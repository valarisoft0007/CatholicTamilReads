import { describe, it, expect } from 'vitest'
import { ReadingProgressSchema, AnalyticsViewSchema } from '@/lib/validation/reader'

const validProgress = {
  bookId: 'book123',
  lastChapterId: 'chap456',
  lastChapterOrder: 1,
  scrollPosition: 50,
}

describe('ReadingProgressSchema', () => {
  it('accepts valid reading progress', () => {
    expect(ReadingProgressSchema.safeParse(validProgress).success).toBe(true)
  })

  it('accepts scrollPosition = 0', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, scrollPosition: 0 }).success).toBe(true)
  })

  it('accepts scrollPosition = 100', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, scrollPosition: 100 }).success).toBe(true)
  })

  it('accepts decimal scrollPosition', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, scrollPosition: 50.5 }).success).toBe(true)
  })

  it('rejects scrollPosition below 0', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, scrollPosition: -0.1 }).success).toBe(false)
  })

  it('rejects scrollPosition above 100', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, scrollPosition: 100.1 }).success).toBe(false)
  })

  it('rejects lastChapterOrder = 0 (min is 1)', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, lastChapterOrder: 0 }).success).toBe(false)
  })

  it('accepts lastChapterOrder = 1', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, lastChapterOrder: 1 }).success).toBe(true)
  })

  it('rejects float lastChapterOrder', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, lastChapterOrder: 1.5 }).success).toBe(false)
  })

  it('accepts bookId of 128 characters', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, bookId: 'a'.repeat(128) }).success).toBe(true)
  })

  it('rejects bookId over 128 characters', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, bookId: 'a'.repeat(129) }).success).toBe(false)
  })

  it('rejects empty bookId', () => {
    expect(ReadingProgressSchema.safeParse({ ...validProgress, bookId: '' }).success).toBe(false)
  })
})

describe('AnalyticsViewSchema', () => {
  it('accepts type="book" without chapterId', () => {
    expect(AnalyticsViewSchema.safeParse({ type: 'book', bookId: 'book123' }).success).toBe(true)
  })

  it('accepts type="book" with chapterId', () => {
    expect(AnalyticsViewSchema.safeParse({ type: 'book', bookId: 'book123', chapterId: 'chap456' }).success).toBe(true)
  })

  it('accepts type="chapter" with chapterId', () => {
    expect(
      AnalyticsViewSchema.safeParse({ type: 'chapter', bookId: 'book123', chapterId: 'chap456' }).success
    ).toBe(true)
  })

  it('rejects type="chapter" without chapterId', () => {
    expect(AnalyticsViewSchema.safeParse({ type: 'chapter', bookId: 'book123' }).success).toBe(false)
  })

  it('rejects invalid type value', () => {
    expect(AnalyticsViewSchema.safeParse({ type: 'page', bookId: 'book123' }).success).toBe(false)
  })

  it('rejects missing bookId', () => {
    expect(AnalyticsViewSchema.safeParse({ type: 'book' }).success).toBe(false)
  })

  it('rejects empty bookId', () => {
    expect(AnalyticsViewSchema.safeParse({ type: 'book', bookId: '' }).success).toBe(false)
  })

  it('rejects chapterId over 128 chars', () => {
    expect(
      AnalyticsViewSchema.safeParse({ type: 'chapter', bookId: 'book123', chapterId: 'a'.repeat(129) }).success
    ).toBe(false)
  })
})
