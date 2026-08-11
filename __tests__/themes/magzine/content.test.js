import { buildBreadcrumbItems } from '@/themes/magzine/components/Breadcrumbs'
import {
  getCollectionDescription,
  getPostHref,
  getReadingPathPosts
} from '@/themes/magzine/content'

const post = (id, title = id) => ({
  id,
  type: 'Post',
  status: 'Published',
  slug: `article/${id}.html`,
  title
})

describe('magzine collection content', () => {
  it('uses the curated category introduction', () => {
    expect(
      getCollectionDescription({
        category: 'AI智能体',
        postCount: 16,
        siteTitle: 'FunShow博客'
      })
    ).toContain('Dify')
  })

  it('builds a unique tag introduction from representative posts', () => {
    const description = getCollectionDescription({
      tag: 'Ollama',
      postCount: 2,
      siteTitle: 'FunShow博客',
      posts: [
        post('local-model', '🛠️ 本地模型部署'),
        post('agent', '智能体配置')
      ]
    })

    expect(description).toContain('Ollama')
    expect(description).toContain('本地模型部署')
    expect(description).toContain('2 篇')
  })

  it('deduplicates reading paths and emits canonical internal hrefs', () => {
    const first = post('one')
    expect(getPostHref(first)).toBe('/article/one')
    expect(getReadingPathPosts([first, { ...first }, post('two')])).toEqual([
      first,
      post('two')
    ])
  })

  it('includes collection roots in article and tag breadcrumbs', () => {
    expect(
      buildBreadcrumbItems({
        post: { title: '文章标题', category: ['AI智能体'] }
      }).map(item => item.name)
    ).toEqual(['首页', '分类', 'AI智能体', '文章标题'])

    expect(
      buildBreadcrumbItems({ tag: 'Ollama' }).map(item => item.name)
    ).toEqual(['首页', '标签', 'Ollama'])
  })
})
