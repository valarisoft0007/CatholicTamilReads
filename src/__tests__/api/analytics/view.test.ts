import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { increment: (n: number) => `INCREMENT(${n})`, serverTimestamp: () => 'SERVER_TIMESTAMP' },
}))

// Build the mock Firestore chain
const mockChapterUpdate = vi.fn().mockResolvedValue(undefined)
const mockChapterGet = vi.fn()
const mockChapterDoc = vi.fn().mockReturnValue({ get: mockChapterGet, update: mockChapterUpdate })
const mockChaptersCollection = vi.fn().mockReturnValue({ doc: mockChapterDoc })

const mockBookUpdate = vi.fn().mockResolvedValue(undefined)
const mockBookGet = vi.fn()
const mockBookDoc = vi.fn().mockReturnValue({
  get: mockBookGet,
  update: mockBookUpdate,
  collection: mockChaptersCollection,
})
const mockCollection = vi.fn().mockReturnValue({ doc: mockBookDoc })

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: { collection: mockCollection },
  adminAuth: {},
}))

function makeRequest(body: unknown, ip = '10.0.2.1') {
  return new NextRequest('http://localhost/api/analytics/view', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/analytics/view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 for valid book view', async () => {
    mockBookGet.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'published' }) })
    const { POST } = await import('@/app/api/analytics/view/route')
    const res = await POST(makeRequest({ type: 'book', bookId: 'book123' }, '10.3.0.1'))
    expect(res.status).toBe(200)
    expect(mockBookUpdate).toHaveBeenCalled()
  })

  it('returns 200 for valid chapter view', async () => {
    mockBookGet.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'published' }) })
    mockChapterGet.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'published' }) })
    const { POST } = await import('@/app/api/analytics/view/route')
    const res = await POST(
      makeRequest({ type: 'chapter', bookId: 'book123', chapterId: 'chap456' }, '10.3.0.2')
    )
    expect(res.status).toBe(200)
    expect(mockBookUpdate).toHaveBeenCalled()
    expect(mockChapterUpdate).toHaveBeenCalled()
  })

  it('returns 400 for type=chapter without chapterId', async () => {
    const { POST } = await import('@/app/api/analytics/view/route')
    const res = await POST(makeRequest({ type: 'chapter', bookId: 'book123' }, '10.3.0.3'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when book does not exist', async () => {
    mockBookGet.mockResolvedValueOnce({ exists: false, data: () => null })
    const { POST } = await import('@/app/api/analytics/view/route')
    const res = await POST(makeRequest({ type: 'book', bookId: 'nonexistent' }, '10.3.0.4'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when book is not published', async () => {
    mockBookGet.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'draft' }) })
    const { POST } = await import('@/app/api/analytics/view/route')
    const res = await POST(makeRequest({ type: 'book', bookId: 'book123' }, '10.3.0.5'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when chapter does not exist', async () => {
    mockBookGet.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'published' }) })
    mockChapterGet.mockResolvedValueOnce({ exists: false, data: () => null })
    const { POST } = await import('@/app/api/analytics/view/route')
    const res = await POST(
      makeRequest({ type: 'chapter', bookId: 'book123', chapterId: 'missing-chap' }, '10.3.0.6')
    )
    expect(res.status).toBe(404)
  })
})
