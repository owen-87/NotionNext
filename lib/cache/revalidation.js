import BLOG from '@/blog.config'
import { delCacheData, getDataFromCache } from './cache_manager'
import { getGlobalDataCacheKey } from './siteCacheKey'
import { getSiteDataByPageId } from '@/lib/db/SiteDataApi'
import { getPageBlockCacheKey } from '@/lib/db/notion/getPostBlocks'
import { buildSitemapFields } from '@/lib/seo/sitemap'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'

export function normalizeRevalidationPath(value) {
  if (typeof value !== 'string' || !value.trim())
    throw new Error('A non-empty path is required')
  const path = value.trim().startsWith('/') ? value.trim() : `/${value.trim()}`
  const decoded = decodeURIComponent(path)
  if (
    /[?#\\\u0000-\u001f]/.test(decoded) ||
    decoded.includes('//') ||
    decoded.split('/').some(segment => segment === '.' || segment === '..') ||
    /^\/(?:api|_next|auth|dashboard|sign-in|sign-up)(?:\/|$)/.test(decoded)
  )
    throw new Error('Only public site paths can be revalidated')
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

const comparablePath = path =>
  decodeURIComponent(path).replace(/\/+$/, '') || '/'

function dependencyPages(previous) {
  const dependencies = [...(previous?.cacheDependencies || [])]
  // Older deployments did not retain CONFIG pages in allPages. Recover their
  // IDs from the original row metadata so the first refresh also clears them.
  const typeKey = Object.entries(previous?.schema || {}).find(
    ([, field]) => field.name === BLOG.NOTION_PROPERTY_NAME?.type
  )?.[0]
  if (typeKey) {
    for (const [id, entry] of Object.entries(previous?.block || {})) {
      let block = entry?.value || entry
      if (!block?.type && block?.value) block = block.value
      const type = block?.properties?.[typeKey]?.[0]?.[0]?.toLowerCase()
      if (type === 'config' || type === 'notice') dependencies.push({ id })
    }
  }
  return [
    ...dependencies,
    ...(previous?.allPages || []).filter(
      page => page.type?.toLowerCase() === 'config'
    )
  ]
}

async function invalidateKeys(keys) {
  for (const key of new Set(keys)) await delCacheData(key, { strict: true })
}

/** Invalidate site-owned keys in every active store; never flush a shared Redis. */
export async function prepareRevalidation({ all = false, paths = ['/'] } = {}) {
  const sites = BLOG.NOTION_PAGE_ID.split(',').map(site => ({
    pageId: extractLangId(site),
    locale: extractLangPrefix(site)
  }))
  const locales = new Set([
    undefined,
    BLOG.LANG,
    ...sites.map(site => site.locale || undefined)
  ])
  const metadataKeys = []
  const configKeys = []
  const previousSites = new Map()
  for (const { pageId } of sites) {
    const previous = await getDataFromCache(`site_${pageId}`, true)
    previousSites.set(pageId, previous)
    metadataKeys.push(`site_${pageId}`, getPageBlockCacheKey(pageId))
    for (const locale of locales) {
      metadataKeys.push(getGlobalDataCacheKey({ pageId, locale }))
      metadataKeys.push(
        getGlobalDataCacheKey({ pageId: BLOG.NOTION_PAGE_ID, locale })
      )
    }
    // Configuration and notices are dependencies of every generated page.
    for (const page of dependencyPages(previous)) {
      configKeys.push(
        getPageBlockCacheKey(page.id),
        getPageBlockCacheKey(page.id, page.lastEditedDate)
      )
    }
    if (previous?.notice?.id)
      configKeys.push(
        getPageBlockCacheKey(previous.notice.id),
        getPageBlockCacheKey(previous.notice.id, previous.notice.lastEditedDate)
      )
  }
  await invalidateKeys([...metadataKeys, ...configKeys])

  const fields = []
  const contentKeys = []
  const requested = new Set(paths.map(comparablePath))
  for (const { pageId, locale } of sites) {
    const data = await getSiteDataByPageId({
      pageId,
      from: 'on-demand-revalidation'
    })
    fields.push(
      ...buildSitemapFields({
        allPages: data.allPages,
        siteUrl: BLOG.LINK,
        locale
      })
    )
    if (all && previousSites.get(pageId)?.allPages)
      fields.push(
        ...buildSitemapFields({
          allPages: previousSites.get(pageId).allPages,
          siteUrl: BLOG.LINK,
          locale
        })
      )
    for (const page of [
      ...data.allPages,
      ...(previousSites.get(pageId)?.allPages || [])
    ]) {
      const pathname = `${locale ? `/${locale}` : ''}/${page.slug}`
      if (all || requested.has(comparablePath(pathname))) {
        contentKeys.push(
          getPageBlockCacheKey(page.id),
          getPageBlockCacheKey(page.id, page.lastEditedDate)
        )
      }
    }
  }
  await invalidateKeys(contentKeys)
  return all
    ? [
        ...new Set(
          fields.map(field =>
            normalizeRevalidationPath(new URL(field.loc).pathname)
          )
        )
      ]
    : [...new Set(paths)]
}
