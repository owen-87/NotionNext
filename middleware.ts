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

const isClerkRoute = createRouteMatcher([
  '/user/organization-selector(.*)',
  '/user/orgid/(.*)',
  '/dashboard(.*)',
  '/admin/(.*)',
  '/api/user(.*)'
])

/**
 * Redirect only recognized production hosts. Preview deployments remain usable.
 * Protocol normalization is owned by Vercel, which already redirects HTTP.
 */
function getCanonicalRedirect(req: NextRequest) {
  const destination = req.nextUrl.clone()
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
  if (recognizedProductionHost && requestHostname !== canonicalHostname) {
    destination.hostname = canonicalHostname
    destination.port = canonicalUrl.port
    destination.protocol = canonicalUrl.protocol
    return NextResponse.redirect(destination, 308)
  }

  return null
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
  return isClerkRoute(req)
    ? authMiddleware(req, event)
    : noAuthMiddleware(req, event)
}
