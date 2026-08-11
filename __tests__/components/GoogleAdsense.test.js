import {
  AdsenseLoader,
  ensureGoogleAdsenseScript,
  removeAdsenseFromPage
} from '@/components/GoogleAdsense'
import React from 'react'
import { renderToString } from 'react-dom/server.node'

describe('GoogleAdsense single loader', () => {
  beforeEach(() => {
    removeAdsenseFromPage()
    document.head
      .querySelectorAll('script[src*="googlesyndication.com/pagead/js"]')
      .forEach(script => script.remove())
  })

  afterEach(() => {
    removeAdsenseFromPage()
    delete window.adsbygoogle
  })

  it('creates exactly one official script across repeated initialization', () => {
    const first = ensureGoogleAdsenseScript('ca-pub-123')
    const second = ensureGoogleAdsenseScript('ca-pub-123')

    expect(second).toBe(first)
    expect(
      document.querySelectorAll(
        'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
      )
    ).toHaveLength(1)
    expect(first).toHaveAttribute('id', 'google-adsense-script')
    expect(first).toHaveAttribute('data-adsense-managed', 'true')
  })

  it('deduplicates legacy scripts and removes ad DOM on excluded pages', () => {
    for (let index = 0; index < 2; index++) {
      const legacy = document.createElement('script')
      legacy.src =
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-123'
      document.head.appendChild(legacy)
    }

    const ad = document.createElement('ins')
    ad.className = 'adsbygoogle'
    document.body.appendChild(ad)

    ensureGoogleAdsenseScript('ca-pub-123')
    expect(
      document.querySelectorAll(
        'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
      )
    ).toHaveLength(1)

    removeAdsenseFromPage()
    expect(document.querySelector('ins.adsbygoogle')).toBeNull()
    expect(
      document.querySelector(
        'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
      )
    ).toBeNull()
  })

  it('renders outside a NextRouter provider during static generation', () => {
    expect(() =>
      renderToString(
        React.createElement(AdsenseLoader, {
          post: {
            type: 'Post',
            status: 'Published',
            href: '/article/static-guide',
            wordCount: 1200
          }
        })
      )
    ).not.toThrow()
  })
})
