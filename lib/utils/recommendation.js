const asList = value => {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}

const normalizeTerms = value =>
  new Set(asList(value).map(item => String(item).trim().toLocaleLowerCase()))

const intersectionCount = (left, right) => {
  let count = 0
  left.forEach(value => {
    if (right.has(value)) count++
  })
  return count
}

const postKey = post => post?.id || post?.href || post?.slug

const postTimestamp = post => {
  const value =
    post?.lastEditedDate ||
    post?.lastEditedDay ||
    post?.publishDate ||
    post?.publishDay
  const timestamp = value ? new Date(value).getTime() : 0
  return Number.isFinite(timestamp) ? timestamp : 0
}

const isPublishedPost = post =>
  Boolean(
    post &&
    String(post.type || '').includes('Post') &&
    (!post.status || post.status === 'Published') &&
    !post.password &&
    postKey(post)
  )

/**
 * 按共享标签、共享分类和更新时间选择相关文章。
 * 没有主题交集时以最新公开文章补足，避免相关推荐模块为空。
 */
export const getRecommendPost = (post, allPosts = [], count = 6) => {
  const limit = Math.max(0, Number(count) || 0)
  if (!post || limit === 0 || !Array.isArray(allPosts)) return []

  const currentKey = postKey(post)
  const currentTags = normalizeTerms(post.tags)
  const currentCategories = normalizeTerms(post.category)
  const seen = new Set()

  return allPosts
    .map((candidate, index) => {
      const key = postKey(candidate)
      if (!isPublishedPost(candidate) || key === currentKey || seen.has(key)) {
        return null
      }
      seen.add(key)

      const sharedTags = intersectionCount(
        currentTags,
        normalizeTerms(candidate.tags)
      )
      const sharedCategories = intersectionCount(
        currentCategories,
        normalizeTerms(candidate.category)
      )

      return {
        candidate,
        index,
        score: sharedTags * 4 + sharedCategories * 2,
        timestamp: postTimestamp(candidate)
      }
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.score - a.score || b.timestamp - a.timestamp || a.index - b.index
    )
    .slice(0, limit)
    .map(item => item.candidate)
}
