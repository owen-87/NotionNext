import BLOG from '@/blog.config'
import {
  normalizeRevalidationPath,
  prepareRevalidation
} from '@/lib/cache/revalidation'

export const config = { maxDuration: 300 }

/**
 * On-Demand Revalidation API
 *
 * 解决 Issue #1020：Notion 内容更新后前端不实时同步
 *
 * 使用方式：
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATION_TOKEN>
 *   Body: { "path": "/article/my-post" }        — 刷新单个页面
 *   Body: { "paths": ["/", "/article/post-1"] }  — 批量刷新
 *   Body: { "all": true }                        — 全站刷新
 *
 * 环境变量：
 *   REVALIDATION_TOKEN — API 鉴权 Token（必须设置）
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      message: 'Method Not Allowed. Use POST.'
    })
  }

  // Token 鉴权
  const token = process.env.REVALIDATION_TOKEN || BLOG.REVALIDATION_TOKEN
  if (!token) {
    return res.status(503).json({
      ok: false,
      message: 'Revalidation is disabled: REVALIDATION_TOKEN not set'
    })
  }

  const authHeader = req.headers.authorization || ''
  const receivedToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.body?.token || ''

  if (receivedToken !== token) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' })
  }

  const { path, paths, all } = req.body || {}
  let targetPaths
  try {
    if (all !== undefined && typeof all !== 'boolean')
      throw new Error('all must be a boolean')
    if (
      paths !== undefined &&
      (!Array.isArray(paths) || paths.length === 0 || paths.length > 100)
    )
      throw new Error('paths must contain 1 to 100 paths')
    if (
      (all && (path !== undefined || paths !== undefined)) ||
      (path !== undefined && paths !== undefined)
    )
      throw new Error('Use one of all, path or paths')
    targetPaths = (paths || (path !== undefined ? [path] : ['/'])).map(
      normalizeRevalidationPath
    )
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message })
  }

  try {
    targetPaths = await prepareRevalidation({ all, paths: targetPaths })
    const results = []

    for (const p of targetPaths) {
      try {
        await res.revalidate(p)
        results.push({ path: p, revalidated: true })
      } catch (e) {
        results.push({ path: p, revalidated: false, error: e.message })
      }
    }

    const ok = results.every(result => result.revalidated)
    return res.status(ok ? 200 : 500).json({
      ok,
      message: `Revalidated ${results.filter(r => r.revalidated).length}/${results.length} paths`,
      failedPaths: results
        .filter(result => !result.revalidated)
        .map(result => result.path),
      results
    })
  } catch (error) {
    console.error('[revalidate] Error:', error)
    return res.status(500).json({
      ok: false,
      message: 'Revalidation failed',
      error: error.message
    })
  }
}
