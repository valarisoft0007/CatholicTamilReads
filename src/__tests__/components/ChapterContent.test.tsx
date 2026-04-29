// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ChapterContent } from '@/components/reader/ChapterContent'

describe('ChapterContent', () => {
  describe('base rendering', () => {
    it('renders HTML content inside an article', () => {
      const { container } = render(<ChapterContent html="<p>Hello</p>" />)
      expect(container.querySelector('article')).toBeInTheDocument()
      expect(container.querySelector('p')).toHaveTextContent('Hello')
    })

    it('always applies chapter-content and prose classes', () => {
      const { container } = render(<ChapterContent html="<p>Hello</p>" />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('chapter-content')
      expect(article).toHaveClass('prose')
    })

    it('preserves <br> line breaks (used by songs content)', () => {
      const { container } = render(
        <ChapterContent html="<p>line1<br>line2</p>" bookType="songs" />
      )
      expect(container.querySelector('br')).toBeInTheDocument()
    })

    it('sanitizes script tags', () => {
      const { container } = render(
        <ChapterContent html='<p>Safe</p><script>alert("xss")</script>' />
      )
      expect(container.querySelector('script')).toBeNull()
      expect(container.querySelector('p')).toHaveTextContent('Safe')
    })
  })

  describe('book type — default / "book"', () => {
    it('does not apply songs-content class when bookType is undefined', () => {
      const { container } = render(<ChapterContent html="<p>Hello</p>" />)
      expect(container.querySelector('article')).not.toHaveClass('songs-content')
    })

    it('does not apply songs-content class for bookType="book"', () => {
      const { container } = render(<ChapterContent html="<p>Hello</p>" bookType="book" />)
      expect(container.querySelector('article')).not.toHaveClass('songs-content')
    })
  })

  describe('book type — "songs"', () => {
    it('applies songs-content class for bookType="songs"', () => {
      const { container } = render(<ChapterContent html="<p>Hello</p>" bookType="songs" />)
      expect(container.querySelector('article')).toHaveClass('songs-content')
    })

    it('still applies base chapter-content and prose classes for songs', () => {
      const { container } = render(<ChapterContent html="<p>Hello</p>" bookType="songs" />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('chapter-content')
      expect(article).toHaveClass('prose')
    })
  })
})
