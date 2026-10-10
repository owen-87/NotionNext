/** @jest-environment node */
import {
  assertCompletePageBlocks,
  assertSiteData
} from '@/lib/db/validateContent'

describe('Notion content completeness', () => {
  it('validates synced inline children and their nested content', () => {
    const record = {
      block: {
        page: { value: { type: 'page', content: ['sync'] } },
        sync: {
          value: {
            type: 'sync_block',
            children: [
              { value: { id: 'inline', type: 'text', content: ['missing'] } }
            ]
          }
        }
      }
    }
    expect(() => assertCompletePageBlocks(record, 'page')).toThrow(
      'missing content block'
    )
    record.block.missing = { value: { type: 'text' } }
    expect(assertCompletePageBlocks(record, 'page')).toBe(record)
  })
  it('rejects absent roots and missing nested body blocks', () => {
    expect(() => assertCompletePageBlocks(null, 'page')).toThrow('root block')
    const partial = {
      block: {
        page: { value: { type: 'page', content: ['column'] } },
        column: { value: { type: 'column', content: ['missing'] } }
      }
    }
    expect(() => assertCompletePageBlocks(partial, 'page')).toThrow(
      'missing content block'
    )
  })

  it('accepts both Notion wrappers and genuine empty pages', () => {
    const complete = {
      block: {
        'aa-bb': { value: { value: { type: 'page', content: ['text'] } } },
        text: { value: { type: 'text' } }
      }
    }
    expect(assertCompletePageBlocks(complete, 'aabb')).toBe(complete)
    expect(() =>
      assertCompletePageBlocks(
        { block: { page: { value: { type: 'page', content: [] } } } },
        'page'
      )
    ).not.toThrow()
  })

  it('does not require the contents of separately linked child pages', () => {
    const record = {
      block: {
        page: { value: { type: 'page', content: ['child'] } },
        child: { value: { type: 'page', content: ['not-loaded'] } }
      }
    }
    expect(assertCompletePageBlocks(record, 'page')).toBe(record)
  })

  it('rejects error fallback data without rejecting a legitimate empty database', () => {
    expect(() => assertSiteData({})).toThrow('unavailable')
    expect(() =>
      assertSiteData({ siteInfo: {}, allPages: [{ id: 1, slug: 'oops' }] })
    ).toThrow('unavailable')
    expect(() => assertSiteData({ siteInfo: {}, allPages: [] })).not.toThrow()
  })
})
