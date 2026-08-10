import ArticleInfo from '@/themes/magzine/components/ArticleInfo'
import { render, screen } from '@testing-library/react'

jest.mock('@/lib/config', () => ({
  siteConfig: () => false
}))
jest.mock(
  '@/components/LazyImage',
  () =>
    function MockImage() {
      return null
    }
)
jest.mock(
  '@/components/NotionIcon',
  () =>
    function MockIcon() {
      return null
    }
)

describe('magzine article semantics', () => {
  it('uses one primary H1 for the article title', () => {
    render(
      <ArticleInfo
        post={{
          title: '文章主标题',
          summary: '文章摘要',
          type: 'Post',
          tags: []
        }}
      />
    )

    expect(
      screen.getByRole('heading', { level: 1, name: '文章主标题' })
    ).toBeInTheDocument()
  })
})
