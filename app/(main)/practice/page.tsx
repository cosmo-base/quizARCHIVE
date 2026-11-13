import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PracticeSetupView } from '@/components/practice/practice-setup-view'
import { PageSkeleton } from '@/components/shell/page'

export const metadata: Metadata = { title: '練習する' }

export default function PracticePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PracticeSetupView />
    </Suspense>
  )
}
