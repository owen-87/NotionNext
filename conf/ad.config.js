/**
 * 广告播放插件
 */
const parseList = (value, fallback) => {
  if (!value) return fallback
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

module.exports = {
  // 谷歌广告
  ADSENSE_GOOGLE_ID: process.env.NEXT_PUBLIC_ADSENSE_GOOGLE_ID || '', // 谷歌广告ID e.g ca-pub-xxxxxxxxxxxxxxxx
  ADSENSE_GOOGLE_TEST: process.env.NEXT_PUBLIC_ADSENSE_GOOGLE_TEST || false, // 谷歌广告ID测试模式，这种模式获取假的测试广告，用于开发 https://www.tangly1024.com/article/local-dev-google-adsense
  ADSENSE_GOOGLE_SLOT_IN_ARTICLE:
    process.env.NEXT_PUBLIC_ADSENSE_GOOGLE_SLOT_IN_ARTICLE || '3806269138', // Google AdScene>广告>按单元广告>新建文章内嵌广告 粘贴html代码中的data-ad-slot值
  ADSENSE_GOOGLE_SLOT_FLOW:
    process.env.NEXT_PUBLIC_ADSENSE_GOOGLE_SLOT_FLOW || '1510444138', // Google AdScene>广告>按单元广告>新建信息流广告
  ADSENSE_GOOGLE_SLOT_NATIVE:
    process.env.NEXT_PUBLIC_ADSENSE_GOOGLE_SLOT_NATIVE || '4980048999', // Google AdScene>广告>按单元广告>新建原生广告
  ADSENSE_GOOGLE_SLOT_AUTO:
    process.env.NEXT_PUBLIC_ADSENSE_GOOGLE_SLOT_AUTO || '8807314373', // Google AdScene>广告>按单元广告>新建展示广告 （自动广告）

  // AdSense 审批期采用保守白名单：首页 + 达到字数门槛的已发布文章。
  ADSENSE_ALLOW_HOME: process.env.NEXT_PUBLIC_ADSENSE_ALLOW_HOME !== 'false',
  ADSENSE_MIN_WORD_COUNT: Number(
    process.env.NEXT_PUBLIC_ADSENSE_MIN_WORD_COUNT || 600
  ),
  // 明确排除政策风险页；可在 Vercel 中用英文逗号追加 URL。
  ADSENSE_EXCLUDED_PATHS: parseList(
    process.env.NEXT_PUBLIC_ADSENSE_EXCLUDED_PATHS,
    ['/article/1-1-14']
  ),
  // 仅扫描文章元数据，命中后不加载脚本或广告位；人工复核后可按需调整。
  ADSENSE_RISK_KEYWORDS: parseList(
    process.env.NEXT_PUBLIC_ADSENSE_RISK_KEYWORDS,
    [
      'hysteria',
      'vpn',
      '翻墙',
      '绕过',
      '破解',
      'crack',
      'bypass',
      '盗版',
      '未授权访问'
    ]
  ),

  // 万维广告
  AD_WWADS_ID: process.env.NEXT_PUBLIC_WWAD_ID || null, // https://wwads.cn/ 创建您的万维广告单元ID
  AD_WWADS_BLOCK_DETECT: process.env.NEXT_PUBLIC_WWADS_AD_BLOCK_DETECT || false // 是否开启WWADS广告屏蔽插件检测,开启后会在广告位上以文字提示 @see https://github.com/bytegravity/whitelist-wwads
}
