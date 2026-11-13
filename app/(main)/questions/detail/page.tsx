import { Suspense } from 'react'
import { QuestionDetailViewFromQuery } from '@/components/questions/question-detail-view'
import { PageSkeleton } from '@/components/shell/page'
export const metadata = { title: '問題' }
export default function QuestionDetailPage() {
  return <Suspense fallback={<PageSkeleton />}><QuestionDetailViewFromQuery /></Suspense>
}
