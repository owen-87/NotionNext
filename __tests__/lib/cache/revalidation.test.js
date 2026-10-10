/** @jest-environment node */
jest.mock('@/blog.config', () => ({
  NOTION_PAGE_ID: 'root,en:english',
  LANG: 'zh-CN',
  LINK: 'https://example.com',
  NOTION_PROPERTY_NAME: { type: 'Type' }
}))
jest.mock('@/lib/cache/cache_manager', () => ({
  delCacheData: jest.fn(),
  getDataFromCache: jest.fn()
}))
jest.mock('@/lib/db/SiteDataApi', () => ({ getSiteDataByPageId: jest.fn() }))
jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  getPageBlockCacheKey: (id, version) =>
    `page_block_${id}${version ? `_${version}` : ''}`
}))

import { delCacheData, getDataFromCache } from '@/lib/cache/cache_manager'
import { getSiteDataByPageId } from '@/lib/db/SiteDataApi'
import {
  normalizeRevalidationPath,
  prepareRevalidation
} from '@/lib/cache/revalidation'

const post = {
  id: 'post',
  slug: 'article/one',
  type: 'Post',
  status: 'Published',
  category: ['投资'],
  lastEditedDate: 'v2'
}
beforeEach(() => {
  getDataFromCache.mockResolvedValue({
    allPages: [{ ...post, lastEditedDate: 'v1' }],
    schema: { typeField: { name: 'Type' } },
    block: {
      oldConfig: {
        value: { type: 'page', properties: { typeField: [['CONFIG']] } }
      }
    },
    cacheDependencies: [{ id: 'config', lastEditedDate: 'v3' }],
    notice: { id: 'notice', lastEditedDate: 'v4' }
  })
  getSiteDataByPageId.mockResolvedValue({ allPages: [post] })
  delCacheData.mockResolvedValue(undefined)
})

it('refreshes public routes in every locale and invalidates scoped dependencies and old/new article versions', async () => {
  const paths = await prepareRevalidation({ all: true })
  expect(paths).toEqual(
    expect.arrayContaining([
      '/',
      '/archive',
      '/category',
      '/article/one',
      '/category/%E6%8A%95%E8%B5%84',
      '/en',
      '/en/article/one'
    ])
  )
  const keys = delCacheData.mock.calls.map(([key]) => key)
  expect(keys).toEqual(
    expect.arrayContaining([
      'site_root',
      'site_english',
      'global_data_zh-CN_root,en:english',
      'global_data_en_root,en:english',
      'page_block_oldConfig',
      'page_block_config',
      'page_block_config_v3',
      'page_block_notice_v4',
      'page_block_post_v1',
      'page_block_post_v2'
    ])
  )
  expect(delCacheData.mock.calls.every(([, options]) => options.strict)).toBe(
    true
  )
})

it('clears only selected article content for a partial refresh', async () => {
  getSiteDataByPageId.mockResolvedValue({
    allPages: [post, { ...post, id: 'other', slug: 'article/two' }]
  })
  expect(await prepareRevalidation({ paths: ['/article/one'] })).toEqual([
    '/article/one'
  ])
  expect(delCacheData.mock.calls.map(([key]) => key)).not.toContain(
    'page_block_other'
  )
})

it('keeps removed public URLs in a full refresh so stale pages can become 404', async () => {
  getSiteDataByPageId.mockResolvedValue({ allPages: [] })
  expect(await prepareRevalidation({ all: true })).toContain('/article/one')
})

it('stops regeneration if strict cache invalidation fails', async () => {
  delCacheData.mockRejectedValue(new Error('Redis unavailable'))
  await expect(prepareRevalidation({ all: true })).rejects.toThrow(
    'Redis unavailable'
  )
  expect(getSiteDataByPageId).not.toHaveBeenCalled()
})

it.each(['/api/revalidate', '/a/../b', '/a%3Fb', '//other', '/a%5Cb'])(
  'rejects invalid refresh path %s',
  path => {
    expect(() => normalizeRevalidationPath(path)).toThrow()
  }
)
