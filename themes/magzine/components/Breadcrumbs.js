import SmartLink from '@/components/SmartLink'

function firstCategory(category) {
  return Array.isArray(category) ? category.find(Boolean) : category
}

export function buildBreadcrumbItems({ post, category, tag } = {}) {
  const currentCategory = category || firstCategory(post?.category)
  const items = [{ name: '首页', href: '/' }]

  if (currentCategory) {
    items.push({ name: '分类', href: '/category' })
    items.push({
      name: currentCategory,
      href: `/category/${encodeURIComponent(currentCategory)}`
    })
  } else if (tag) {
    items.push({ name: '标签', href: '/tag' })
    items.push({ name: tag, href: `/tag/${encodeURIComponent(tag)}` })
  }
  if (post?.title) {
    items.push({ name: post.title })
  }

  return items
}

export default function Breadcrumbs({ post, category, tag }) {
  const items = buildBreadcrumbItems({ post, category, tag })

  if (items.length < 2) return null

  return (
    <nav aria-label='面包屑' className='px-2 pt-8 lg:px-0'>
      <ol className='flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400'>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          return (
            <li
              key={`${item.name}-${index}`}
              className='flex items-center gap-2'
            >
              {index > 0 && <span aria-hidden='true'>/</span>}
              {isCurrent || !item.href ? (
                <span aria-current='page'>{item.name}</span>
              ) : (
                <SmartLink href={item.href} className='hover:underline'>
                  {item.name}
                </SmartLink>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
