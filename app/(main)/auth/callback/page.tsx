import { Suspense } from 'react'
import { AuthCallbackView } from '@/components/auth/auth-callback-view'
import { PageSkeleton } from '@/components/shell/page'
export const metadata = { title: 'ログイン', robots: { index: false } }
export default function AuthCallbackPage() {
  return <Suspense fallback={<PageSkeleton />}><AuthCallbackView /></Suspense>
}
