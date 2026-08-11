import SmartLink from '@/components/SmartLink'
import { getPostHref, getReadingPathPosts } from '../content'

const CollectionIntro = ({ category, tag, description, posts = [] }) => {
  const readingPath = getReadingPathPosts(posts, 3)
  const term = category || tag

  return (
    <div className='mt-3 max-w-4xl text-gray-600 dark:text-gray-400'>
      <p className='leading-7'>{description}</p>

      {readingPath.length > 1 && (
        <nav
          aria-label={`${term || '文章'}建议阅读顺序`}
          className='mt-5 rounded-lg border border-gray-200 bg-white/60 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/40'
        >
          <h2 className='text-base font-semibold text-gray-900 dark:text-gray-100'>
            建议阅读顺序
          </h2>
          <ol className='mt-2 list-inside list-decimal space-y-1.5'>
            {readingPath.map(post => (
              <li key={post.id || getPostHref(post)}>
                <SmartLink
                  href={getPostHref(post)}
                  className='underline decoration-gray-300 underline-offset-4 hover:text-black dark:decoration-gray-600 dark:hover:text-white'
                >
                  {post.title}
                </SmartLink>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  )
}

export default CollectionIntro
