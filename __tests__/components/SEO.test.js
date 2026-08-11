import SEO, { generateStructuredData, getSEOMeta } from '@/components/SEO'
import { render } from '@testing-library/react'

const mockRouterState = {
  route: '/[prefix]/[slug]',
  asPath: '/zh-CN/article/seo-test.html?utm_source=google',
  isFallback: false,
  query: {}
}

jest.mock('next/head', () => ({
  __esModule: true,
  default: function MockHead({ children }) {
    return <>{children}</>
  }
}))

jest.mock('next/router', () => ({
  useRouter: () => mockRouterState
}))

jest.mock('@/lib/global', () => ({
  useGlobal: () => ({ locale: {} })
}))

jest.mock('@/blog.config', () => ({
  __esModule: true,
  default: {
    LANG: 'zh-CN',
    LINK: 'https://www.funshow.top',
    OG_IMAGE: '/bg_image.jpg',
    AUTHOR: 'FunShow',
    THEME: 'magzine',
    BLOG_FAVICON: '/favicon.ico'
  }
}))
jest.mock('@/lib/utils', () => ({
  loadExternalResource: jest.fn(() => Promise.resolve())
}))

jest.mock('@/lib/config', () => ({
  siteConfig: (key, fallback) => {
    const values = {
      LANG: 'zh-CN',
      LINK: 'https://www.funshow.top',
      OG_IMAGE: '/bg_image.jpg',
      AUTHOR: 'FunShow',
      THEME: 'magzine',
      AUTHOR_URL: '/about',
      AVATAR: '/avatar.png',
      FONT_URL: [],
      BLOG_FAVICON: '/favicon.ico',
      BACKGROUND_DARK: '#000000',
      TITLE: 'FunShow',
      DESCRIPTION: '分享技术实践与实用工具'
    }
    return values[key] ?? fallback
  }
}))

describe('SEO component', () => {
  const props = {
    siteInfo: {
      title: 'FunShow',
      description: '分享技术实践与实用工具',
      link: 'https://www.funshow.top',
      icon: '/avatar.png',
      pageCover: '/bg_image.jpg'
    },
    post: {
      status: 'Published',
      type: 'Post',
      slug: 'article/seo-test',
      title: 'SEO 测试文章',
      summary: '用于验证规范网址和结构化数据。',
      category: ['SEO'],
      tags: ['Google', '索引'],
      publishDay: '2026-07-20',
      lastEditedDay: '2026-07-21',
      pageCover: '/bg_image.jpg'
    },
    NOTION_CONFIG: {}
  }

  afterEach(() => {
    mockRouterState.route = '/[prefix]/[slug]'
    mockRouterState.asPath = '/zh-CN/article/seo-test.html?utm_source=google'
    mockRouterState.query = {}
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  it('renders canonical, indexable metadata and BlogPosting JSON-LD', () => {
    const { container } = render(<SEO {...props} />)
    const canonical = container.querySelector('link[rel="canonical"]')
    const robots = container.querySelector('meta[name="robots"]')
    const jsonLd = JSON.parse(
      container.querySelector('#site-structured-data').textContent
    )

    expect(canonical).toHaveAttribute(
      'href',
      'https://www.funshow.top/article/seo-test'
    )
    expect(robots).toHaveAttribute('content', expect.stringContaining('index'))
    expect(jsonLd['@graph'].some(item => item['@type'] === 'BlogPosting')).toBe(
      true
    )
    expect(
      jsonLd['@graph'].some(item => item['@type'] === 'BreadcrumbList')
    ).toBe(true)
  })

  it('marks search routes noindex', () => {
    mockRouterState.route = '/search/[keyword]'
    mockRouterState.asPath = '/search/google'
    mockRouterState.query = { keyword: 'google' }
    const { container } = render(<SEO {...props} post={undefined} />)

    expect(container.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      expect.stringContaining('noindex')
    )
  })

  it('uses the magzine category introduction as the meta description', () => {
    const meta = getSEOMeta(
      {
        siteInfo: props.siteInfo,
        category: 'AI智能体',
        postCount: 16,
        posts: []
      },
      { route: '/category/[category]', query: {} },
      {}
    )

    expect(meta.description).toContain('Dify')
    expect(meta.description).toContain('排错')
  })
})
describe('SEO structured data builder', () => {
  it('preserves article dates and publisher identity in the graph', () => {
    const data = generateStructuredData({
      meta: {
        type: 'article',
        title: 'Structured data in NotionNext',
        description: 'A test article',
        publishDate: '2026-07-01T00:00:00.000Z',
        modifiedDate: '2026-07-02T00:00:00.000Z',
        tags: ['notion', 'seo'],
        category: 'Engineering'
      },
      siteInfo: {
        title: 'Example Blog',
        description: 'Example description'
      },
      siteUrl: 'https://example.com',
      canonicalUrl: 'https://example.com/article/structured-data',
      imageUrl: 'https://example.com/cover.png',
      logoUrl: 'https://example.com/logo.png',
      author: 'Example Author',
      authorUrl: 'https://example.com/about',
      language: 'zh-CN'
    })

    const article = data['@graph'].find(item => item['@type'] === 'BlogPosting')
    const organization = data['@graph'].find(
      item => item['@type'] === 'Organization'
    )

    expect(article).toMatchObject({
      headline: 'Structured data in NotionNext',
      url: 'https://example.com/article/structured-data',
      datePublished: '2026-07-01T00:00:00.000Z',
      dateModified: '2026-07-02T00:00:00.000Z',
      articleSection: 'Engineering',
      keywords: ['notion', 'seo']
    })
    expect(organization.logo.url).toBe('https://example.com/logo.png')
    expect(
      data['@graph']
        .find(item => item['@type'] === 'BreadcrumbList')
        .itemListElement.map(item => item.name)
    ).toEqual(['首页', '分类', 'Engineering', 'Structured data in NotionNext'])
  })
})
