import BLOG from '@/blog.config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { buildSitemapFields } from '@/lib/seo/sitemap'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'
import { getServerSideSitemap } from 'next-sitemap'

export const getServerSideProps = async ctx => {
  const fields = []
  const siteIds = BLOG.NOTION_PAGE_ID.split(',')

  for (const siteId of siteIds) {
    const pageId = extractLangId(siteId)
    const locale = extractLangPrefix(siteId)
    const siteData = await fetchGlobalAllData({
      pageId,
      from: 'sitemap.xml'
    })

    fields.push(
      ...buildSitemapFields({
        allPages: siteData?.allPages || [],
        siteUrl: BLOG.LINK,
        locale
      })
    )
  }

  const uniqueFields = Array.from(
    new Map(fields.map(field => [field.loc, field])).values()
  )

  ctx.res.setHeader(
    'Cache-Control',
    'public, max-age=3600, stale-while-revalidate=86400'
  )
  return getServerSideSitemap(ctx, uniqueFields)
}

export default function Sitemap() {
  return null
}
