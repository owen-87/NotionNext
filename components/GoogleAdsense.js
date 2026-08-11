import {
  ADSENSE_SCRIPT_PATH,
  getAdsenseConfig,
  getAdsenseEligibility,
  getAdsensePolicyOptions
} from '@/lib/adsense'
import Router from 'next/router'
import { useEffect, useState } from 'react'

const ADSENSE_SCRIPT_ID = 'google-adsense-script'
let intersectionObserver = null

const getCurrentAdsensePath = post => {
  if (typeof window !== 'undefined') {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`
  }

  return post?.href || post?.slug || '/'
}

/**
 * 部分构建流程会在 NextRouter Provider 之外预渲染组件，因此不能直接使用
 * useRouter。这里用浏览器地址和 Router 事件同步路径，兼容 SSR/SSG 与客户端跳转。
 */
const useAdsensePath = post => {
  const [pathname, setPathname] = useState(() => getCurrentAdsensePath(post))

  useEffect(() => {
    const updatePath = url => {
      setPathname(url || getCurrentAdsensePath())
    }

    updatePath()
    Router.events.on('routeChangeComplete', updatePath)
    return () => Router.events.off('routeChangeComplete', updatePath)
  }, [])

  return pathname
}

const getAdsenseScripts = () =>
  Array.from(document.querySelectorAll(`script[src*="${ADSENSE_SCRIPT_PATH}"]`))

const pushAdRequest = ad => {
  if (
    !ad?.isConnected ||
    ad.getAttribute('data-adsbygoogle-status') === 'done' ||
    ad.getAttribute('data-adsense-requested') === 'true'
  ) {
    return
  }

  ad.setAttribute('data-adsense-requested', 'true')
  try {
    window.adsbygoogle = window.adsbygoogle || []
    window.adsbygoogle.push({})
  } catch (error) {
    ad.removeAttribute('data-adsense-requested')
    console.warn('AdSense slot request failed:', error)
  }
}

/**
 * 请求广告元素。所有广告位共用一个 IntersectionObserver，路由切换时会清理。
 */
export const requestAdsenseSlots = ads => {
  if (typeof window === 'undefined' || !ads?.length) {
    return
  }

  if (!('IntersectionObserver' in window)) {
    ads.forEach(pushAdRequest)
    return
  }

  if (!intersectionObserver) {
    intersectionObserver = new window.IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            pushAdRequest(entry.target)
            intersectionObserver?.unobserve(entry.target)
          }
        })
      },
      { root: null, threshold: 0.25 }
    )
  }

  ads.forEach(ad => {
    if (
      ad?.isConnected &&
      ad.getAttribute('data-adsbygoogle-status') !== 'done' &&
      ad.getAttribute('data-adsense-requested') !== 'true'
    ) {
      intersectionObserver.observe(ad)
    }
  })
}

/**
 * 创建全站唯一 AdSense 主脚本，并移除 GLOBAL_JS 或历史代码留下的重复脚本。
 */
export const ensureGoogleAdsenseScript = publisherId => {
  if (typeof document === 'undefined' || !publisherId) {
    return null
  }

  const scripts = getAdsenseScripts()
  let script =
    scripts.find(item => item.id === ADSENSE_SCRIPT_ID) || scripts[0] || null

  scripts.forEach(item => {
    if (item !== script) {
      item.remove()
    }
  })

  if (!script) {
    script = document.createElement('script')
    script.id = ADSENSE_SCRIPT_ID
    script.async = true
    script.crossOrigin = 'anonymous'
    script.src = `https://${ADSENSE_SCRIPT_PATH}?client=${encodeURIComponent(
      publisherId
    )}`
    script.setAttribute('data-ad-client', publisherId)
    script.setAttribute('data-adsense-managed', 'true')
    document.head.appendChild(script)
  } else {
    script.id = ADSENSE_SCRIPT_ID
    script.setAttribute('data-adsense-managed', 'true')
  }

  if (script.getAttribute('data-adsense-load-listener') !== 'true') {
    script.setAttribute('data-adsense-load-listener', 'true')
    script.addEventListener(
      'load',
      () => {
        requestAdsenseSlots(
          Array.from(document.querySelectorAll('ins.adsbygoogle'))
        )
      },
      { once: true }
    )
  }

  return script
}

export const initGoogleAdsense = publisherId => {
  const script = ensureGoogleAdsenseScript(publisherId)
  if (script) {
    requestAdsenseSlots(
      Array.from(document.querySelectorAll('ins.adsbygoogle'))
    )
  }
  return script
}

/**
 * 进入非白名单路由时移除广告 DOM，并断开观察器。
 * AdSense 后台仍需关闭 Auto Ads 或建立同样的 URL 排除规则。
 */
export const removeAdsenseFromPage = ({ removeScript = true } = {}) => {
  if (typeof document === 'undefined') {
    return
  }

  intersectionObserver?.disconnect()
  intersectionObserver = null

  document
    .querySelectorAll(
      'ins.adsbygoogle, .google-auto-placed, .adsbygoogle-noablate'
    )
    .forEach(element => element.remove())

  if (removeScript) {
    getAdsenseScripts().forEach(script => script.remove())
  }
}

/**
 * 全站唯一加载入口。仅白名单页面会创建主脚本。
 */
const AdsenseLoader = ({
  post,
  lock = false,
  NOTION_CONFIG = {},
  disabled = false
}) => {
  const pathname = useAdsensePath(post)
  const publisherId = getAdsenseConfig('ADSENSE_GOOGLE_ID', '', NOTION_CONFIG)
  const eligibility = getAdsenseEligibility({
    pathname,
    post,
    lock,
    ...getAdsensePolicyOptions(NOTION_CONFIG)
  })

  useEffect(() => {
    if (disabled || !publisherId || !eligibility.eligible) {
      removeAdsenseFromPage()
      return
    }

    const timer = window.setTimeout(() => {
      initGoogleAdsense(publisherId)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [disabled, eligibility.eligible, eligibility.path, publisherId])

  return null
}

const getSlotConfig = (type, notionConfig) => {
  switch (type) {
    case 'in-article':
      return getAdsenseConfig(
        'ADSENSE_GOOGLE_SLOT_IN_ARTICLE',
        '',
        notionConfig
      )
    case 'flow':
      return getAdsenseConfig('ADSENSE_GOOGLE_SLOT_FLOW', '', notionConfig)
    case 'native':
      return getAdsenseConfig('ADSENSE_GOOGLE_SLOT_NATIVE', '', notionConfig)
    default:
      return getAdsenseConfig('ADSENSE_GOOGLE_SLOT_AUTO', '', notionConfig)
  }
}

/**
 * 文章广告单元。组件本身也执行白名单检查，避免只隐藏脚本却遗留广告位。
 */
const AdSlot = ({ type = 'show', post, lock = false }) => {
  const publisherId = getAdsenseConfig('ADSENSE_GOOGLE_ID', '')
  const testMode = getAdsenseConfig('ADSENSE_GOOGLE_TEST', false)
  const slotId = getSlotConfig(type)
  const eligibility = getAdsenseEligibility({
    pathname: post?.href || post?.slug || '/',
    post,
    lock,
    ...getAdsensePolicyOptions()
  })
  const reservedAdStyle = {
    display: 'block',
    textAlign: 'center',
    minHeight: type === 'flow' || type === 'native' ? '180px' : '90px'
  }

  if (!publisherId || !slotId || !eligibility.eligible) {
    return null
  }

  if (type === 'in-article') {
    return (
      <ins
        className='adsbygoogle'
        style={reservedAdStyle}
        data-adsense-managed='true'
        data-ad-layout='in-article'
        data-ad-format='fluid'
        data-adtest={testMode ? 'on' : 'off'}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
      ></ins>
    )
  }

  if (type === 'flow') {
    return (
      <ins
        className='adsbygoogle'
        data-adsense-managed='true'
        data-ad-format='fluid'
        data-ad-layout-key='-5j+cz+30-f7+bf'
        style={reservedAdStyle}
        data-adtest={testMode ? 'on' : 'off'}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
      ></ins>
    )
  }

  if (type === 'native') {
    return (
      <ins
        className='adsbygoogle'
        style={reservedAdStyle}
        data-adsense-managed='true'
        data-ad-format='autorelaxed'
        data-adtest={testMode ? 'on' : 'off'}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
      ></ins>
    )
  }

  return (
    <ins
      className='adsbygoogle'
      style={reservedAdStyle}
      data-adsense-managed='true'
      data-ad-client={publisherId}
      data-adtest={testMode ? 'on' : 'off'}
      data-ad-slot={slotId}
      data-ad-format='auto'
      data-full-width-responsive='true'
    ></ins>
  )
}

/**
 * 将 Notion 正文中的 <ins/> 标记替换为广告位；非白名单页直接移除标记。
 */
const AdEmbed = ({ post, lock = false }) => {
  const publisherId = getAdsenseConfig('ADSENSE_GOOGLE_ID', '')
  const testMode = getAdsenseConfig('ADSENSE_GOOGLE_TEST', false)
  const slotId = getAdsenseConfig('ADSENSE_GOOGLE_SLOT_AUTO', '')
  const eligibility = getAdsenseEligibility({
    pathname: post?.href || post?.slug || '/',
    post,
    lock,
    ...getAdsensePolicyOptions()
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const markers = document.querySelectorAll(
        '#article-wrapper #notion-article div.notion-text'
      )

      markers.forEach(element => {
        if (element.textContent.trim() !== '<ins/>') {
          return
        }

        if (!eligibility.eligible || !publisherId || !slotId) {
          element.remove()
          return
        }

        const ad = document.createElement('ins')
        ad.className = 'adsbygoogle w-full py-1'
        ad.style.display = 'block'
        ad.style.minHeight = '90px'
        ad.setAttribute('data-adsense-managed', 'true')
        ad.setAttribute('data-ad-client', publisherId)
        ad.setAttribute('data-adtest', testMode ? 'on' : 'off')
        ad.setAttribute('data-ad-slot', slotId)
        ad.setAttribute('data-ad-format', 'auto')
        ad.setAttribute('data-full-width-responsive', 'true')
        element.parentNode?.replaceChild(ad, element)
        requestAdsenseSlots([ad])
      })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [
    eligibility.eligible,
    eligibility.path,
    post?.id,
    publisherId,
    slotId,
    testMode
  ])

  return null
}

export { AdEmbed, AdsenseLoader, AdSlot }
