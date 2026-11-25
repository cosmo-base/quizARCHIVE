'use client'

import { ArrowLeft } from 'lucide-react'
import { LinkButton } from '@/components/link-button'
import { PageContainer, PageHeading, PageSkeleton } from '@/components/shell/page'
import { useNotices } from '@/lib/api/hooks'
import { useReadNotices } from '@/lib/notice-read'
import { NoticeItem } from './notice-list'

/** お知らせの一覧（公開中のものすべて。既読も残す） */
export function NoticesIndexView() {
  const { data: notices, error } = useNotices()
  const { read } = useReadNotices()
  if (!notices && !error) return <PageSkeleton />
  return (
    <PageContainer narrow>
      <LinkButton href="/" variant="ghost" className="h-11 self-start px-2">
        <ArrowLeft aria-hidden="true" />
        ホームへ
      </LinkButton>
      <PageHeading title="お知らせ" description="運営からのお知らせと、問題の訂正です。ホームで閉じたお知らせも、ここに残ります。" />
      {error && !notices ? (
        <p role="alert" className="text-sm text-destructive">お知らせを読み込めませんでした。時間をおいて開き直してください。</p>
      ) : !notices || notices.length === 0 ? (
        <p className="rounded-2xl border bg-card px-6 py-10 text-center text-muted-foreground">今はお知らせはありません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notices.map((n) => (
            <li key={n.id}>
              <NoticeItem n={n} read={read?.has(n.id) ?? false} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}
