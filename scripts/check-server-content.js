#!/usr/bin/env node
// Inspect HTTP HTML without executing page scripts, so JSON props alone cannot pass.
const { JSDOM, VirtualConsole } = require('jsdom')

const origin = process.argv[2] || 'http://localhost:3100'
const requestedPaths = process.argv.slice(3)
const normalize = value =>
  String(value || '')
    .replace(/\s+/g, '')
    .trim()

async function inspect(path) {
  const response = await fetch(new URL(path, origin), {
    signal: AbortSignal.timeout(90000)
  })
  const html = await response.text()
  const document = new JSDOM(html, { virtualConsole: new VirtualConsole() })
    .window.document
  const props =
    JSON.parse(document.querySelector('#__NEXT_DATA__')?.textContent || '{}')
      .props?.pageProps || {}
  document
    .querySelectorAll('script,style,noscript')
    .forEach(element => element.remove())
  const main = document.querySelector('#main') || document.querySelector('main')
  const mainText = normalize(main?.textContent)
  const h1 = normalize(main?.querySelector('h1')?.textContent)
  const links = Array.from(main?.querySelectorAll('a[href]') || [])
    .map(link => link.getAttribute('href'))
    .filter(href => href && href !== '#' && !href.startsWith('javascript:'))
  const errors = []
  if (response.status !== 200) errors.push(`HTTP ${response.status}`)
  if (!mainText) errors.push('No visible main content')
  if (!h1) errors.push('No H1 in main content')
  if (props.post) {
    if (!h1.includes(normalize(props.post.title)))
      errors.push('Article title absent from H1')
    const bodyText = normalize(
      document.querySelector('#notion-article')?.textContent
    )
    if (!bodyText) errors.push('Article body absent from HTML')
    const samples = Object.values(props.post.blockMap?.block || {})
      .map(entry => entry.value?.value || entry.value || entry)
      .filter(block =>
        [
          'text',
          'header',
          'sub_header',
          'sub_sub_header',
          'bulleted_list',
          'numbered_list',
          'quote',
          'callout'
        ].includes(block.type)
      )
      .map(block =>
        normalize((block.properties?.title || []).map(part => part[0]).join(''))
      )
      .filter(text => text.length >= 8)
    if (
      samples.length &&
      !samples.some(text => bodyText.includes(text.slice(0, 24)))
    ) {
      errors.push('Body text exists only in page data, not rendered HTML')
    }
  } else {
    if (path.replace(/\/$/, '') === '/category') {
      const categories = props.categoryOptions || []
      if (
        categories.length &&
        !categories.every(category =>
          links.some(href => {
            try {
              return decodeURIComponent(
                new URL(href, origin).pathname
              ).endsWith(`/category/${category.name}`)
            } catch {
              return false
            }
          })
        )
      )
        errors.push('Category items have no real links')
    } else {
      const posts = props.posts || props.allPosts || props.latestPosts || []
      const slugs = posts.map(post => post.slug).filter(Boolean)
      if (
        slugs.length &&
        !slugs.some(slug =>
          links.some(href => {
            try {
              return decodeURIComponent(
                new URL(href, origin).pathname
              ).endsWith(`/${slug}`)
            } catch {
              return false
            }
          })
        )
      )
        errors.push('No real article links in main HTML')
    }
  }
  const result = {
    path,
    status: response.status,
    cache:
      response.headers.get('x-nextjs-cache') ||
      response.headers.get('x-vercel-cache'),
    h1,
    mainCharacters: mainText.length,
    links: links.length,
    errors
  }
  console.log(JSON.stringify(result))
  return { result, props }
}

async function run() {
  if (requestedPaths.length) {
    const results = []
    for (const path of requestedPaths)
      results.push((await inspect(path)).result)
    process.exitCode = results.some(result => result.errors.length) ? 1 : 0
    return
  }
  const first = await inspect('/')
  const post = first.props.posts?.[0] || first.props.latestPosts?.[0]
  const category = first.props.categoryOptions?.[0]?.name
  const paths = [
    '/archive',
    '/category',
    ...(category ? [`/category/${encodeURIComponent(category)}`] : []),
    ...(post?.slug ? [`/${post.slug}`] : [])
  ]
  const results = [first.result]
  for (const path of paths) results.push((await inspect(path)).result)
  process.exitCode = results.some(result => result.errors.length) ? 1 : 0
}

run().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
