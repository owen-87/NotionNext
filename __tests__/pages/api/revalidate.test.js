/** @jest-environment node */
jest.mock('@/blog.config', () => ({ REVALIDATION_TOKEN: 'test-token' }))
jest.mock('@/lib/cache/revalidation', () => ({
  prepareRevalidation: jest.fn(),
  normalizeRevalidationPath: path => {
    if (typeof path !== 'string' || !path.startsWith('/'))
      throw new Error('Invalid path')
    return path
  }
}))
import handler from '@/pages/api/revalidate'
import { prepareRevalidation } from '@/lib/cache/revalidation'

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    revalidate: jest.fn().mockResolvedValue(undefined)
  }
}
const request = body => ({
  method: 'POST',
  headers: { authorization: 'Bearer test-token' },
  body
})

describe('on-demand page regeneration', () => {
  it('refreshes every discovered URL for all:true, not just the homepage', async () => {
    prepareRevalidation.mockResolvedValue([
      '/',
      '/archive',
      '/category/AI',
      '/article/example'
    ])
    const res = response()
    await handler(request({ all: true }), res)
    expect(res.revalidate.mock.calls.map(([path]) => path)).toEqual([
      '/',
      '/archive',
      '/category/AI',
      '/article/example'
    ])
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, failedPaths: [] })
    )
  })

  it('reports partial failure and provides paths for a focused retry', async () => {
    prepareRevalidation.mockResolvedValue(['/', '/article/example'])
    const res = response()
    res.revalidate.mockImplementation(async path => {
      if (path.includes('article')) throw new Error('Body unavailable')
    })
    await handler(request({ paths: ['/', '/article/example'] }), res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, failedPaths: ['/article/example'] })
    )
  })

  it('rejects invalid input and unauthorized requests before invalidation', async () => {
    const invalid = response()
    await handler(request({ paths: 'not-an-array' }), invalid)
    expect(invalid.status).toHaveBeenCalledWith(400)
    const unauthorized = response()
    await handler({ ...request({ all: true }), headers: {} }, unauthorized)
    expect(unauthorized.status).toHaveBeenCalledWith(401)
    expect(prepareRevalidation).not.toHaveBeenCalled()
  })
})
