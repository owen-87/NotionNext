import DashboardButton from '@/components/ui/dashboard/DashboardButton'
import { zhCN } from '@clerk/localizations'
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'

export function ClerkAuthControls({ signInLabel = '登录' }) {
  return (
    <>
      <SignedOut>
        <SignInButton mode='modal'>
          <button className='bg-gray-800 hover:bg-gray-900 text-white rounded-lg px-3 py-2'>
            {signInLabel}
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
        <DashboardButton />
      </SignedIn>
    </>
  )
}

/**
 * A small client-only auth island for public pages. It prevents Clerk from
 * becoming the rendering boundary for the header, article and SEO metadata.
 */
export function StandaloneClerkAuthControls(props) {
  return (
    <ClerkProvider localization={zhCN}>
      <ClerkAuthControls {...props} />
    </ClerkProvider>
  )
}
