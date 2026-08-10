import { GlobalContextProvider } from '@/lib/global'
import { zhCN } from '@clerk/localizations'
import { ClerkProvider, useUser } from '@clerk/nextjs'

function ClerkGlobalContext({ children, pageProps }) {
  const { isLoaded, isSignedIn, user } = useUser()
  return (
    <GlobalContextProvider
      {...pageProps}
      auth={{
        isLoaded,
        isSignedIn,
        user,
        clerkProviderActive: true
      }}
    >
      {children}
    </GlobalContextProvider>
  )
}

/**
 * Clerk is intentionally mounted only for private/authentication routes.
 * Public content stays outside this client-side boundary and remains SSR-ready.
 */
export default function ClerkPrivateApp({ children, pageProps }) {
  return (
    <ClerkProvider localization={zhCN}>
      <ClerkGlobalContext pageProps={pageProps}>{children}</ClerkGlobalContext>
    </ClerkProvider>
  )
}
