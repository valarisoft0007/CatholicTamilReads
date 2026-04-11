import { describe, it, expect } from 'vitest'
import { NewsCreateSchema, NewsUpdateSchema } from '@/lib/validation/news'

describe('NewsCreateSchema', () => {
  it('accepts valid news data', () => {
    expect(NewsCreateSchema.safeParse({ title: 'Hello', content: 'World' }).success).toBe(true)
  })

  it('accepts title of 1 character', () => {
    expect(NewsCreateSchema.safeParse({ title: 'A', content: 'Content' }).success).toBe(true)
  })

  it('accepts title of 300 characters', () => {
    expect(NewsCreateSchema.safeParse({ title: 'a'.repeat(300), content: 'Content' }).success).toBe(true)
  })

  it('rejects title over 300 characters', () => {
    expect(NewsCreateSchema.safeParse({ title: 'a'.repeat(301), content: 'Content' }).success).toBe(false)
  })

  it('rejects empty title', () => {
    expect(NewsCreateSchema.safeParse({ title: '', content: 'Content' }).success).toBe(false)
  })

  it('accepts content of exactly 5000 characters', () => {
    expect(NewsCreateSchema.safeParse({ title: 'Title', content: 'a'.repeat(5000) }).success).toBe(true)
  })

  it('rejects content over 5000 characters', () => {
    expect(NewsCreateSchema.safeParse({ title: 'Title', content: 'a'.repeat(5001) }).success).toBe(false)
  })

  it('rejects empty content', () => {
    expect(NewsCreateSchema.safeParse({ title: 'Title', content: '' }).success).toBe(false)
  })

  it('rejects missing both fields', () => {
    expect(NewsCreateSchema.safeParse({}).success).toBe(false)
  })
})

describe('NewsUpdateSchema', () => {
  it('accepts update with only title', () => {
    expect(NewsUpdateSchema.safeParse({ title: 'New Title' }).success).toBe(true)
  })

  it('accepts update with only content', () => {
    expect(NewsUpdateSchema.safeParse({ content: 'New content' }).success).toBe(true)
  })

  it('accepts update with both fields', () => {
    expect(NewsUpdateSchema.safeParse({ title: 'T', content: 'C' }).success).toBe(true)
  })

  it('rejects empty object (refinement requires at least one field)', () => {
    expect(NewsUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('still validates field rules when provided', () => {
    expect(NewsUpdateSchema.safeParse({ title: 'a'.repeat(301) }).success).toBe(false)
  })

  it('rejects empty string for title', () => {
    expect(NewsUpdateSchema.safeParse({ title: '' }).success).toBe(false)
  })
})
