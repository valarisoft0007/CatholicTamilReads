import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
}))

vi.mock('@/lib/firebase/admin', () => {
  const mockSet = vi.fn().mockResolvedValue(undefined)
  const mockDoc = vi.fn().mockReturnValue({ set: mockSet })
  return {
    adminDb: { doc: mockDoc },
    adminAuth: {
      verifyIdToken: vi.fn(),
    },
  }
})

import { adminAuth } from '@/lib/firebase/admin'

const validBody = {
  bookId: 'book123',
  lastChapterId: 'chap456',
  lastChapterOrder: 1,
  scrollPosition: 50,
}

function makeRequest(body: unknown, authHeader?: string, ip = '10.0.1.1') {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-forwarded-for': ip,
  }
  if (authHeader !== undefined) headers['Authorization'] = authHeader
  return new NextRequest('http://localhost/api/reading-progress', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/reading-progress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 for valid token and body', async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValueOnce({ uid: 'user-123' } as never)
    const { POST } = await import('@/app/api/reading-progress/route')
    const req = makeRequest(validBody, 'Bearer valid-firebase-token', '10.2.0.1')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 401 when Authorization header is missing', async () => {
    const { POST } = await import('@/app/api/reading-progress/route')
    const req = makeRequest(validBody, undefined, '10.2.0.2')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const { POST } = await import('@/app/api/reading-progress/route')
    const req = makeRequest(validBody, 'Token abc', '10.2.0.3')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 500 when Firebase token verification fails', async () => {
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValueOnce(new Error('invalid token'))
    const { POST } = await import('@/app/api/reading-progress/route')
    const req = makeRequest(validBody, 'Bearer bad-token', '10.2.0.4')
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 400 for invalid body', async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValueOnce({ uid: 'user-123' } as never)
    const { POST } = await import('@/app/api/reading-progress/route')
    const req = makeRequest({ bookId: '' }, 'Bearer valid-token', '10.2.0.5')
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
