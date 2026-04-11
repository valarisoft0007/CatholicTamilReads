import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockBookGet = vi.fn()
const mockBookDoc = vi.fn().mockReturnValue({ get: mockBookGet })
const mockCollection = vi.fn().mockReturnValue({ doc: mockBookDoc })

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: { collection: mockCollection },
  adminAuth: {},
}))

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    utils: {
      private_download_url: vi.fn().mockReturnValue('https://signed.cloudinary.com/file.pdf'),
    },
  },
}))

// Mock global fetch used to proxy the file
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeRequest(bookId: string, format?: string, ip = '10.0.3.1') {
  const url = new URL(`http://localhost/api/books/${bookId}/download`)
  if (format) url.searchParams.set('format', format)
  return new NextRequest(url, {
    headers: { 'x-forwarded-for': ip },
  })
}

describe('GET /api/books/[bookId]/download', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for missing format parameter', async () => {
    const { GET } = await import('@/app/api/books/[bookId]/download/route')
    const res = await GET(makeRequest('book123', undefined, '10.4.0.1'), {
      params: Promise.resolve({ bookId: 'book123' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid format')
  })

  it('returns 400 for invalid format parameter', async () => {
    const { GET } = await import('@/app/api/books/[bookId]/download/route')
    const res = await GET(makeRequest('book123', 'docx', '10.4.0.2'), {
      params: Promise.resolve({ bookId: 'book123' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 404 when book does not exist', async () => {
    mockBookGet.mockResolvedValueOnce({ exists: false })
    const { GET } = await import('@/app/api/books/[bookId]/download/route')
    const res = await GET(makeRequest('missing', 'pdf', '10.4.0.3'), {
      params: Promise.resolve({ bookId: 'missing' }),
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Book not found')
  })

  it('returns 404 when PDF URL not set on book', async () => {
    mockBookGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ title: 'Test Book', ebookPdfUrl: '', ebookEpubUrl: '' }),
    })
    const { GET } = await import('@/app/api/books/[bookId]/download/route')
    const res = await GET(makeRequest('book123', 'pdf', '10.4.0.4'), {
      params: Promise.resolve({ bookId: 'book123' }),
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('eBook not available')
  })

  it('returns 200 with correct Content-Type for PDF', async () => {
    mockBookGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        title: 'Test Book',
        ebookPdfUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/ebooks/test-book.pdf',
        ebookEpubUrl: '',
      }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: new ReadableStream(),
    })
    const { GET } = await import('@/app/api/books/[bookId]/download/route')
    const res = await GET(makeRequest('book123', 'pdf', '10.4.0.5'), {
      params: Promise.resolve({ bookId: 'book123' }),
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('attachment')
  })

  it('returns 200 with correct Content-Type for EPUB', async () => {
    mockBookGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        title: 'Test Book',
        ebookPdfUrl: '',
        ebookEpubUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/ebooks/test-book.epub',
      }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: new ReadableStream(),
    })
    const { GET } = await import('@/app/api/books/[bookId]/download/route')
    const res = await GET(makeRequest('book123', 'epub', '10.4.0.6'), {
      params: Promise.resolve({ bookId: 'book123' }),
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/epub+zip')
  })

  it('returns 502 when Cloudinary fetch fails', async () => {
    mockBookGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        title: 'Test Book',
        ebookPdfUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/ebooks/test-book.pdf',
        ebookEpubUrl: '',
      }),
    })
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 })
    const { GET } = await import('@/app/api/books/[bookId]/download/route')
    const res = await GET(makeRequest('book123', 'pdf', '10.4.0.7'), {
      params: Promise.resolve({ bookId: 'book123' }),
    })
    expect(res.status).toBe(502)
  })
})
