// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ShareButton } from '@/components/reader/ShareButton'

const DEFAULT_URL = 'http://localhost:3000/books/book123'

// Helper: click the Share button and flush the async handler
async function clickShare() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /share this page/i }))
  })
}

describe('ShareButton', () => {
  beforeEach(() => {
    // Ensure a stable location.href
    Object.defineProperty(window, 'location', {
      value: { href: DEFAULT_URL },
      writable: true,
      configurable: true,
    })
    // Remove navigator.share so tests exercise the popover fallback by default
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers() // always restore real timers so fake timers don't leak between tests
    vi.clearAllTimers()
  })

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  describe('rendering', () => {
    it('renders a Share button', () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      expect(screen.getByRole('button', { name: /share this page/i })).toBeInTheDocument()
    })

    it('displays the label "Share"', () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      expect(screen.getByText('Share')).toBeInTheDocument()
    })

    it('popover is hidden on initial render', () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('aria-expanded is false initially', () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      expect(screen.getByRole('button', { name: /share this page/i }))
        .toHaveAttribute('aria-expanded', 'false')
    })
  })

  // ---------------------------------------------------------------------------
  // Popover — open / close (desktop fallback, no navigator.share)
  // ---------------------------------------------------------------------------
  describe('popover — open/close', () => {
    it('opens popover when Share button is clicked and navigator.share is unavailable', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('sets aria-expanded to true when popover is open', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      expect(screen.getByRole('button', { name: /share this page/i }))
        .toHaveAttribute('aria-expanded', 'true')
    })

    it('toggles popover closed when Share button is clicked again', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      expect(screen.getByRole('menu')).toBeInTheDocument()
      await clickShare()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('closes popover on outside mousedown', async () => {
      render(
        <div>
          <ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />
          <div data-testid="outside">outside</div>
        </div>
      )
      await clickShare()
      fireEvent.mouseDown(screen.getByTestId('outside'))
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    })

    it('does not close popover on click inside the popover', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      fireEvent.mouseDown(screen.getByRole('menu'))
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('closes popover on Escape key', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      fireEvent.keyDown(document, { key: 'Escape' })
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    })
  })

  // ---------------------------------------------------------------------------
  // Popover contents
  // ---------------------------------------------------------------------------
  describe('popover contents', () => {
    it('shows a WhatsApp menu item', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      expect(screen.getByRole('menuitem', { name: /whatsapp/i })).toBeInTheDocument()
    })

    it('shows a Copy Link menu item', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      expect(screen.getByRole('menuitem', { name: /copy link/i })).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // WhatsApp
  // ---------------------------------------------------------------------------
  describe('WhatsApp share', () => {
    it('opens a wa.me URL when WhatsApp is clicked', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      fireEvent.click(screen.getByRole('menuitem', { name: /whatsapp/i }))
      expect(window.open).toHaveBeenCalledOnce()
      const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/)
    })

    it('encodes the share text in the WhatsApp URL', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      fireEvent.click(screen.getByRole('menuitem', { name: /whatsapp/i }))
      const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(url).toContain(encodeURIComponent('Read My Book on Catholic Tamil Reads'))
    })

    it('includes the current page URL in the WhatsApp message', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      fireEvent.click(screen.getByRole('menuitem', { name: /whatsapp/i }))
      const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(url).toContain(encodeURIComponent(DEFAULT_URL))
    })

    it('opens WhatsApp link with noopener,noreferrer', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      fireEvent.click(screen.getByRole('menuitem', { name: /whatsapp/i }))
      const [, target, features] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(target).toBe('_blank')
      expect(features).toBe('noopener,noreferrer')
    })

    it('closes the popover after clicking WhatsApp', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      fireEvent.click(screen.getByRole('menuitem', { name: /whatsapp/i }))
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    })
  })

  // ---------------------------------------------------------------------------
  // Copy Link
  // ---------------------------------------------------------------------------
  describe('Copy Link', () => {
    it('calls clipboard.writeText with the current URL', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      await act(async () => {
        fireEvent.click(screen.getByRole('menuitem', { name: /copy link/i }))
      })
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(DEFAULT_URL)
    })

    it('shows "Copied!" feedback after clicking Copy Link', async () => {
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await clickShare()
      await act(async () => {
        fireEvent.click(screen.getByRole('menuitem', { name: /copy link/i }))
      })
      // Popover is still open briefly — Copied! should be visible
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })

    it('reverts "Copied!" label back after 2 seconds', async () => {
      vi.useFakeTimers()
      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)

      // Open popover using act to flush the async handler
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share this page/i }))
      })
      expect(screen.getByRole('menu')).toBeInTheDocument()

      // Click Copy Link and flush the clipboard Promise
      await act(async () => {
        fireEvent.click(screen.getByRole('menuitem', { name: /copy link/i }))
      })
      expect(screen.getByText('Copied!')).toBeInTheDocument()

      // Advance past the 2s reset timer (popover will close at 600ms first,
      // but the setCopied(false) timer fires at 2000ms regardless)
      await act(async () => {
        vi.advanceTimersByTime(2100)
      })
      // After the timer fires setCopied(false), "Copied!" is gone
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // navigator.share (mobile / supported browsers)
  // ---------------------------------------------------------------------------
  describe('navigator.share (mobile)', () => {
    it('calls navigator.share when available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      })

      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share this page/i }))
      })

      expect(mockShare).toHaveBeenCalledOnce()
    })

    it('passes correct title, text, and url to navigator.share', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      })

      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share this page/i }))
      })

      expect(mockShare).toHaveBeenCalledWith({
        title: 'My Book',
        text: 'Read My Book on Catholic Tamil Reads',
        url: DEFAULT_URL,
      })
    })

    it('does not open the popover when navigator.share is available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      })

      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share this page/i }))
      })

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('silently ignores AbortError from navigator.share', async () => {
      const abortError = new DOMException('User cancelled', 'AbortError')
      const mockShare = vi.fn().mockRejectedValue(abortError)
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      })

      render(<ShareButton title="My Book" text="Read My Book on Catholic Tamil Reads" />)
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share this page/i }))
      })

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // align prop
  // ---------------------------------------------------------------------------
  describe('align prop', () => {
    it('applies left-0 class on popover by default', async () => {
      render(<ShareButton title="My Book" text="Read My Book" />)
      await clickShare()
      expect(screen.getByRole('menu').className).toContain('left-0')
      expect(screen.getByRole('menu').className).not.toContain('right-0')
    })

    it('applies right-0 class on popover when align="right"', async () => {
      render(<ShareButton title="My Book" text="Read My Book" align="right" />)
      await clickShare()
      expect(screen.getByRole('menu').className).toContain('right-0')
      expect(screen.getByRole('menu').className).not.toContain('left-0')
    })
  })
})
