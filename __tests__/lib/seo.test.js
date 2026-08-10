import {
  buildCanonicalUrl,
  buildRobotsTxt,
  getRobotsPolicy,
  isIndexableContentPage,
  normalizeCanonicalPath,
  normalizeSiteUrl
} from '@/lib/seo'
import { buildSitemapFields, createSitemapXml } from '@/lib/seo/sitemap'

describe('SEO URL policy', () => {
  it('normalizes the site origin and canonical path', () => {
    expect(normalizeSiteUrl('http://www.funshow.top/')).toBe(
      'https://www.funshow.top'
    )
    expect(
      buildCanonicalUrl(
        'https://www.funshow.top/',
        '/zh-CN/article/example.html?utm_source=test#section',
        '/',
        'zh-CN'
      )
    ).toBe('https://www.funshow.top/article/example')
    expect(normalizeCanonicalPath('/category/AI/?theme=dark')).toBe(
      '/category/AI'
    )
  })

  it('assigns route-specific robots policies', () => {
    expect(getRobotsPolicy({ route: '/search/[keyword]' })).toContain(
      'noindex, follow'
    )
    expect(getRobotsPolicy({ route: '/dashboard/[[...index]]' })).toContain(
      'noindex, nofollow'
    )
    expect(
      getRobotsPolicy({
        route: '/[prefix]/[slug]',
        post: { status: 'Published' }
      })
    ).toContain('index, follow')
    expect(
      getRobotsPolicy({
        route: '/[prefix]/[slug]',
        post: { status: 'Published', password: 'secret' }
      })
    ).toContain('noindex, nofollow')
  })

  it('recognizes only published public Post and Page records', () => {
    expect(
      isIndexableContentPage({
        status: 'Published',
        type: 'Post',
        slug: 'article/public'
      })
    ).toBe(true)
    expect(
      isIndexableContentPage({
        status: 'Published',
        type: 'Post',
        slug: 'article/private',
        password: 'hash'
      })
    ).toBe(false)
    expect(
      isIndexableContentPage({
        status: 'Draft',
        type: 'Post',
        slug: 'article/draft'
      })
    ).toBe(false)
  })
})

describe('sitemap policy', () => {
  const pages = [
    {
      status: 'Published',
      type: 'Post',
      slug: 'article/public',
      category: ['SEO'],
      lastEditedDay: '2026-07-20'
    },
    {
      status: 'Published',
      type: 'Page',
      slug: 'about',
      lastEditedDay: '2026-07-18'
    },
    {
      status: 'Published',
      type: 'Post',
      slug: 'article/private',
      password: 'hash',
      lastEditedDay: '2026-07-22'
    },
    {
      status: 'Draft',
      type: 'Post',
      slug: 'article/draft',
      lastEditedDay: '2026-07-23'
    },
    {
      status: 'Published',
      type: 'Menu',
      slug: 'menu-item',
      lastEditedDay: '2026-07-24'
    }
  ]

  it('contains canonical content and excludes low-value routes', () => {
    const fields = buildSitemapFields({
      allPages: pages,
      siteUrl: 'https://www.funshow.top/'
    })
    const locations = fields.map(field => field.loc)

    expect(locations).toContain('https://www.funshow.top')
    expect(locations).toContain('https://www.funshow.top/archive')
    expect(locations).toContain('https://www.funshow.top/category')
    expect(locations).toContain('https://www.funshow.top/category/SEO')
    expect(locations).toContain('https://www.funshow.top/article/public')
    expect(locations).toContain('https://www.funshow.top/about')
    expect(locations.some(location => location.includes('private'))).toBe(false)
    expect(locations.some(location => location.includes('draft'))).toBe(false)
    expect(locations.some(location => location.includes('/search'))).toBe(false)
    expect(locations.some(location => location.includes('/tag'))).toBe(false)
  })

  it('serializes one valid XML urlset and one robots sitemap declaration', () => {
    const fields = buildSitemapFields({
      allPages: pages,
      siteUrl: 'https://www.funshow.top'
    })
    const xml = createSitemapXml(fields)
    const robots = buildRobotsTxt('https://www.funshow.top/')

    expect(xml).toContain('<urlset')
    expect(xml).toContain('<lastmod>2026-07-20T00:00:00.000Z</lastmod>')
    expect((robots.match(/Sitemap:/g) || []).length).toBe(1)
    expect(robots).not.toContain('Disallow: /_next/')
  })
})
