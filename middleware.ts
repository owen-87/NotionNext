import { checkStrIsNotionId, getLastPartOfUrl } from '@/lib/utils'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import { idToUuid } from 'notion-utils'
import BLOG from './blog.config'

export const config = {
  // Include content routes while excluding static assets and Next.js internals.
  matcher: ['/((?!.*\\..*|_next|/sign-in|/auth).*)', '/', '/(api|trpc)(.*)']
}

const isTenantRoute = createRouteMatcher([
  '/user/organization-selector(.*)',
  '/user/orgid/(.*)',
  '/dashboard',
  '/dashboard/(.*)'
])

const isTenantAdminRoute = createRouteMatcher([
  '/admin/(.*)/memberships',
  '/admin/(.*)/domain'
])

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Redirect only recognized production hosts. Preview deployments remain usable
 * and default-locale aliases collapse to the unprefixed canonical path.
 */
function getCanonicalRedirect(req: NextRequest) {
  const destination = req.nextUrl.clone()
  const externalRequestUrl = new URL(req.url)
  const canonicalUrl = new URL(BLOG.LINK)
  const canonicalHostname = canonicalUrl.hostname.toLowerCase()
  const apexHostname = canonicalHostname.startsWith('www.')
    ? canonicalHostname.slice(4)
    : canonicalHostname
  const requestHostname = (
    req.headers.get('host')?.split(':')[0] || destination.hostname
  ).toLowerCase()
  const recognizedProductionHost = [canonicalHostname, apexHostname].includes(
    requestHostname
  )
  let shouldRedirect = false

  if (recognizedProductionHost && requestHostname !== canonicalHostname) {
    destination.hostname = canonicalHostname
    destination.port = canonicalUrl.port
    destination.protocol = canonicalUrl.protocol
    shouldRedirect = true
  }

  const localePattern = new RegExp(`^/${escapeRegExp(BLOG.LANG)}(?=/|$)`, 'i')
  if (localePattern.test(externalRequestUrl.pathname)) {
    destination.pathname =
      externalRequestUrl.pathname.replace(localePattern, '') || '/'
    shouldRedirect = true
  }

  // Next.js i18n may expose the default locale in `nextUrl.pathname` even
  // when the browser requested the unprefixed URL. Never redirect an
  // already-canonical external URL to itself, or Vercel will loop forever.
  const isSameExternalUrl =
    destination.protocol === externalRequestUrl.protocol &&
    destination.host === externalRequestUrl.host &&
    destination.pathname === externalRequestUrl.pathname &&
    destination.search === externalRequestUrl.search

  return shouldRedirect && !isSameExternalUrl
    ? NextResponse.redirect(destination, 308)
    : null
}

const noAuthMiddleware = async (req: NextRequest, _event: NextFetchEvent) => {
  if (BLOG.UUID_REDIRECT) {
    let redirectJson: Record<string, string> = {}
    try {
      const response = await fetch(`${req.nextUrl.origin}/redirect.json`)
      if (response.ok) {
        redirectJson = (await response.json()) as Record<string, string>
      }
    } catch (error) {
      console.error('Error fetching static file:', error)
    }

    let lastPart = getLastPartOfUrl(req.nextUrl.pathname) as string
    if (checkStrIsNotionId(lastPart)) {
      lastPart = idToUuid(lastPart)
    }
    if (lastPart && redirectJson[lastPart]) {
      const redirectToUrl = req.nextUrl.clone()
      redirectToUrl.pathname = `/${redirectJson[lastPart]}`
      return NextResponse.redirect(redirectToUrl, 308)
    }
  }
  return NextResponse.next()
}

const authMiddleware = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkMiddleware(async (auth, req) => {
      const { userId } = await auth()
      if (isTenantRoute(req) && !userId) {
        const url = new URL('/sign-in', req.url)
        url.searchParams.set('redirectTo', req.url)
        return NextResponse.redirect(url)
      }

      if (isTenantAdminRoute(req)) {
        await auth.protect({ role: 'org:admin' })
      }

      return NextResponse.next()
    })
  : noAuthMiddleware

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const canonicalRedirect = getCanonicalRedirect(req)
  if (canonicalRedirect) return canonicalRedirect
  return authMiddleware(req, event)
}
