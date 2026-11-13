import { ResultView } from '@/components/attempts/result-view'
export const metadata = { title: '結果と解説' }
export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResultView id={id} />
}
