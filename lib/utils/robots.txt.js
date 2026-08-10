import BLOG from '@/blog.config'
import { buildRobotsTxt } from '@/lib/seo'
import fs from 'fs'

export function generateRobotsTxt() {
  const content = buildRobotsTxt(BLOG.LINK)

  try {
    fs.mkdirSync('./public', { recursive: true })
    fs.writeFileSync('./public/robots.txt', content)
  } catch (error) {
    console.warn('无法写入 robots.txt', error)
  }
}
