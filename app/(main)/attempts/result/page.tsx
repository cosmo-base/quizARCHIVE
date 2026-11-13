import { Suspense } from 'react'
import { ResultViewFromQuery } from '@/components/attempts/result-view'
import { PageSkeleton } from '@/components/shell/page'
export const metadata = { title: '結果と解説' }
export default function ResultPage() {
  return <Suspense fallback={<PageSkeleton />}><ResultViewFromQuery /></Suspense>
}
