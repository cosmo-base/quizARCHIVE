'use client'

import Link from 'next/link'
import { LinkButton } from '@/components/link-button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, BookOpen, ClipboardCheck, Clock, PencilLine, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserLevelBadge } from '@/components/quiz/badges'
import { DemoLoginDialog } from '@/components/quiz/demo-login-dialog'
import { LevelProgressSummary } from '@/components/quiz/level-progress'
import { PageContainer, SurfaceCard } from '@/components/shell/page'
import { attemptTitle } from '@/lib/labels'
import { attemptSettingsSummary, inProgressAttempts, isExpired, ownedAttempts } from '@/lib/selectors'
import { actions, currentUser, useAppState } from '@/lib/store'
import { formatDateTime } from '@/lib/time'
import { Skeleton } from '@/components/ui/skeleton'
import { NoticeList } from './notice-list'
import { OrbitMark } from './orbit-mark'
import { AttemptOutcome } from '@/components/history/attempt-outcome'

export function HomeView() {
  const state = useAppState()
  const router = useRouter()
  const [loginOpen, setLoginOpen] = useState(false)
  const user = state ? currentUser(state) : null
  const resumable = state ? inProgressAttempts(state) : []
  const recent = state && user ? ownedAttempts(state).filter((a) => a.finalized).slice(0, 3) : []

  return (
    <PageContainer className="gap-8">
      <NoticeList />

      <section aria-labelledby="hero-heading" className="relative overflow-hidden rounded-3xl border bg-card px-6 py-8 md:px-10 md:py-12">
        <OrbitMark className="pointer-events-none absolute -top-6 -right-10 hidden w-72 text-primary sm:block md:w-96" />
        <div className="relative flex max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 id="hero-heading" className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
              毎日宇宙クイズ
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">気になる問題から、宇宙をもっと知ろう。</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <LinkButton href="/practice" size="lg" className="h-12 px-6 text-base">
                <PencilLine aria-hidden="true" />
                練習する
              </LinkButton>
            <LinkButton href="/tests" size="lg" variant="outline" className="h-12 px-6 text-base">
                <ClipboardCheck aria-hidden="true" />
                テストに挑戦
              </LinkButton>
            <Link
              href="/questions"
              className="inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <BookOpen aria-hidden="true" className="size-4" />
              過去問を探す
            </Link>
          </div>
        </div>
      </section>

      {!state ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      ) : (
        <>
          {resumable.length > 0 && (
            <section aria-labelledby="resume-heading" className="flex flex-col gap-3">
              <h2 id="resume-heading" className="text-lg font-bold">
                途中の練習／テストを再開
              </h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {resumable.map((a) => {
                  const expired = isExpired(a)
                  const answered = Object.values(a.answers).filter((v) => v !== null).length
                  return (
                    <li key={a.id}>
                      <SurfaceCard as="div" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="font-bold">{attemptTitle(a.mode, a.testKind)}</p>
                          <p className="text-sm text-muted-foreground">
                            {`${formatDateTime(a.startedAt)} 開始・${answered}／${a.questionSnapshots.length}問回答済み`}
                          </p>
                          {expired && (
                            <p className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock aria-hidden="true" className="size-4" />
                              終了期限を過ぎました
                            </p>
                          )}
                        </div>
                        {expired ? (
                          <Button
                            variant="outline"
                            className="h-11 shrink-0"
                            onClick={() => {
                              actions.finalizeAttempt(a.id, 'timedOut')
                              router.push(`/attempts/${a.id}/result`)
                            }}
                          >
                            結果を見る
                            <ArrowRight aria-hidden="true" />
                          </Button>
                        ) : (
                          <LinkButton href={`/attempts/${a.id}`} className="h-11 shrink-0">
                              <PlayCircle aria-hidden="true" />
                              再開する
                            </LinkButton>
                        )}
                      </SurfaceCard>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {user ? (
            <div className="grid gap-4 md:grid-cols-5">
              <SurfaceCard aria-labelledby="level-heading" className="flex flex-col gap-4 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="level-heading" className="text-lg font-bold">
                    あなたのレベル
                  </h2>
                  <UserLevelBadge level={user.level} size="lg" />
                </div>
                <LevelProgressSummary user={user} />
                <Link
                  href="/progress"
                  className="mt-auto inline-flex h-11 items-center gap-1 self-start rounded-lg text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  レベルと星を見る
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </SurfaceCard>

              <SurfaceCard aria-labelledby="recent-heading" className="flex flex-col gap-4 md:col-span-3">
                <h2 id="recent-heading" className="text-lg font-bold">
                  最近の履歴
                </h2>
                {recent.length === 0 ? (
                  <div className="flex flex-col items-start gap-3">
                    <p className="text-muted-foreground">まだ履歴はありません。練習から始めてみましょう。</p>
                    <LinkButton href="/practice" variant="outline" className="h-11">練習する</LinkButton>
                  </div>
                ) : (
                  <ul className="flex flex-col divide-y">
                    {recent.map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/attempts/${a.id}/result`}
                          className="flex items-center justify-between gap-3 rounded-lg py-3 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="font-medium">{attemptTitle(a.mode, a.testKind)}</span>
                            <span className="truncate text-sm text-muted-foreground">
                              {`${formatDateTime(a.finishedAt ?? a.startedAt)}・${attemptSettingsSummary(a)}`}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-3">
                            <span className="font-bold tabular-nums">{`${a.analytics?.correctCount ?? 0}／${a.questionSnapshots.length}`}</span>
                            <AttemptOutcome attempt={a} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/history"
                  className="mt-auto inline-flex h-11 items-center gap-1 self-start rounded-lg text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  学習履歴をすべて見る
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </SurfaceCard>
            </div>
          ) : (
            <SurfaceCard aria-labelledby="guest-heading" className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <h2 id="guest-heading" className="text-lg font-bold">
                  ログインすると学習を記録できます
                </h2>
                <p className="text-muted-foreground text-pretty">
                  練習と過去問はログインなしで使えます。ログインすると、学習履歴・テストの合格実績・レベル・星が保存されます。
                </p>
              </div>
              <Button variant="outline" className="h-11 shrink-0 px-5" onClick={() => setLoginOpen(true)}>
                デモユーザーでログイン
              </Button>
            </SurfaceCard>
          )}
        </>
      )}
      <DemoLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </PageContainer>
  )
}
