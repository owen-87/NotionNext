/** @jest-environment node */
jest.mock('@/blog.config', () => ({
  isProd: true,
  ENABLE_CACHE: true,
  REDIS_URL: ''
}))
jest.mock('@/lib/cache/local_file_cache', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  delCache: jest.fn()
}))
jest.mock('@/lib/cache/redis_cache', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  delCache: jest.fn()
}))
jest.mock('@/lib/cache/file_lock', () => ({ withFileLock: (_key, fn) => fn() }))
import MemoryCache from '@/lib/cache/memory_cache'
import cache from 'memory-cache'
import {
  delCacheData,
  getOrSetValidatedDataWithCache,
  getOrSetDataWithCache
} from '@/lib/cache/cache_manager'

const validate = data => {
  if (!data?.body) throw new Error('missing body')
}

describe('validated data cache', () => {
  afterEach(() => cache.clear())
  it('evicts an incomplete cached result and refetches a complete one', async () => {
    await MemoryCache.setCache('partial-test', { title: 'Only metadata' })
    const fetchData = jest.fn(async () => ({ body: 'Complete article' }))
    expect(
      await getOrSetValidatedDataWithCache('partial-test', validate, fetchData)
    ).toEqual({ body: 'Complete article' })
    expect(fetchData).toHaveBeenCalledTimes(1)
  })

  it('does not cache failed fetches and retries successfully on the next request', async () => {
    const fetchData = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ body: 'Recovered' })
    await expect(
      getOrSetValidatedDataWithCache('failed-test', validate, fetchData)
    ).rejects.toThrow('missing body')
    expect(await MemoryCache.getCache('failed-test')).toBeNull()
    await expect(
      getOrSetValidatedDataWithCache('failed-test', validate, fetchData)
    ).resolves.toEqual({ body: 'Recovered' })
  })

  it('prevents a fetch started before invalidation from repopulating stale data', async () => {
    let resolveOld
    const oldRequest = getOrSetDataWithCache(
      'inflight-test',
      () =>
        new Promise(resolve => {
          resolveOld = resolve
        })
    )
    while (!resolveOld) await new Promise(resolve => setImmediate(resolve))
    await delCacheData('inflight-test', { strict: true })
    await getOrSetDataWithCache('inflight-test', async () => ({ body: 'New' }))
    resolveOld({ body: 'Old' })
    await oldRequest
    expect(await MemoryCache.getCache('inflight-test')).toEqual({ body: 'New' })
  })
})
