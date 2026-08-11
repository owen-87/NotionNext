import { getRecommendPost } from '@/lib/utils/recommendation'

const post = (id, overrides = {}) => ({
  id,
  type: 'Post',
  status: 'Published',
  slug: `article/${id}`,
  title: id,
  category: ['AI智能体'],
  tags: [],
  lastEditedDay: '2026-01-01',
  ...overrides
})

describe('related post recommendation', () => {
  it('ranks shared tags before category matches and uses recent posts as fallback', () => {
    const current = post('current', { tags: ['Ollama', 'Windows'] })
    const sameTag = post('same-tag', {
      tags: ['Ollama'],
      lastEditedDay: '2025-01-01'
    })
    const sameCategory = post('same-category', {
      lastEditedDay: '2026-06-01'
    })
    const unrelated = post('unrelated', {
      category: ['读书笔记'],
      lastEditedDay: '2026-07-01'
    })

    expect(
      getRecommendPost(current, [unrelated, sameCategory, sameTag, current])
    ).toEqual([sameTag, sameCategory, unrelated])
  })

  it('excludes drafts, password pages, duplicates and the current post', () => {
    const current = post('current')
    const candidate = post('candidate')
    const duplicate = { ...candidate }
    const draft = post('draft', { status: 'Draft' })
    const privatePost = post('private', { password: 'hash' })

    expect(
      getRecommendPost(
        current,
        [current, candidate, duplicate, draft, privatePost],
        6
      )
    ).toEqual([candidate])
  })

  it('honors the configured result count', () => {
    const current = post('current')
    expect(
      getRecommendPost(current, [post('one'), post('two'), post('three')], 2)
    ).toHaveLength(2)
  })
})
