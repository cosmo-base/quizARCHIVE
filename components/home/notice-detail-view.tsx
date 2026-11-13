'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { LinkButton } from '@/components/link-button'
import { PageContainer } from '@/components/shell/page'
import { useIdFromQuery } from '@/components/id-from-query'
import { getNotice } from '@/lib/data/notices'
import { routes } from '@/lib/routes'
import { formatDate } from '@/lib/time'

export function NoticeDetailViewFromQuery() {
  const id = useIdFromQuery()
  const notice = getNotice(id)
  if (!notice) {
    return (
      <PageContainer narrow>
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center">
          <p className="font-bold">お知らせが見つかりません</p>
          <LinkButton href="/" variant="outline" className="h-11">ホームへ</LinkButton>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer narrow>
      <LinkButton href="/" variant="ghost" className="h-11 self-start px-2">
          <ArrowLeft aria-hidden="true" />
          ホームへ
        </LinkButton>
      <article className="flex flex-col gap-5 rounded-2xl border bg-card p-5 md:p-8">
        <header className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={notice.kind === 'correction' ? 'rounded-md bg-destructive-soft px-2 py-0.5 text-xs font-bold text-destructive' : 'rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary'}>
              {notice.kind === 'correction' ? '訂正' : 'お知らせ'}
            </span>
            <time dateTime={notice.publishedAt}>{formatDate(notice.publishedAt)}</time>
          </p>
          <h1 className="text-xl leading-snug font-bold text-balance md:text-2xl">{notice.title}</h1>
        </header>
        <div className="flex flex-col gap-3 leading-relaxed">
          {notice.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        {notice.correction && (
          <dl className="grid gap-3 rounded-xl bg-muted/60 p-4 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="font-bold text-muted-foreground">訂正前</dt>
            <dd className="line-through decoration-destructive/60">{notice.correction.before}</dd>
            <dt className="font-bold text-muted-foreground">訂正後</dt>
            <dd className="font-medium">{notice.correction.after}</dd>
          </dl>
        )}
        {notice.correction && (
          <LinkButton href={routes.question(notice.correction.questionId)} variant="outline" className="h-11 self-start">
              {`${notice.correction.questionId} を見る`}
              <ArrowRight aria-hidden="true" />
            </LinkButton>
        )}
      </article>
    </PageContainer>
  )
}
