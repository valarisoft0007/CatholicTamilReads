import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/logout/route'

describe('POST /api/admin/logout', () => {
  it('returns 200 with success', async () => {
    const req = new NextRequest('http://localhost/api/admin/logout', { method: 'POST' })
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('clears the admin_session cookie (maxAge=0)', async () => {
    const res = await POST()
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('admin_session')
    expect(cookie).toContain('Max-Age=0')
  })
})
