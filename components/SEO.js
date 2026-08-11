import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import {
  buildCanonicalUrl,
  cleanSeoText,
  getCategoryNames,
  getRobotsPolicy,
  normalizeCanonicalPath,
  normalizeSiteUrl,
  toAbsoluteUrl,
  toIsoDate
} from '@/lib/seo'
import { loadExternalResource } from '@/lib/utils'
import MAGZINE_CONFIG from '@/themes/magzine/config'
import { getCollectionDescription } from '@/themes/magzine/content'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const SEO = props => {
  const { siteInfo = {}, post, NOTION_CONFIG } = props
  const router = useRouter()
  const global = useGlobal()
  const locale = global?.locale || {}
  const meta = getSEOMeta(props, router, locale)
  const language = siteConfig('LANG', BLOG.LANG, NOTION_CONFIG) || BLOG.LANG
  const siteUrl = normalizeSiteUrl(BLOG.LINK)

  const canonicalUrl = buildCanonicalUrl(
    siteUrl,
    router.asPath,
    meta.path,
    language
  )
  const defaultImage = siteConfig(
    'OG_IMAGE',
    BLOG.OG_IMAGE || '/bg_image.jpg',
    NOTION_CONFIG
  )
  const imageUrl = toAbsoluteUrl(meta.image || defaultImage, siteUrl)
  const title = cleanSeoText(
    meta.title || siteInfo?.title || siteConfig('TITLE'),
    70
  )
  const description = cleanSeoText(
    meta.description || siteInfo?.description || title,
    160
  )
  const author = siteConfig('AUTHOR', BLOG.AUTHOR, NOTION_CONFIG)
  const authorUrl = toAbsoluteUrl(
    siteConfig('AUTHOR_URL', '/about', NOTION_CONFIG),
    siteUrl,
    '/about'
  )
  const logoUrl = toAbsoluteUrl(
    siteInfo?.icon || siteConfig('AVATAR', '/avatar.png', NOTION_CONFIG),
    siteUrl,
    '/avatar.png'
  )
  const robots = getRobotsPolicy({
    route: router.route,
    asPath: router.asPath,
    post,
    isFallback: router.isFallback
  })
  const favicon = siteConfig('BLOG_FAVICON', BLOG.BLOG_FAVICON, NOTION_CONFIG)
  const configuredWebFontUrls = siteConfig('FONT_URL', [], NOTION_CONFIG)
  const webFontUrlsKey = (
    Array.isArray(configuredWebFontUrls)
      ? configuredWebFontUrls
      : [configuredWebFontUrls]
  )
    .filter(Boolean)
    .join('\\n')
  const googleVerification = siteConfig(
    'SEO_GOOGLE_SITE_VERIFICATION',
    null,
    NOTION_CONFIG
  )
  const baiduVerification = siteConfig(
    'SEO_BAIDU_SITE_VERIFICATION',
    null,
    NOTION_CONFIG
  )
  const twitterSite = siteConfig('TWITTER_SITE', '', NOTION_CONFIG)
  const twitterCreator = siteConfig('TWITTER_CREATOR', '', NOTION_CONFIG)
  const webMentionEnabled = siteConfig(
    'COMMENT_WEBMENTION_ENABLE',
    false,
    NOTION_CONFIG
  )
  const webMentionHostname = siteConfig(
    'COMMENT_WEBMENTION_HOSTNAME',
    '',
    NOTION_CONFIG
  )
  const webMentionAuth = siteConfig(
    'COMMENT_WEBMENTION_AUTH',
    '',
    NOTION_CONFIG
  )
  const analyticsBusuanziEnabled = siteConfig(
    'ANALYTICS_BUSUANZI_ENABLE',
    false,
    NOTION_CONFIG
  )
  const structuredData = generateStructuredData({
    meta,
    siteInfo,
    siteUrl,
    canonicalUrl,
    imageUrl,
    logoUrl,
    author,
    authorUrl,
    language,
    sameAs: [
      siteConfig('CONTACT_GITHUB'),
      siteConfig('CONTACT_TWITTER'),
      siteConfig('CONTACT_LINKEDIN'),
      siteConfig('CONTACT_YOUTUBE')
    ].filter(Boolean)
  })

  useEffect(() => {
    if (!webFontUrlsKey) return
    const webFontUrls = webFontUrlsKey.split('\\n').filter(Boolean)
    const timeoutId = window.setTimeout(() => {
      loadExternalResource(
        'https://cdnjs.cloudflare.com/ajax/libs/webfont/1.6.28/webfontloader.js',
        'js'
      ).then(() => {
        if (window.WebFont) {
          window.WebFont.load({ custom: { urls: webFontUrls } })
        }
      })
    }, 1500)

    return () => window.clearTimeout(timeoutId)
  }, [webFontUrlsKey])

  const openGraphLocale = String(language).replace('-', '_')
  const isArticle = meta.type === 'article'

  return (
    <Head>
      <title>{title}</title>
      <link rel='canonical' href={canonicalUrl} />
      <link rel='icon' href={favicon} />
      <meta charSet='UTF-8' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0'
      />
      <meta name='description' content={description} />
      <meta httpEquiv='content-language' content={language} />
      <meta name='author' content={author} />
      <meta name='robots' content={robots} />
      <meta name='googlebot' content={robots} />
      <meta name='format-detection' content='telephone=no' />
      <meta
        name='theme-color'
        content={siteConfig('BACKGROUND_DARK', '#000000')}
      />

      {googleVerification && (
        <meta name='google-site-verification' content={googleVerification} />
      )}
      {baiduVerification && (
        <meta name='baidu-site-verification' content={baiduVerification} />
      )}

      <meta property='og:locale' content={openGraphLocale} />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      <meta property='og:url' content={canonicalUrl} />
      <meta property='og:image' content={imageUrl} />
      <meta property='og:image:secure_url' content={imageUrl} />
      <meta property='og:image:alt' content={title} />
      <meta property='og:site_name' content={siteInfo?.title || title} />
      <meta property='og:type' content={isArticle ? 'article' : 'website'} />

      <meta name='twitter:card' content='summary_large_image' />
      {twitterSite && <meta name='twitter:site' content={twitterSite} />}
      {twitterCreator && (
        <meta name='twitter:creator' content={twitterCreator} />
      )}
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={imageUrl} />
      <meta name='twitter:image:alt' content={title} />

      {webMentionEnabled && webMentionHostname && (
        <>
          <link
            rel='webmention'
            href={`https://webmention.io/${webMentionHostname}/webmention`}
          />
          <link
            rel='pingback'
            href={`https://webmention.io/${webMentionHostname}/xmlrpc`}
          />
          {webMentionAuth && <link href={webMentionAuth} rel='me' />}
        </>
      )}
      {analyticsBusuanziEnabled && (
        <meta name='referrer' content='no-referrer-when-downgrade' />
      )}

      {isArticle && (
        <>
          {meta.publishDate && (
            <meta
              property='article:published_time'
              content={meta.publishDate}
            />
          )}
          {meta.modifiedDate && (
            <meta
              property='article:modified_time'
              content={meta.modifiedDate}
            />
          )}
          <meta property='article:author' content={authorUrl} />
          {meta.category && (
            <meta property='article:section' content={meta.category} />
          )}
          {meta.tags?.map(tag => (
            <meta key={tag} property='article:tag' content={tag} />
          ))}
        </>
      )}

      <script
        id='site-structured-data'
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c')
        }}
      />

      <link rel='dns-prefetch' href='//fonts.googleapis.com' />
      <link
        rel='preconnect'
        href='https://fonts.gstatic.com'
        crossOrigin='anonymous'
      />
    </Head>
  )
}

export function generateStructuredData({
  meta,
  siteInfo,
  siteUrl,
  canonicalUrl,
  imageUrl,
  logoUrl,
  author,
  authorUrl,
  language,
  sameAs = []
}) {
  const organizationId = `${siteUrl}/#organization`
  const personId = `${siteUrl}/#person`
  const websiteId = `${siteUrl}/#website`
  const webPageId = `${canonicalUrl}#webpage`
  const siteName = cleanSeoText(siteInfo?.title || author, 70)
  const description = cleanSeoText(
    meta.description || siteInfo?.description || siteName,
    160
  )
  const breadcrumbs = buildBreadcrumbs(meta, canonicalUrl, siteUrl)
  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: siteName,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl
      }
    },
    {
      '@type': 'Person',
      '@id': personId,
      name: author,
      url: authorUrl,
      image: logoUrl,
      ...(sameAs.length > 0 ? { sameAs } : {})
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: siteUrl,
      name: siteName,
      description: cleanSeoText(siteInfo?.description, 160),
      inLanguage: language,
      publisher: { '@id': organizationId },
      author: { '@id': personId }
    }
  ]

  const webPage = {
    '@type':
      normalizeCanonicalPath(new URL(canonicalUrl).pathname) === '/about'
        ? 'ProfilePage'
        : 'WebPage',
    '@id': webPageId,
    url: canonicalUrl,
    name: meta.title,
    description,
    inLanguage: language,
    isPartOf: { '@id': websiteId },
    ...(breadcrumbs.length > 1
      ? { breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` } }
      : {})
  }
  if (webPage['@type'] === 'ProfilePage') {
    webPage.mainEntity = { '@id': personId }
  }
  graph.push(webPage)

  if (breadcrumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    })
  }

  if (meta.type === 'article') {
    graph.push({
      '@type': 'BlogPosting',
      '@id': `${canonicalUrl}#article`,
      headline: meta.title,
      description,
      image: [imageUrl],
      url: canonicalUrl,
      mainEntityOfPage: { '@id': webPageId },
      isPartOf: { '@id': websiteId },
      author: { '@id': personId },
      publisher: { '@id': organizationId },
      ...(meta.publishDate ? { datePublished: meta.publishDate } : {}),
      ...(meta.modifiedDate ? { dateModified: meta.modifiedDate } : {}),
      ...(meta.category ? { articleSection: meta.category } : {}),
      ...(meta.tags?.length ? { keywords: meta.tags } : {}),
      inLanguage: language
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

function buildBreadcrumbs(meta, canonicalUrl, siteUrl) {
  const breadcrumbs = [{ name: '首页', url: `${siteUrl}/` }]
  const category = meta.category

  if (meta.type === 'article' && category) {
    breadcrumbs.push({ name: '分类', url: `${siteUrl}/category` })
    breadcrumbs.push({
      name: category,
      url: `${siteUrl}/category/${encodeURIComponent(category)}`
    })
  } else if (meta.routeType === 'category-detail') {
    breadcrumbs.push({ name: '分类', url: `${siteUrl}/category` })
  }

  if (canonicalUrl !== `${siteUrl}/`) {
    breadcrumbs.push({ name: meta.title, url: canonicalUrl })
  }
  return breadcrumbs
}

export function getSEOMeta(props, router, locale = {}) {
  const { post, siteInfo = {}, tag, category, page, postCount, posts } = props
  const siteTitle = cleanSeoText(siteInfo?.title || siteConfig('TITLE'), 50)
  const siteDescription = cleanSeoText(
    siteInfo?.description || siteConfig('DESCRIPTION'),
    160
  )
  const archiveLabel = locale?.NAV?.ARCHIVE || '归档'
  const searchLabel = locale?.NAV?.SEARCH || '搜索'
  const tagsLabel = locale?.COMMON?.TAGS || '标签'
  const categoryLabel = locale?.COMMON?.CATEGORY || '分类'
  const useMagzineCollectionDescription =
    siteConfig('THEME', BLOG.THEME) === 'magzine'
  const collectionDescription = useMagzineCollectionDescription
    ? cleanSeoText(
        getCollectionDescription({
          category,
          tag,
          postCount,
          siteTitle,
          posts,
          categoryDescriptions: siteConfig(
            'MAGZINE_CATEGORY_DESCRIPTIONS',
            MAGZINE_CONFIG.MAGZINE_CATEGORY_DESCRIPTIONS,
            MAGZINE_CONFIG
          ),
          tagDescriptions: siteConfig(
            'MAGZINE_TAG_DESCRIPTIONS',
            MAGZINE_CONFIG.MAGZINE_TAG_DESCRIPTIONS,
            MAGZINE_CONFIG
          )
        }),
        160
      )
    : null

  switch (router.route) {
    case '/':
      return {
        title: `${siteTitle} | ${siteDescription}`,
        description: siteDescription,
        image: siteInfo?.pageCover,
        path: '/',
        type: 'website',
        routeType: 'home'
      }
    case '/archive':
      return {
        title: `${archiveLabel} | ${siteTitle}`,
        description: `按时间浏览 ${siteTitle} 已发布的文章。${siteDescription}`,
        image: siteInfo?.pageCover,
        path: '/archive',
        type: 'website',
        routeType: 'archive'
      }
    case '/page/[page]':
      return {
        title: `第 ${page} 页 | ${siteTitle}`,
        description: `${siteTitle} 文章列表第 ${page} 页。`,
        image: siteInfo?.pageCover,
        path: `/page/${page}`,
        type: 'website',
        routeType: 'pagination'
      }
    case '/category/[category]':
    case '/category/[category]/page/[page]':
      return {
        title: `${category} | ${categoryLabel} | ${siteTitle}`,
        description:
          collectionDescription ||
          `浏览 ${siteTitle}「${category}」分类下的 ${postCount || 0} 篇文章。`,
        image: siteInfo?.pageCover,
        path: `/category/${encodeURIComponent(category || '')}`,
        type: 'website',
        routeType: 'category-detail',
        category
      }
    case '/tag/[tag]':
    case '/tag/[tag]/page/[page]':
      return {
        title: `${tag} | ${tagsLabel} | ${siteTitle}`,
        description:
          collectionDescription ||
          `浏览 ${siteTitle} 中带有「${tag}」标签的文章。`,
        image: siteInfo?.pageCover,
        path: `/tag/${encodeURIComponent(tag || '')}`,
        type: 'website',
        routeType: 'tag-detail'
      }
    case '/search':
    case '/search/[keyword]':
    case '/search/[keyword]/page/[page]': {
      const keyword = router?.query?.s || router?.query?.keyword || ''
      return {
        title: `${keyword ? `${keyword} | ` : ''}${searchLabel} | ${siteTitle}`,
        description: `在 ${siteTitle} 中搜索${keyword ? `“${keyword}”` : '文章'}。`,
        image: siteInfo?.pageCover,
        path: keyword ? `/search/${encodeURIComponent(keyword)}` : '/search',
        type: 'website',
        routeType: 'search'
      }
    }
    case '/tag':
      return {
        title: `${tagsLabel} | ${siteTitle}`,
        description: `浏览 ${siteTitle} 的文章标签。`,
        image: siteInfo?.pageCover,
        path: '/tag',
        type: 'website',
        routeType: 'tag-index'
      }
    case '/category':
      return {
        title: `${categoryLabel} | ${siteTitle}`,
        description: `按主题分类浏览 ${siteTitle} 的文章。`,
        image: siteInfo?.pageCover,
        path: '/category',
        type: 'website',
        routeType: 'category-index'
      }
    case '/404':
      return {
        title: `页面未找到 | ${siteTitle}`,
        description: '请求的页面不存在或已被移动。',
        path: '/404',
        type: 'website',
        routeType: 'error'
      }
    default: {
      const isArticle = post?.type === 'Post'
      const categoryName = getCategoryNames(post?.category)[0]
      const postTitle = cleanSeoText(post?.title, 60)
      return {
        title: postTitle ? `${postTitle} | ${siteTitle}` : siteTitle,
        description: cleanSeoText(
          post?.summary || `${postTitle}：${siteDescription}`,
          160
        ),
        type: isArticle ? 'article' : 'website',
        path: post?.slug ? `/${post.slug}` : router.asPath,
        image:
          post?.pageCover || post?.pageCoverThumbnail || siteInfo?.pageCover,
        category: categoryName,
        tags: Array.isArray(post?.tags) ? post.tags.filter(Boolean) : [],
        publishDate: toIsoDate(
          post?.publishDate || post?.date?.start_date || post?.publishDay
        ),
        modifiedDate: toIsoDate(
          post?.lastEditedTime ||
            post?.lastEditedDate ||
            post?.lastEditedDay ||
            post?.publishDate
        ),
        routeType: isArticle ? 'article' : 'page'
      }
    }
  }
}

export default SEO
