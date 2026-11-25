'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Info, TriangleAlert, X } from 'lucide-react'
import { useNotices } from '@/lib/api/hooks'
import type { Notice } from '@/lib/types'
import { useReadNotices } from '@/lib/notice-read'
import { formatDate } from '@/lib/time'
import { cn } from '@/lib/utils'
import { routes } from '@/lib/routes'

/** お知らせ1件（ホームと一覧で使う）。onDismiss があれば「×」で閉じられる */
export function NoticeItem({ n, read = false, onDismiss }: { n: Notice; read?: boolean; onDismiss?: () => void }) {
  const correction = n.kind === 'correction'
  const Icon = correction ? TriangleAlert : Info
  return (
    <div className="relative">
      <Link
        href={routes.notice(n.id)}
        className={cn(
          'group flex items-start gap-3 rounded-xl border p-4 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          correction && !read ? 'border-destructive/30 bg-destructive-soft hover:border-destructive/50' : 'bg-card hover:bg-muted/60',
          onDismiss && 'pr-12',
        )}
      >
        <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', correction ? 'text-destructive' : 'text-primary')} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-xs font-bold',
                correction ? 'bg-destructive text-primary-foreground' : 'bg-primary-soft text-primary',
              )}
            >
              {correction ? '訂正' : 'お知らせ'}
            </span>
            <span className="font-medium text-pretty">{n.title}</span>
            {read && <span className="text-xs text-muted-foreground">既読</span>}
          </span>
          <span className="text-sm text-muted-foreground">
            <time dateTime={n.publishedAt}>{formatDate(n.publishedAt)}</time>
            {'　'}
            {n.summary}
          </span>
        </span>
        {!onDismiss && <ChevronRight aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />}
      </Link>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`「${n.title}」を閉じる（お知らせの一覧には残ります）`}
          className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      )}
    </div>
  )
}

/** ホーム：未読のお知らせだけ。開くか「×」で閉じると、この端末では出なくなる */
export function NoticeList() {
  const { data: notices } = useNotices()
  const { read, markRead, prune } = useReadNotices()
  useEffect(() => {
    // 読み込みに失敗して空のときに既読を消さないよう、1件以上あるときだけ整理する
    if (notices && notices.length > 0 && read) prune(notices.map((n) => n.id))
  }, [notices, read, prune])
  if (!notices || notices.length === 0 || !read) return null
  const unread = notices.filter((n) => !read.has(n.id))
  return (
    <section aria-labelledby="notices-heading" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="notices-heading" className="text-sm font-medium text-muted-foreground">
          運営からのお知らせ
        </h2>
        <Link href="/notices" className="text-sm text-primary underline-offset-4 hover:underline">
          すべて見る（{notices.length}件）
        </Link>
      </div>
      {unread.length > 0 && (
        <ul className="flex flex-col gap-2">
          {unread.map((n) => (
            <li key={n.id}>
              <NoticeItem n={n} onDismiss={() => markRead(n.id)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
