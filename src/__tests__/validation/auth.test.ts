import { describe, it, expect } from 'vitest'
import { AdminLoginSchema } from '@/lib/validation/auth'

describe('AdminLoginSchema', () => {
  it('accepts a valid password', () => {
    expect(AdminLoginSchema.safeParse({ password: 'secret' }).success).toBe(true)
  })

  it('accepts a 1-character password', () => {
    expect(AdminLoginSchema.safeParse({ password: 'a' }).success).toBe(true)
  })

  it('accepts a 200-character password', () => {
    expect(AdminLoginSchema.safeParse({ password: 'a'.repeat(200) }).success).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(AdminLoginSchema.safeParse({ password: '' }).success).toBe(false)
  })

  it('rejects a 201-character password', () => {
    expect(AdminLoginSchema.safeParse({ password: 'a'.repeat(201) }).success).toBe(false)
  })

  it('rejects a number instead of string', () => {
    expect(AdminLoginSchema.safeParse({ password: 12345 }).success).toBe(false)
  })

  it('rejects null', () => {
    expect(AdminLoginSchema.safeParse({ password: null }).success).toBe(false)
  })

  it('rejects missing password field', () => {
    expect(AdminLoginSchema.safeParse({}).success).toBe(false)
  })
})
