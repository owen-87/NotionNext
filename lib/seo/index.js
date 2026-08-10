const PRIVATE_ROUTE_PATTERN = /^\/(?:sign-in|sign-up|auth|dashboard)(?:\/|$)/
const NOINDEX_ROUTE_PATTERN = /^\/(?:search|tag|page)(?:\/|$)/
const ERROR_ROUTE_PATTERN = /^\/(?:404|500)(?:\/|$)/
const RESERVED_SLUGS = new Set([
  '404',
  '500',
  '_next',
  'api',
  'archive',
  'auth',
  'category',
  'dashboard',
  'feed',
  'page',
  'rss',
  'search',
  'sign-in',
  'sign-up',
  'sitemap.xml',
  'tag'
])

/**
 * Normalize the configured site URL so every SEO surface uses one HTTPS origin.
 */
export function normalizeSiteUrl(value) {
  const fallback = 'https://www.funshow.top'
  try {
    const url = new URL(value || fallback)
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
      url.protocol = 'https:'
    }
    url.hash = ''
    url.search = ''
    return url.toString().replace(/\/$/, '')
  } catch (error) {
    return fallback
  }
}

/**
 * Convert aliases and parameterized variants into the path used by canonical URLs.
 */
export function normalizeCanonicalPath(asPath = '/', defaultLocale = '') {
  let pathname =
    String(asPath || '/')
      .split('#')[0]
      .split('?')[0] || '/'
  if (!pathname.startsWith('/')) pathname = `/${pathname}`
  pathname = pathname.replace(/\/{2,}/g, '/')

  if (defaultLocale) {
    const escapedLocale = String(defaultLocale).replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    )
    pathname = pathname.replace(
      new RegExp(`^/${escapedLocale}(?=/|$)`, 'i'),
      ''
    )
  }

  pathname = pathname.replace(/\.html$/i, '') || '/'
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '')
  return pathname || '/'
}

export function buildCanonicalUrl(
  siteUrl,
  asPath,
  fallbackPath = '/',
  defaultLocale = ''
) {
  const baseUrl = normalizeSiteUrl(siteUrl)
  const pathname = normalizeCanonicalPath(asPath || fallbackPath, defaultLocale)
  return new URL(pathname, `${baseUrl}/`).toString()
}

export function toAbsoluteUrl(value, siteUrl, fallback = '/bg_image.jpg') {
  const baseUrl = normalizeSiteUrl(siteUrl)
  const candidate = value || fallback

  try {
    if (String(candidate).startsWith('//')) {
      return `https:${candidate}`
    }
    if (
      !String(candidate).startsWith('/') &&
      !/^https?:\/\//i.test(String(candidate))
    ) {
      return new URL(fallback, `${baseUrl}/`).toString()
    }
    const absolute = new URL(candidate, `${baseUrl}/`)
    if (absolute.protocol === 'http:' && absolute.hostname !== 'localhost') {
      absolute.protocol = 'https:'
    }
    return absolute.toString()
  } catch (error) {
    return new URL(fallback, `${baseUrl}/`).toString()
  }
}

export function cleanSeoText(value, maxLength = 160) {
  const text = String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const characters = Array.from(text)
  if (characters.length <= maxLength) return text
  return `${characters.slice(0, Math.max(0, maxLength - 1)).join('')}…`
}

export function toIsoDate(value) {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function isPrivateRoute(route = '') {
  const normalizedRoute = String(route).replace(/\[\[?\.\.\..*$/, '')
  return PRIVATE_ROUTE_PATTERN.test(normalizedRoute)
}

export function getRobotsPolicy({
  route = '',
  asPath = '',
  post,
  isFallback = false
} = {}) {
  const routePath = String(route || normalizeCanonicalPath(asPath))
  const visiblePath = normalizeCanonicalPath(asPath || routePath)

  if (
    PRIVATE_ROUTE_PATTERN.test(routePath) ||
    PRIVATE_ROUTE_PATTERN.test(visiblePath) ||
    ERROR_ROUTE_PATTERN.test(routePath) ||
    ERROR_ROUTE_PATTERN.test(visiblePath) ||
    post?.password ||
    (post?.status && post.status !== 'Published')
  ) {
    return 'noindex, nofollow, noarchive'
  }

  if (
    NOINDEX_ROUTE_PATTERN.test(routePath) ||
    NOINDEX_ROUTE_PATTERN.test(visiblePath) ||
    /\/page\/\[page\]$/.test(routePath) ||
    /\/page\/\d+$/.test(visiblePath)
  ) {
    return 'noindex, follow, max-image-preview:large'
  }

  if (isFallback || (routePath.includes('[prefix]') && !post)) {
    return 'noindex, nofollow'
  }

  return 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
}

export function normalizeSlug(value) {
  const slug = String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.html$/i, '')
  if (
    !slug ||
    /^https?:\/\//i.test(slug) ||
    /[?#\\]/.test(slug) ||
    slug.includes('//')
  ) {
    return null
  }
  if (RESERVED_SLUGS.has(slug.split('/')[0].toLowerCase())) return null
  return slug
}

export function isIndexableContentPage(page) {
  return Boolean(
    page &&
    page.status === 'Published' &&
    ['Post', 'Page'].includes(page.type) &&
    !page.password &&
    normalizeSlug(page.slug)
  )
}

export function getCategoryNames(category) {
  if (Array.isArray(category)) return category.filter(Boolean)
  return category ? [category] : []
}

export function buildRobotsTxt(siteUrl) {
  const canonicalSiteUrl = normalizeSiteUrl(siteUrl)
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${canonicalSiteUrl}/sitemap.xml
`
}
