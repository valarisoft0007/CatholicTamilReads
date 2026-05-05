// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CopyEmailButton } from '@/components/layout/CopyEmailButton'

const EMAIL = 'catholictamilreads@gmail.com'

describe('CopyEmailButton', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.clearAllTimers()
  })

  describe('rendering', () => {
    it('renders a copy button', () => {
      render(<CopyEmailButton email={EMAIL} />)
      expect(screen.getByRole('button', { name: /copy email address/i })).toBeInTheDocument()
    })

    it('has correct initial aria-label', () => {
      render(<CopyEmailButton email={EMAIL} />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Copy email address')
    })
  })

  describe('tooltip on hover', () => {
    it('shows email address in tooltip on mouseenter', () => {
      render(<CopyEmailButton email={EMAIL} />)
      const wrapper = screen.getByRole('button').parentElement!
      fireEvent.mouseEnter(wrapper)
      expect(screen.getByRole('tooltip')).toHaveTextContent(EMAIL)
    })

    it('hides tooltip on mouseleave', () => {
      render(<CopyEmailButton email={EMAIL} />)
      const wrapper = screen.getByRole('button').parentElement!
      fireEvent.mouseEnter(wrapper)
      fireEvent.mouseLeave(wrapper)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })

  describe('copy behaviour', () => {
    it('copies the email to clipboard on click', async () => {
      render(<CopyEmailButton email={EMAIL} />)
      await act(async () => {
        fireEvent.click(screen.getByRole('button'))
      })
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(EMAIL)
    })

    it('shows "Copied!" in tooltip after clicking', async () => {
      render(<CopyEmailButton email={EMAIL} />)
      const wrapper = screen.getByRole('button').parentElement!
      await act(async () => {
        fireEvent.click(screen.getByRole('button'))
      })
      fireEvent.mouseEnter(wrapper)
      expect(screen.getByRole('tooltip')).toHaveTextContent('Copied!')
    })

    it('updates aria-label to "Email copied" after clicking', async () => {
      render(<CopyEmailButton email={EMAIL} />)
      await act(async () => {
        fireEvent.click(screen.getByRole('button'))
      })
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Email copied')
    })

    it('reverts aria-label and tooltip back to email after 2 seconds', async () => {
      vi.useFakeTimers()
      render(<CopyEmailButton email={EMAIL} />)

      await act(async () => {
        fireEvent.click(screen.getByRole('button'))
      })
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Email copied')

      await act(async () => {
        vi.advanceTimersByTime(2100)
      })
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Copy email address')
    })
  })
})
