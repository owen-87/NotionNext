import { convertVal, siteConfig } from './config'

export const ADSENSE_SCRIPT_PATH =
  'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'

const hasValue = value => value !== undefined && value !== null && value !== ''

const asStringList = value => {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }
  return []
}

/**
 * AdSense 配置兼容读取。
 *
 * 部分旧 Notion 配置使用 NEXT_PUBLIC_ADSENSE_* 作为键名，而代码配置使用
 * ADSENSE_*。这里先读 Notion 中的新旧键，再回退到 blog.config.js / 环境变量。
 */
export const getAdsenseConfig = (key, fallback = null, notionConfig = {}) => {
  const notionValue = notionConfig?.[key]
  if (hasValue(notionValue)) {
    return convertVal(notionValue)
  }

  const legacyKey = `NEXT_PUBLIC_${key}`
  const legacyValue = siteConfig(legacyKey, null, notionConfig)
  if (hasValue(legacyValue)) {
    return legacyValue
  }

  return siteConfig(key, fallback, notionConfig)
}

export const getAdsensePolicyOptions = (notionConfig = {}) => {
  const minimumWordCount = Number(
    getAdsenseConfig('ADSENSE_MIN_WORD_COUNT', 600, notionConfig)
  )

  return {
    allowHome:
      getAdsenseConfig('ADSENSE_ALLOW_HOME', true, notionConfig) !== false,
    excludedPaths: asStringList(
      getAdsenseConfig('ADSENSE_EXCLUDED_PATHS', [], notionConfig)
    ),
    minimumWordCount: Number.isFinite(minimumWordCount)
      ? minimumWordCount
      : 600,
    riskKeywords: asStringList(
      getAdsenseConfig('ADSENSE_RISK_KEYWORDS', [], notionConfig)
    )
  }
}

export const normalizeAdsensePath = value => {
  if (!value) {
    return '/'
  }

  let pathname = String(value).trim()
  try {
    if (/^https?:\/\//i.test(pathname)) {
      pathname = new URL(pathname).pathname
    }
  } catch (error) {
    // 保留原始相对路径，后续仍会移除 query/hash 并规范化。
  }

  pathname = pathname.split('#')[0].split('?')[0] || '/'
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`
  }

  pathname = pathname.replace(/^\/[a-z]{2}(?:-[a-z]{2})?(?=\/|$)/i, '') || '/'
  pathname = pathname.replace(/\.html$/i, '') || '/'
  pathname = pathname.replace(/\/{2,}/g, '/')
  if (pathname.length > 1) {
    pathname = pathname.replace(/\/+$/, '')
  }
  return pathname
}

export const containsAdsenseInjection = source =>
  typeof source === 'string' &&
  /(adsbygoogle|googlesyndication\.com\/pagead\/js|google_ad_client|ca-pub-\d+)/i.test(
    source
  )

/**
 * 保守的广告白名单：仅首页和满足质量门槛的已发布文章允许加载 AdSense。
 * Page（含隐私/条款）、搜索、404、认证、后台和密码页默认全部被排除。
 */
export const getAdsenseEligibility = ({
  pathname,
  post,
  lock = false,
  allowHome = true,
  excludedPaths = [],
  riskKeywords = [],
  minimumWordCount = 600
} = {}) => {
  const normalizedPath = normalizeAdsensePath(pathname)

  if (normalizedPath === '/') {
    return allowHome
      ? { eligible: true, reason: 'homepage', path: normalizedPath }
      : { eligible: false, reason: 'homepage-disabled', path: normalizedPath }
  }

  if (!post || post.type !== 'Post') {
    return { eligible: false, reason: 'not-a-post', path: normalizedPath }
  }

  if (post.status && post.status !== 'Published') {
    return { eligible: false, reason: 'not-published', path: normalizedPath }
  }

  if (lock || Boolean(post.password)) {
    return {
      eligible: false,
      reason: 'password-protected',
      path: normalizedPath
    }
  }

  const normalizedExcludedPaths =
    asStringList(excludedPaths).map(normalizeAdsensePath)
  if (normalizedExcludedPaths.includes(normalizedPath)) {
    return { eligible: false, reason: 'excluded-path', path: normalizedPath }
  }

  const wordCount = Number(post.wordCount)
  const requiredWordCount = Number(minimumWordCount)
  if (
    Number.isFinite(requiredWordCount) &&
    requiredWordCount > 0 &&
    (!Number.isFinite(wordCount) || wordCount < requiredWordCount)
  ) {
    return { eligible: false, reason: 'thin-content', path: normalizedPath }
  }

  const searchableText = [
    post.title,
    post.summary,
    post.slug,
    post.href,
    post.category,
    ...(Array.isArray(post.tags) ? post.tags : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()

  const matchedRiskKeyword = asStringList(riskKeywords).find(keyword =>
    searchableText.includes(keyword.toLocaleLowerCase())
  )
  if (matchedRiskKeyword) {
    return {
      eligible: false,
      reason: 'policy-risk',
      path: normalizedPath,
      matchedRiskKeyword
    }
  }

  return { eligible: true, reason: 'published-post', path: normalizedPath }
}
