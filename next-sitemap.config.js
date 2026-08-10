const BLOG = require('./blog.config')

const excludedRoutes = [
  '/404',
  '/500',
  '/auth*',
  '/dashboard*',
  '/page/*',
  '/search*',
  '/sign-in*',
  '/sign-up*',
  '/tag*'
]

/**
 * Static-export fallback. The regular deployment uses pages/sitemap.xml.js,
 * while both paths share the same indexability policy.
 */
module.exports = {
  siteUrl: BLOG.LINK,
  changefreq: 'weekly',
  priority: 0.7,
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  sitemapSize: 7000,
  exclude: excludedRoutes,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/']
      }
    ]
  }
}
