import { Suspense } from 'react'
import { AttemptViewFromQuery } from '@/components/attempts/attempt-view'
import { PageSkeleton } from '@/components/shell/page'
export const metadata = { title: '回答中' }
export default function AttemptPage() {
  return <Suspense fallback={<PageSkeleton />}><AttemptViewFromQuery /></Suspense>
}
