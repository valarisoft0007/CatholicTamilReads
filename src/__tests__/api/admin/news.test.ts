import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
  SignJWT: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
}))

vi.mock('@/lib/firebase/admin', () => {
  const mockAdd = vi.fn().mockResolvedValue({ id: 'new-news-id' })
  const mockUpdate = vi.fn().mockResolvedValue(undefined)
  const mockDelete = vi.fn().mockResolvedValue(undefined)
  const mockDoc = vi.fn().mockReturnValue({ update: mockUpdate, delete: mockDelete })
  const mockOrderBy = vi.fn().mockReturnThis()
  const mockGet = vi.fn().mockResolvedValue({
    docs: [
      { id: 'news1', data: () => ({ title: 'News 1', content: 'Content 1' }) },
    ],
  })
  const mockCollection = vi.fn().mockReturnValue({
    orderBy: mockOrderBy,
    get: mockGet,
    add: mockAdd,
    doc: mockDoc,
  })
  return {
    adminDb: { collection: mockCollection },
    adminAuth: {},
  }
})

import { jwtVerify } from 'jose'

function makeAuthRequest(method: string, path: string, body?: unknown, cookie = 'admin_session=valid') {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/admin/news', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_JWT_SECRET = 'test-secret'
  })

  it('returns 200 with news array for valid JWT', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {}, protectedHeader: { alg: 'HS256' } } as never)
    const { GET } = await import('@/app/api/admin/news/route')
    const req = makeAuthRequest('GET', '/api/admin/news')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('returns 401 when no cookie', async () => {
    const { GET } = await import('@/app/api/admin/news/route')
    const req = makeAuthRequest('GET', '/api/admin/news', undefined, '')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 when JWT verification fails', async () => {
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('bad token'))
    const { GET } = await import('@/app/api/admin/news/route')
    const req = makeAuthRequest('GET', '/api/admin/news')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/admin/news', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_JWT_SECRET = 'test-secret'
  })

  it('returns 200 with id for valid JWT and body', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {}, protectedHeader: { alg: 'HS256' } } as never)
    const { POST } = await import('@/app/api/admin/news/route')
    const req = makeAuthRequest('POST', '/api/admin/news', { title: 'Test', content: 'Hello' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('id')
  })

  it('returns 400 for invalid body', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {}, protectedHeader: { alg: 'HS256' } } as never)
    const { POST } = await import('@/app/api/admin/news/route')
    const req = makeAuthRequest('POST', '/api/admin/news', { title: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when no cookie', async () => {
    const { POST } = await import('@/app/api/admin/news/route')
    const req = makeAuthRequest('POST', '/api/admin/news', { title: 'T', content: 'C' }, '')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/admin/news/[newsId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_JWT_SECRET = 'test-secret'
  })

  it('returns 200 ok when updating title only', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {}, protectedHeader: { alg: 'HS256' } } as never)
    const { PATCH } = await import('@/app/api/admin/news/[newsId]/route')
    const req = makeAuthRequest('PATCH', '/api/admin/news/news1', { title: 'Updated Title' })
    const res = await PATCH(req, { params: Promise.resolve({ newsId: 'news1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 200 ok when updating content only', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {}, protectedHeader: { alg: 'HS256' } } as never)
    const { PATCH } = await import('@/app/api/admin/news/[newsId]/route')
    const req = makeAuthRequest('PATCH', '/api/admin/news/news1', { content: 'Updated content' })
    const res = await PATCH(req, { params: Promise.resolve({ newsId: 'news1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 200 ok when updating both title and content', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {}, protectedHeader: { alg: 'HS256' } } as never)
    const { PATCH } = await import('@/app/api/admin/news/[newsId]/route')
    const req = makeAuthRequest('PATCH', '/api/admin/news/news1', { title: 'New Title', content: 'New content' })
    const res = await PATCH(req, { params: Promise.resolve({ newsId: 'news1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('calls Firestore update with trimmed fields', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {}, protectedHeader: { alg: 'HS256' } } as never)
    const { adminDb } = await import('@/lib/firebase/admin')
    const { PATCH } = await import('@/app/api/admin/news/[newsId]/route')
    const req = makeAuthRequest('PATCH', '/api/admin/news/news1', { title: '  Trimmed  ', content: '  Content  ' })
    await PATCH(req, { params: Promise.resolve({ newsId: 'news1' }) })
    const mockUpdate = (adminDb.collection('news').doc as ReturnType<typeof vi.fn>).mock.results[0]?.value.update
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Trimmed', content: 'Content' })
    )
  })

  it('returns 400 for empty update body', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {}, protectedHeader: { alg: 'HS256' } } as never)
    const { PATCH } = await import('@/app/api/admin/news/[newsId]/route')
    const req = makeAuthRequest('PATCH', '/api/admin/news/news1', {})
    const res = await PATCH(req, { params: Promise.resolve({ newsId: 'news1' }) })
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty title string', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {}, protectedHeader: { alg: 'HS256' } } as never)
    const { PATCH } = await import('@/app/api/admin/news/[newsId]/route')
    const req = makeAuthRequest('PATCH', '/api/admin/news/news1', { title: '' })
    const res = await PATCH(req, { params: Promise.resolve({ newsId: 'news1' }) })
    expect(res.status).toBe(400)
  })

  it('returns 401 with no cookie', async () => {
    const { PATCH } = await import('@/app/api/admin/news/[newsId]/route')
    const req = makeAuthRequest('PATCH', '/api/admin/news/news1', { title: 'X' }, '')
    const res = await PATCH(req, { params: Promise.resolve({ newsId: 'news1' }) })
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/admin/news/[newsId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_JWT_SECRET = 'test-secret'
  })

  it('returns 200 ok for valid JWT', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({ payload: {}, protectedHeader: { alg: 'HS256' } } as never)
    const { DELETE } = await import('@/app/api/admin/news/[newsId]/route')
    const req = makeAuthRequest('DELETE', '/api/admin/news/news1')
    const res = await DELETE(req, { params: Promise.resolve({ newsId: 'news1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 401 with no cookie', async () => {
    const { DELETE } = await import('@/app/api/admin/news/[newsId]/route')
    const req = makeAuthRequest('DELETE', '/api/admin/news/news1', undefined, '')
    const res = await DELETE(req, { params: Promise.resolve({ newsId: 'news1' }) })
    expect(res.status).toBe(401)
  })
})
