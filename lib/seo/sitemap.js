import {
  getCategoryNames,
  isIndexableContentPage,
  normalizeSiteUrl,
  normalizeSlug,
  toIsoDate
} from '.'

function joinUrl(siteUrl, pathname = '') {
  const base = `${normalizeSiteUrl(siteUrl)}/`
  const path = String(pathname).replace(/^\/+/, '')
  return path ? new URL(path, base).toString() : base.replace(/\/$/, '')
}

function latestIsoDate(pages = []) {
  const timestamps = pages
    .map(page =>
      toIsoDate(
        page?.lastEditedDate ||
          page?.lastEditedDay ||
          page?.publishDate ||
          page?.publishDay ||
          page?.date?.start_date
      )
    )
    .filter(Boolean)
    .map(value => new Date(value).getTime())

  if (timestamps.length === 0) return undefined
  return new Date(Math.max(...timestamps)).toISOString()
}

function createField(loc, lastmod, changefreq, priority) {
  return {
    loc,
    ...(lastmod ? { lastmod } : {}),
    changefreq,
    priority: String(priority)
  }
}

/**
 * Build a sitemap containing canonical, public and indexable URLs only.
 */
export function buildSitemapFields({ allPages = [], siteUrl, locale = '' }) {
  const rootUrl = locale
    ? joinUrl(siteUrl, encodeURIComponent(locale))
    : normalizeSiteUrl(siteUrl)
  const publicPages = allPages.filter(isIndexableContentPage)
  const publicPosts = publicPages.filter(page => page.type === 'Post')
  const latestContentDate = latestIsoDate(publicPages)

  const fields = [
    createField(rootUrl, latestContentDate, 'daily', 1),
    createField(`${rootUrl}/archive`, latestContentDate, 'weekly', 0.8),
    createField(`${rootUrl}/category`, latestContentDate, 'weekly', 0.7)
  ]

  for (const page of publicPages) {
    const slug = normalizeSlug(page.slug)
    const lastmod = latestIsoDate([page])
    fields.push(
      createField(
        joinUrl(rootUrl, slug),
        lastmod,
        page.type === 'Post' ? 'weekly' : 'monthly',
        page.type === 'Post' ? 0.9 : 0.7
      )
    )
  }

  const categoryPosts = new Map()
  for (const post of publicPosts) {
    for (const category of getCategoryNames(post.category)) {
      const pages = categoryPosts.get(category) || []
      pages.push(post)
      categoryPosts.set(category, pages)
    }
  }

  for (const [category, posts] of categoryPosts) {
    fields.push(
      createField(
        `${rootUrl}/category/${encodeURIComponent(category)}`,
        latestIsoDate(posts),
        'weekly',
        0.7
      )
    )
  }

  const uniqueFields = new Map()
  for (const field of fields) {
    const existing = uniqueFields.get(field.loc)
    if (
      !existing ||
      (field.lastmod &&
        (!existing.lastmod ||
          new Date(field.lastmod).getTime() >
            new Date(existing.lastmod).getTime()))
    ) {
      uniqueFields.set(field.loc, field)
    }
  }

  return Array.from(uniqueFields.values())
}

export function createSitemapXml(fields = []) {
  const urls = fields
    .map(
      field => `  <url>
    <loc>${escapeXml(field.loc)}</loc>${
      field.lastmod
        ? `\n    <lastmod>${escapeXml(field.lastmod)}</lastmod>`
        : ''
    }
    <changefreq>${field.changefreq}</changefreq>
    <priority>${field.priority}</priority>
  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
