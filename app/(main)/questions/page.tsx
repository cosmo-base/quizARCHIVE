import { Suspense } from 'react'
import type { Metadata } from 'next'
import { QuestionListView } from '@/components/questions/question-list-view'
import { PageSkeleton } from '@/components/shell/page'

export const metadata: Metadata = { title: '過去問を探す' }

export default function QuestionsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <QuestionListView />
    </Suspense>
  )
}
