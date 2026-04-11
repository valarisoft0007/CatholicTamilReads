import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { parseBody } from '@/lib/validation'

const TestSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
})

describe('parseBody', () => {
  it('returns success and parsed data for valid input', () => {
    const result = parseBody(TestSchema, { name: 'Alice', age: 30 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: 'Alice', age: 30 })
    }
  })

  it('returns failure with NextResponse for invalid input', () => {
    const result = parseBody(TestSchema, { name: '', age: 30 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.response).toBeDefined()
      expect(result.response.status).toBe(400)
    }
  })

  it('returns 400 response for completely wrong shape', () => {
    const result = parseBody(TestSchema, { wrong: 'field' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.response.status).toBe(400)
    }
  })

  it('returns 400 response for null input', () => {
    const result = parseBody(TestSchema, null)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.response.status).toBe(400)
    }
  })

  it('returns 400 response for undefined input', () => {
    const result = parseBody(TestSchema, undefined)
    expect(result.success).toBe(false)
  })

  it('response body contains error and details fields', async () => {
    const result = parseBody(TestSchema, { name: '', age: -1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const body = await result.response.json()
      expect(body).toHaveProperty('error', 'Invalid input')
      expect(body).toHaveProperty('details')
    }
  })

  it('applies schema defaults in successful parse', () => {
    const SchemaWithDefault = z.object({
      name: z.string(),
      active: z.boolean().default(true),
    })
    const result = parseBody(SchemaWithDefault, { name: 'Bob' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.active).toBe(true)
    }
  })
})
