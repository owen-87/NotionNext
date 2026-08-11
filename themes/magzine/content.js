const DEFAULT_CATEGORY_DESCRIPTIONS = {
  AI智能体:
    '从本地大模型、Dify、Ollama 到智能体与微信集成，本分类记录可复现的安装、配置、验证与排错过程，适合希望把 AI 工具真正部署到业务场景的读者。',
  投资理财:
    '围绕价值投资、财富认知与风险管理整理读书和实践笔记，重点呈现决策框架、适用边界与个人复盘；内容仅供学习交流，不构成投资建议。',
  读书笔记:
    '按书目整理核心观点、个人理解和可执行启发，覆盖科技、心理、商业与个人成长，帮助读者先建立全貌，再选择值得精读的章节。'
}

const asDescriptionMap = (value, fallback = {}) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : fallback

const cleanTitle = value =>
  String(value || '')
    .replace(/^\s*[\p{Extended_Pictographic}\uFE0F]+\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim()

export const getPostHref = post => {
  const href = post?.href || post?.slug
  if (!href || /^https?:\/\//i.test(href)) return null
  return `/${String(href)
    .replace(/^\/+/, '')
    .replace(/\.html$/i, '')}`
}

export const getReadingPathPosts = (posts = [], count = 3) => {
  const seen = new Set()
  return (Array.isArray(posts) ? posts : [])
    .filter(post => {
      const href = getPostHref(post)
      if (
        !href ||
        seen.has(href) ||
        (post?.type && post.type !== 'Post') ||
        (post?.status && post.status !== 'Published')
      ) {
        return false
      }
      seen.add(href)
      return true
    })
    .slice(0, Math.max(0, Number(count) || 0))
}

export const getCollectionDescription = ({
  category,
  tag,
  postCount = 0,
  siteTitle = '本站',
  posts = [],
  categoryDescriptions = DEFAULT_CATEGORY_DESCRIPTIONS,
  tagDescriptions = {}
} = {}) => {
  const term = category || tag
  const configuredDescriptions = asDescriptionMap(
    category ? categoryDescriptions : tagDescriptions,
    category ? DEFAULT_CATEGORY_DESCRIPTIONS : {}
  )
  const configured = configuredDescriptions?.[term]
  if (typeof configured === 'string' && configured.trim()) {
    return configured.trim()
  }

  const sampleTitles = getReadingPathPosts(posts, 3)
    .map(post => cleanTitle(post?.title))
    .filter(Boolean)
  const sample = sampleTitles.length
    ? `当前可从《${sampleTitles.join('》《')}》等内容开始阅读。`
    : ''

  if (category) {
    return `${siteTitle} 的「${category}」分类收录 ${postCount || 0} 篇文章，集中整理该主题的实践记录、方法说明与复盘。${sample}`
  }
  if (tag) {
    return `本页汇总 ${siteTitle} 中带有「${tag}」标签的 ${postCount || 0} 篇文章，便于按具体问题继续查找相关内容。${sample}`
  }
  return `浏览 ${siteTitle} 发布的 ${postCount || 0} 篇文章。`
}

export { DEFAULT_CATEGORY_DESCRIPTIONS }
