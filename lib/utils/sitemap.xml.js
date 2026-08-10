import BLOG from '@/blog.config'
import { buildSitemapFields, createSitemapXml } from '@/lib/seo/sitemap'
import fs from 'fs'

/**
 * Generate the static-export sitemap from the same canonical URL policy used by
 * the dynamic sitemap endpoint.
 */
export function generateSitemapXml({ allPages = [] }) {
  const fields = buildSitemapFields({ allPages, siteUrl: BLOG.LINK })
  const xml = createSitemapXml(fields)

  try {
    fs.writeFileSync('sitemap.xml', xml)
    fs.writeFileSync('./public/sitemap.xml', xml)
  } catch (error) {
    console.warn('无法写入 sitemap.xml', error)
  }
}
