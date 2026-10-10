const compactId = id => String(id || '').replace(/-/g, '')
function blockValue(entry) {
  let value = entry
  for (let depth = 0; depth < 5 && value?.value && !value?.type; depth++)
    value = value.value
  return value
}

/** Reject unavailable/partial Notion responses before they become cached HTML. */
export function assertCompletePageBlocks(recordMap, pageId) {
  const blocks = new Map(
    Object.entries(recordMap?.block || {}).map(([id, entry]) => {
      return [compactId(id), blockValue(entry)]
    })
  )
  const root = blocks.get(compactId(pageId))
  if (!root?.type) throw new Error(`Notion page ${pageId} has no root block`)

  const queue = [root]
  const visited = new Set()
  while (queue.length) {
    const block = queue.pop()
    if (visited.has(block)) continue
    visited.add(block)
    // Child pages and collections are separate documents, not inline content.
    if (
      block !== root &&
      ['page', 'collection_view', 'collection_view_page'].includes(block.type)
    )
      continue
    for (const entry of block.children || []) {
      const child = blockValue(entry)
      if (!child?.type)
        throw new Error(`Notion page ${pageId} has an incomplete inline block`)
      if (child.id) blocks.set(compactId(child.id), child)
      queue.push(child)
    }
    for (const id of block.content || []) {
      const child = blocks.get(compactId(id))
      if (!child?.type)
        throw new Error(`Notion page ${pageId} is missing content block ${id}`)
      queue.push(child)
    }
  }
  return recordMap
}

export function assertSiteData(data) {
  if (
    !Array.isArray(data?.allPages) ||
    !data?.siteInfo ||
    data.allPages.some(page => page?.id === 1 && page?.slug === 'oops')
  ) {
    throw new Error(
      'Notion site data is unavailable; refusing to cache an empty fallback'
    )
  }
  return data
}
