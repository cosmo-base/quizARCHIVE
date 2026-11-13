import { Suspense } from 'react'
import { TestSetupView } from '@/components/tests/test-setup-view'
import { PageSkeleton } from '@/components/shell/page'
export const metadata = { title: 'テストに挑戦' }
export default function TestsPage() {
  return <Suspense fallback={<PageSkeleton />}><TestSetupView /></Suspense>
}
