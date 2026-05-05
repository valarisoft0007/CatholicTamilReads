// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

vi.mock('@/components/ui/Tooltip', () => ({
  Tooltip: ({
    children,
    wrapperClassName,
  }: {
    children: React.ReactNode
    content: string
    position?: string
    wrapperClassName?: string
  }) => <span className={wrapperClassName}>{children}</span>,
}))

import { BackToTop } from '@/components/reader/BackToTop'

describe('BackToTop', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Visibility ──────────────────────────────────────────────────────────────
  describe('visibility', () => {
    it('is not rendered on initial mount (scrollY = 0)', () => {
      render(<BackToTop />)
      expect(screen.queryByRole('button', { name: /back to top/i })).not.toBeInTheDocument()
    })

    it('appears when scrollY exceeds 300px', () => {
      render(<BackToTop />)
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
        fireEvent.scroll(window)
      })
      expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument()
    })

    it('does not appear when scrollY is exactly 300px', () => {
      render(<BackToTop />)
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 300, writable: true, configurable: true })
        fireEvent.scroll(window)
      })
      expect(screen.queryByRole('button', { name: /back to top/i })).not.toBeInTheDocument()
    })

    it('disappears when scrolling back above 300px', () => {
      render(<BackToTop />)
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
        fireEvent.scroll(window)
      })
      expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument()

      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true })
        fireEvent.scroll(window)
      })
      expect(screen.queryByRole('button', { name: /back to top/i })).not.toBeInTheDocument()
    })
  })

  // ── Behaviour ───────────────────────────────────────────────────────────────
  describe('click behaviour', () => {
    it('calls window.scrollTo with top=0 and smooth behaviour on click', () => {
      render(<BackToTop />)
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
        fireEvent.scroll(window)
      })
      fireEvent.click(screen.getByRole('button', { name: /back to top/i }))
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })
  })

  // ── Fixed positioning via Tooltip wrapperClassName ──────────────────────────
  describe('positioning', () => {
    it('Tooltip wrapper carries the fixed positioning classes', () => {
      render(<BackToTop />)
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
        fireEvent.scroll(window)
      })
      const button = screen.getByRole('button', { name: /back to top/i })
      const wrapper = button.parentElement!
      expect(wrapper.className).toContain('fixed')
      expect(wrapper.className).toContain('bottom-6')
      expect(wrapper.className).toContain('right-6')
    })

    it('button itself does not carry the fixed class', () => {
      render(<BackToTop />)
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true })
        fireEvent.scroll(window)
      })
      expect(screen.getByRole('button', { name: /back to top/i }).className).not.toContain('fixed')
    })
  })
})
