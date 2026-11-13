import type { Metadata } from 'next'
import { QuestionDetailView } from '@/components/questions/question-detail-view'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `問題 ${decodeURIComponent(id)}` }
}

export default async function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <QuestionDetailView id={decodeURIComponent(id)} />
}
