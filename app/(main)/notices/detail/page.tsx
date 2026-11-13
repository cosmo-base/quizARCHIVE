import { Suspense } from 'react'
import { NoticeDetailViewFromQuery } from '@/components/home/notice-detail-view'
import { PageSkeleton } from '@/components/shell/page'
export const metadata = { title: 'お知らせ' }
export default function NoticePage() {
  return <Suspense fallback={<PageSkeleton />}><NoticeDetailViewFromQuery /></Suspense>
}
