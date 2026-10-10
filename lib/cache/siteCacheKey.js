export function getGlobalDataCacheKey({ pageId, locale }) {
  const safePageId = String(pageId).replace(/[^a-z0-9,_:-]/gi, '_')
  const safeLocale = String(locale || 'default').replace(/[^a-z0-9_-]/gi, '_')
  return `global_data_${safeLocale}_${safePageId}`
}
