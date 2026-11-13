'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, ChevronRight, Megaphone, PencilLine, Timer } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, Panel } from '@/components/kit/primitives'
import { PageTitle, Stars } from '@/components/quiz/bits'
import { useAppState, useCurrentUser, useHydrated } from '@/lib/store/store'
import { LEVEL_LABEL, TEST_LABEL } from '@/lib/domain/labels'
import { ELIGIBLE_TEST, PASSES_TO_PROMOTE, formatDateTime, starInfo } from '@/lib/domain/rules'
import { myAttempts } from '@/lib/domain/selectors'
import type { Notice } from '@/lib/domain/types'
import { cn } from '@/lib/utils'

const LAUNCH_KEY = 'cb-quiz-v0-notice-shown'

function NoticeBody({ n }: { n: Notice }) {
  const s = useAppState()
  const q = n.questionId ? s.questions.find((x) => x.id === n.questionId) : null
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      <p className="text-xs text-muted-foreground">掲載日時 {formatDateTime(n.publishedAt)}</p>
      {q && <p>対象：問題 No.{q.no}</p>}
      <p className="whitespace-pre-wrap">{n.body}</p>
      {q && (
        <Link href={`/questions/${q.id}`} className="text-brand underline underline-offset-2">
          対象の問題を開く
        </Link>
      )}
    </div>
  )
}

export default function HomePage() {
  const s = useAppState()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const [launchNotice, setLaunchNotice] = useState<Notice | null>(null)
  const [openNotice, setOpenNotice] = useState<Notice | null>(null)

  // FR-24 正解設定の訂正は、起動後最初の画面で表示（既読・再表示ルールは TBD-09。V0はブラウザのセッションごとに1回）
  useEffect(() => {
    if (!hydrated) return
    try {
      if (sessionStorage.getItem(LAUNCH_KEY)) return
      sessionStorage.setItem(LAUNCH_KEY, '1')
    } catch {
      return
    }
    const c = s.notices.find((n) => n.kind === 'correction')
    if (c) setLaunchNotice(c)
  }, [hydrated, s.notices])

  const inProgress = hydrated ? myAttempts(s).filter((a) => a.status === 'in_progress') : []
  const notices = [...s.notices].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-xl bg-primary px-5 py-7 text-primary-foreground md:px-8 md:py-9">
        <svg className="pointer-events-none absolute -top-24 -right-24 size-96 opacity-40" viewBox="0 0 200 200" aria-hidden>
          <ellipse cx="100" cy="100" rx="96" ry="70" fill="none" stroke="currentColor" strokeWidth="0.6" />
          <ellipse cx="110" cy="96" rx="70" ry="48" fill="none" stroke="currentColor" strokeWidth="0.6" />
          <path d="M60 60l2 6 6 2-6 2-2 6-2-6-6-2 6-2z M150 50l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" fill="currentColor" />
        </svg>
        <p className="text-sm font-bold text-lv1">Cosmo Base</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">毎日宇宙クイズ 過去問練習</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-primary-foreground/85">これまでの宇宙クイズを、探して・練習して・テストで確かめて・解説で振り返る。</p>
        <p className="mt-1 text-xs text-primary-foreground/70">公開中 {s.questions.filter((q) => q.status === 'published').length} 問（仮データ）</p>
      </section>

      <section aria-labelledby="notice-h" className="flex flex-col gap-2">
        <h2 id="notice-h" className="flex items-center gap-1.5 text-sm font-bold">
          <Megaphone className="size-4" aria-hidden />
          運営からのお知らせ
        </h2>
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {notices.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => setOpenNotice(n)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60">
                <span className={cn('shrink-0 rounded-md border px-1.5 py-0.5 text-xs font-bold', n.kind === 'correction' ? 'border-warning/40 bg-warning-soft text-warning' : 'bg-muted')}>
                  {n.kind === 'correction' ? '訂正' : 'お知らせ'}
                </span>
                <span className="flex-1 text-sm">{n.title}</span>
                <span className="tabular hidden text-xs text-muted-foreground sm:inline">{formatDateTime(n.publishedAt).slice(0, 10)}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {inProgress.length > 0 && (
        <Panel title="回答中の回があります">
          <ul className="flex flex-col gap-2">
            {inProgress.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {a.mode === 'test' && a.testType ? TEST_LABEL[a.testType] : a.kind === 'review' ? '復習' : '練習'}（{a.questions.filter((q) => q.selectedId).length}/{a.questions.length}問 回答済み）
                  {a.deadline && <span className="text-muted-foreground"> ・時計は止まっていません</span>}
                </span>
                <Link href={`/play/${a.id}`} className={buttonVariants({ size: 'sm' })}>
                  再開する
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { href: '/questions', icon: BookOpen, title: '過去問一覧', body: '分野・難易度で探して、1問ずつ解いて解説を読む' },
          { href: '/practice', icon: PencilLine, title: '練習する', body: '問題数・分野・難易度を選んでランダム出題。レベルの制限なし' },
          { href: '/test', icon: Timer, title: 'テストを受ける', body: '40問・60分。32問以上の正解で合格、累計3回で昇格' },
        ].map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.href} href={c.href} className="group flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-lv2 hover:bg-info-soft">
              <span className="flex items-center gap-2 font-bold">
                <Icon className="size-5 text-brand" aria-hidden />
                {c.title}
                <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground">{c.body}</span>
            </Link>
          )
        })}
      </div>

      {user ? (
        <Panel title="あなたの進捗" actions={<Link href="/level" className="text-sm text-brand underline underline-offset-2">レベル・星の詳細</Link>}>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-muted-foreground">現在のレベル</p>
              <p className="text-2xl font-bold">{LEVEL_LABEL[user.level]}</p>
            </div>
            {user.level < 4 ? (
              <div>
                <p className="text-xs text-muted-foreground">{TEST_LABEL[ELIGIBLE_TEST[user.level]]}の合格</p>
                <p className="tabular text-2xl font-bold">
                  {user.passes}
                  <span className="text-base text-muted-foreground"> / {PASSES_TO_PROMOTE}回</span>
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">専門家の星（累計合格 {user.expertPasses}回）</p>
                <Stars passes={user.expertPasses} className="text-2xl" />
                <p className="text-xs text-muted-foreground">次の表示まであと{starInfo(user.expertPasses).toNext}回</p>
              </div>
            )}
            <Link href="/test" className={cn(buttonVariants(), 'ml-auto')}>
              {TEST_LABEL[ELIGIBLE_TEST[user.level]]}へ
            </Link>
          </div>
        </Panel>
      ) : (
        <p className="rounded-lg border border-dashed bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          ログインしなくても一覧・練習・テストを利用できます。ログインすると、学習履歴・レベル・星を保存できます。
        </p>
      )}

      <Dialog open={!!launchNotice} onClose={() => setLaunchNotice(null)} title={launchNotice?.title ?? ''} description="運営からのお知らせ（正解の訂正）" size="md">
        {launchNotice && <NoticeBody n={launchNotice} />}
      </Dialog>
      <Dialog open={!!openNotice} onClose={() => setOpenNotice(null)} title={openNotice?.title ?? ''} size="md">
        {openNotice && <NoticeBody n={openNotice} />}
      </Dialog>
    </div>
  )
}
