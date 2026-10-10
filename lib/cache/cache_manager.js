import BLOG from '@/blog.config'
import FileCache from './local_file_cache'
import MemoryCache from './memory_cache'
import RedisCache from './redis_cache'
import { withFileLock } from './file_lock'

const cacheStats = {
  hit: 0,
  miss: 0,
  set: 0,
  error: 0,
  total: 0,
  perStore: {}
}

const isBuildPhase =
  process.env.npm_lifecycle_event === 'build' ||
  process.env.npm_lifecycle_event === 'export'

const enableLocalCache = isBuildPhase || !BLOG.isProd
const hasRedis = !!BLOG.REDIS_URL
const inflightMap = new Map()
const cacheGenerations = new Map()
const BUILD_LOCK_TIMEOUT_MS = 120000
const BUILD_LOCK_MAX_WAIT_MS = 600000

/** 与 dev.config 中 ENABLE_CACHE 的多种写法兼容（boolean / JSON 字符串 / 'true'|'false'） */
function cacheReadsEnabled(force) {
  if (force) return true
  const v = BLOG.ENABLE_CACHE
  if (v === true) return true
  if (v === false) return false
  if (typeof v === 'string') {
    const s = v.trim()
    if (s === '' || s === 'false' || s === '0') return false
    if (s === 'true' || s === '1') return true
    try {
      return Boolean(JSON.parse(s))
    } catch {
      return true
    }
  }
  return Boolean(v)
}

function cacheLog(action, key, extra = '') {
  const type = getCacheType()
  console.log(
    `[Cache][${type.toUpperCase()}][pid:${process.pid}] ${action} key:${key} ${extra}`
  )
}

function isUsableCacheValue(data) {
  if (data == null) return false
  if (Array.isArray(data)) return data.length > 0
  return true
}

export async function getOrSetDataWithCache(
  key,
  getDataFunction,
  ...getDataArgs
) {
  return getOrSetDataWithCustomCache(key, null, getDataFunction, ...getDataArgs)
}

export async function getOrSetValidatedDataWithCache(
  key,
  validate,
  getDataFunction,
  ...getDataArgs
) {
  return getOrSetCache(key, null, validate, getDataFunction, getDataArgs)
}

export async function getOrSetDataWithCustomCache(
  key,
  customCacheTime,
  getDataFunction,
  ...getDataArgs
) {
  return getOrSetCache(key, customCacheTime, null, getDataFunction, getDataArgs)
}

async function getOrSetCache(
  key,
  customCacheTime,
  validate,
  getDataFunction,
  getDataArgs
) {
  const dataFromCache = await getDataFromCache(key)
  if (dataFromCache) {
    try {
      if (validate) validate(dataFromCache)
      return dataFromCache
    } catch (error) {
      cacheLog('INVALID', key, error.message)
      await delCacheData(key, { strict: true })
    }
  }

  if (inflightMap.has(key)) {
    return inflightMap.get(key)
  }

  cacheLog('MISS', key, 'cache miss, fetch from source')
  const generation = cacheGenerations.get(key) || 0
  const canStore = () => generation === (cacheGenerations.get(key) || 0)

  if (isBuildPhase) {
    const promise = withFileLock(
      key,
      async () => {
        const doubleCheck = await getDataFromCache(key)
        if (doubleCheck) {
          if (validate) validate(doubleCheck)
          cacheLog('DOUBLE-CHECK-HIT', key, 'lock holder found cached value')
          return doubleCheck
        }

        const data = await getDataFunction(...getDataArgs)
        if (validate) validate(data)
        if (data && canStore()) {
          await setDataToCache(key, data, customCacheTime)
          cacheLog('SET', key, 'cache stored by lock holder')
        }

        return data || null
      },
      () => getDataFromCache(key),
      {
        timeout: BUILD_LOCK_TIMEOUT_MS,
        staleLockMs: BUILD_LOCK_TIMEOUT_MS,
        timeoutStrategy: 'wait',
        maxWaitMs: BUILD_LOCK_MAX_WAIT_MS
      }
    )
      .then(data => {
        // Waiting build workers can receive a value written by another process.
        if (validate) validate(data)
        return data
      })
      .catch(err => {
        cacheLog('ERROR', key, err.message)
        throw err
      })

    inflightMap.set(key, promise)
    const cleanup = () => {
      if (inflightMap.get(key) === promise) inflightMap.delete(key)
    }
    promise.then(cleanup, cleanup)
    return promise
  }

  const promise = getDataFunction(...getDataArgs)
    .then(async data => {
      if (validate) validate(data)
      if (data && canStore()) {
        await setDataToCache(key, data, customCacheTime)
        cacheLog('SET', key, 'cache stored')
      }

      return data || null
    })
    .catch(err => {
      cacheLog('ERROR', key, err.message)
      throw err
    })

  inflightMap.set(key, promise)
  const cleanup = () => {
    if (inflightMap.get(key) === promise) inflightMap.delete(key)
  }
  promise.then(cleanup, cleanup)
  return promise
}

export async function setDataToCache(key, data, customCacheTime) {
  if (!data) return

  const chain = getCacheChain()

  for (const { name, api } of chain) {
    try {
      await api.setCache(key, data, customCacheTime)

      cacheStats.set++
      cacheStats.perStore[name] = cacheStats.perStore[name] || {
        hit: 0,
        set: 0
      }
      cacheStats.perStore[name].set++

      return
    } catch (e) {
      console.warn(`[Cache] ${name} set failed key:${key}`, e.message)
      cacheStats.error++
    }
  }

  console.warn(`[Cache] ALL set failed key:${key}`)
}

export async function getDataFromCache(key, force) {
  if (!cacheReadsEnabled(force)) return null

  cacheStats.total++
  const chain = getCacheChain()

  for (const { name, api } of chain) {
    try {
      const data = await api.getCache(key)

      if (isUsableCacheValue(data)) {
        cacheStats.hit++
        cacheStats.perStore[name] = cacheStats.perStore[name] || {
          hit: 0,
          set: 0
        }
        cacheStats.perStore[name].hit++
        return data
      }
    } catch (e) {
      cacheStats.error++
      console.warn(`[Cache] ${name} get failed key:${key}`, e.message)
    }
  }

  cacheStats.miss++
  return null
}

export async function delCacheData(key, { strict = false } = {}) {
  cacheGenerations.set(key, (cacheGenerations.get(key) || 0) + 1)
  inflightMap.delete(key)
  const chain = getCacheChain()
  const errors = []

  for (const { name, api } of chain) {
    try {
      await api.delCache(key, { strict })
    } catch (e) {
      console.warn(`[Cache] ${name} del failed key:${key}`, e.message)
      errors.push(e)
    }
  }
  if (strict && errors.length)
    throw new Error(
      `Failed to invalidate data cache: ${errors.map(error => error.message).join('; ')}`
    )
}

function getCacheType() {
  if (hasRedis) return 'redis'
  if (isBuildPhase) return 'file'
  return 'memory'
}

export function getApi() {
  const type = getCacheType()

  switch (type) {
    case 'redis':
      return RedisCache
    case 'file':
      return FileCache
    default:
      return MemoryCache
  }
}

function getCacheChain() {
  const chain = []

  if (hasRedis) {
    chain.push({ name: 'redis', api: RedisCache })
  }

  if (enableLocalCache) {
    chain.push({ name: 'file', api: FileCache })
  }

  chain.push({ name: 'memory', api: MemoryCache })

  return chain
}

function printCacheSummary() {
  const hitRate = cacheStats.total
    ? ((cacheStats.hit / cacheStats.total) * 100).toFixed(1)
    : 0

  console.log('\n[Cache Summary]')
  console.log(
    'Strategy:',
    getCacheChain()
      .map(c => c.name)
      .join(' -> ')
  )
  console.log(
    `Stats: HIT ${hitRate}% | MISS ${cacheStats.miss} | ERROR ${cacheStats.error} | total ${cacheStats.total}`
  )
  console.log('[Per Store]')

  Object.entries(cacheStats.perStore).forEach(([name, stat]) => {
    console.log(`  ${name}: hit=${stat.hit || 0}, set=${stat.set || 0}`)
  })

  console.log('----------------------------------\n')
}

if (typeof process !== 'undefined') {
  process.on('exit', printCacheSummary)
}
