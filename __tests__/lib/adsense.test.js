import {
  containsAdsenseInjection,
  getAdsenseConfig,
  getAdsenseEligibility,
  normalizeAdsensePath
} from '@/lib/adsense'
import { getGoogleConsentModeBootstrap } from '@/lib/consent'

const publishedPost = {
  type: 'Post',
  status: 'Published',
  slug: 'article/safe-guide',
  href: '/article/safe-guide',
  title: '安全的原创教程',
  summary: '包含第一手经验的完整教程',
  wordCount: 1200
}

describe('AdSense page policy', () => {
  it('normalizes locale, query and pseudo-static URL variants', () => {
    expect(
      normalizeAdsensePath(
        'https://www.funshow.top/zh-CN/article/safe-guide.html?theme=dark#top'
      )
    ).toBe('/article/safe-guide')
  })

  it('allows only the homepage and mature published posts', () => {
    expect(getAdsenseEligibility({ pathname: '/' }).eligible).toBe(true)
    expect(
      getAdsenseEligibility({
        pathname: '/article/safe-guide',
        post: publishedPost,
        minimumWordCount: 600
      })
    ).toMatchObject({ eligible: true, reason: 'published-post' })

    expect(getAdsenseEligibility({ pathname: '/search' })).toMatchObject({
      eligible: false,
      reason: 'not-a-post'
    })
    expect(
      getAdsenseEligibility({
        pathname: '/privacy-policy',
        post: { ...publishedPost, type: 'Page' }
      }).eligible
    ).toBe(false)
  })

  it('rejects password pages, thin content, explicit exclusions and risk terms', () => {
    expect(
      getAdsenseEligibility({
        pathname: '/article/private',
        post: { ...publishedPost, password: 'hash' }
      }).reason
    ).toBe('password-protected')
    expect(
      getAdsenseEligibility({
        pathname: '/article/thin',
        post: { ...publishedPost, wordCount: 200 },
        minimumWordCount: 600
      }).reason
    ).toBe('thin-content')
    expect(
      getAdsenseEligibility({
        pathname: '/zh-CN/article/1-1-14.html',
        post: publishedPost,
        excludedPaths: ['/article/1-1-14']
      }).reason
    ).toBe('excluded-path')
    expect(
      getAdsenseEligibility({
        pathname: '/article/network-guide',
        post: { ...publishedPost, title: 'Hysteria2 VPN 部署教程' },
        riskKeywords: ['hysteria', 'vpn']
      })
    ).toMatchObject({
      eligible: false,
      reason: 'policy-risk',
      matchedRiskKeyword: 'hysteria'
    })
  })
})

describe('AdSense and consent safeguards', () => {
  it('supports the legacy NEXT_PUBLIC_ADSENSE keys stored in Notion', () => {
    expect(
      getAdsenseConfig('ADSENSE_GOOGLE_ID', '', {
        NEXT_PUBLIC_ADSENSE_GOOGLE_ID: 'ca-pub-1908581571364364'
      })
    ).toBe('ca-pub-1908581571364364')
    expect(
      getAdsenseConfig('ADSENSE_GOOGLE_TEST', true, {
        ADSENSE_GOOGLE_TEST: 'false'
      })
    ).toBe(false)
  })

  it('detects AdSense injected through GLOBAL_JS', () => {
    expect(
      containsAdsenseInjection(
        "s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-123'"
      )
    ).toBe(true)
    expect(containsAdsenseInjection("console.log('custom plugin')")).toBe(false)
  })

  it('sets Consent Mode v2 defaults before the CMP responds', () => {
    const script = getGoogleConsentModeBootstrap()
    expect(script).toContain("ad_storage: 'denied'")
    expect(script).toContain("ad_user_data: 'denied'")
    expect(script).toContain("ad_personalization: 'denied'")
    expect(script).toContain("analytics_storage: 'denied'")
    expect(script).toContain('"GB"')
    expect(script).toContain('"CH"')
  })
})
