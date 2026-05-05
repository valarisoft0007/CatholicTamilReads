// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tooltip } from '@/components/ui/Tooltip'

describe('Tooltip', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<Tooltip content="Hello"><button>Trigger</button></Tooltip>)
      expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument()
    })

    it('does not show tooltip on initial render', () => {
      render(<Tooltip content="Hello"><button>Trigger</button></Tooltip>)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })

  describe('show / hide on hover', () => {
    it('shows tooltip on mouseenter', () => {
      render(<Tooltip content="Hello"><button>Trigger</button></Tooltip>)
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }).parentElement!)
      expect(screen.getByRole('tooltip')).toBeInTheDocument()
    })

    it('hides tooltip on mouseleave', () => {
      render(<Tooltip content="Hello"><button>Trigger</button></Tooltip>)
      const wrapper = screen.getByRole('button', { name: 'Trigger' }).parentElement!
      fireEvent.mouseEnter(wrapper)
      fireEvent.mouseLeave(wrapper)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })

    it('shows the correct tooltip content', () => {
      render(<Tooltip content="Copy email"><button>Trigger</button></Tooltip>)
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }).parentElement!)
      expect(screen.getByRole('tooltip')).toHaveTextContent('Copy email')
    })
  })

  describe('empty content guard', () => {
    it('does not show tooltip when content is empty string', () => {
      render(<Tooltip content=""><button>Trigger</button></Tooltip>)
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }).parentElement!)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })

  describe('position prop', () => {
    it('applies top position classes by default', () => {
      render(<Tooltip content="Hello"><button>Trigger</button></Tooltip>)
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }).parentElement!)
      expect(screen.getByRole('tooltip').className).toContain('bottom-full')
    })

    it('applies bottom position classes when position="bottom"', () => {
      render(<Tooltip content="Hello" position="bottom"><button>Trigger</button></Tooltip>)
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }).parentElement!)
      expect(screen.getByRole('tooltip').className).toContain('top-full')
    })

    it('applies left position classes when position="left"', () => {
      render(<Tooltip content="Hello" position="left"><button>Trigger</button></Tooltip>)
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }).parentElement!)
      expect(screen.getByRole('tooltip').className).toContain('right-full')
    })

    it('applies right position classes when position="right"', () => {
      render(<Tooltip content="Hello" position="right"><button>Trigger</button></Tooltip>)
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }).parentElement!)
      expect(screen.getByRole('tooltip').className).toContain('left-full')
    })
  })

  describe('wrapperClassName prop', () => {
    it('uses wrapperClassName instead of default wrapper classes', () => {
      render(
        <Tooltip content="Hello" wrapperClassName="fixed top-0 left-0 w-full">
          <div>child</div>
        </Tooltip>
      )
      const wrapper = screen.getByText('child').parentElement!
      expect(wrapper.className).toContain('fixed')
      expect(wrapper.className).not.toContain('inline-flex')
    })
  })
})
