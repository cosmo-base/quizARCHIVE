import { AttemptView } from '@/components/attempts/attempt-view'
export const metadata = { title: '回答中' }
export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AttemptView id={id} />
}
