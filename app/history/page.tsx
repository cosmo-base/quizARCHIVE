'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState, Tabs } from '@/components/kit/primitives'
import { toastResult } from '@/components/kit/toast'
import { nowIso } from '@/components/quiz/bits'
import { HistoryFrame } from '@/components/quiz/history-tabs'
import { mutate, runAction, useAppState, useHydrated } from '@/lib/store/store'
import { expireOverdue, startReview, startSameConditions } from '@/lib/domain/actions'
import { FINISH_LABEL, LEVEL_LABEL, STATUS_META } from '@/lib/domain/labels'
import { attemptTitle, settingsText } from '@/lib/domain/format'
import { PASSES_TO_PROMOTE, formatDateTime } from '@/lib/domain/rules'
import { myAttempts } from '@/lib/domain/selectors'
import { cn } from '@/lib/utils'

type F = 'all' | 'practice' | 'test' | 'review'

export default function HistoryPage() {
  const s = useAppState()
  const hydrated = useHydrated()
  const router = useRouter()
  const [f, setF] = useState<F>('all')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (hydrated) mutate((d) => void expireOverdue(d, nowIso()))
  }, [hydrated])

  const all = myAttempts(s)
  const list = all.filter((a) => (f === 'all' ? true : f === 'review' ? a.kind === 'review' : a.kind === 'normal' && a.mode === f))
  const act = (fn: () => ReturnType<typeof runAction>) => {
    if (busy) return
    setBusy(true)
    const r = toastResult(fn())
    if (r.ok && r.id) router.push(`/play/${r.id}`)
    else setBusy(false)
  }

  return (
    <HistoryFrame>
      <Tabs
        label="種類"
        value={f}
        onChange={setF}
        className="mb-3"
        items={[
          { value: 'all', label: 'すべて', count: all.length },
          { value: 'practice', label: '練習', count: all.filter((a) => a.kind === 'normal' && a.mode === 'practice').length },
          { value: 'test', label: 'テスト', count: all.filter((a) => a.kind === 'normal' && a.mode === 'test').length },
          { value: 'review', label: '復習', count: all.filter((a) => a.kind === 'review').length },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title="まだ履歴がありません" action={<Link href="/practice" className={buttonVariants()}>練習を始める</Link>} />
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((a) => {
            const answered = a.questions.filter((q) => q.selectedId).length
            const correct = a.questions.filter((q) => q.correct).length
            const done = a.status !== 'in_progress'
            return (
              <li key={a.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3 md:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{attemptTitle(a)}</span>
                  {a.kind === 'review' && <span className="rounded border border-dashed px-1.5 text-xs text-muted-foreground">復習・別集計</span>}
                  <span className={cn('rounded-md border px-1.5 py-0.5 text-xs', a.status === 'timed_out' && 'border-warning/40 bg-warning-soft text-warning', a.status === 'in_progress' && 'border-brand/40 bg-info-soft text-accent-foreground')}>
                    {STATUS_META[a.status].label}
                    {a.finishReason === 'manual_unanswered' && '（未回答あり）'}
                  </span>
                  <span className="tabular ml-auto text-xs text-muted-foreground">{formatDateTime(a.startedAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{settingsText(a)}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {done ? (
                    <>
                      <span className="tabular">
                        {a.mode === 'test' ? '得点' : '正解'} <span className="font-bold">{correct}</span> / {a.questions.length}
                      </span>
                      <span className="tabular text-muted-foreground">回答 {answered}・未回答 {a.questions.length - answered}</span>
                      {a.recognition && (
                        <span className={cn('font-bold', a.recognition.passed ? 'text-success' : '')}>
                          {a.recognition.passed ? '合格' : '不合格'}
                          {a.recognition.promoted ? `・${LEVEL_LABEL[a.recognition.levelAfter]}に昇格` : a.recognition.testType !== 'star' ? `（${a.recognition.passesAfter}/${PASSES_TO_PROMOTE}）` : ''}
                        </span>
                      )}
                      {a.mode === 'test' && !a.certifying && <span className="text-xs text-muted-foreground">{correct >= 32 ? '合格（認定なし）' : '不合格（認定なし）'}</span>}
                      {a.finishReason && <span className="sr-only">{FINISH_LABEL[a.finishReason]}</span>}
                    </>
                  ) : (
                    <span className="text-muted-foreground">{answered}/{a.questions.length}問 回答済み{a.deadline ? '・時計は止まっていません' : ''}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-2">
                  {done ? (
                    <Link href={`/result/${a.id}`} className={buttonVariants({ size: 'sm' })}>
                      結果・解説
                    </Link>
                  ) : (
                    <Link href={`/play/${a.id}`} className={buttonVariants({ size: 'sm' })}>
                      再開する
                    </Link>
                  )}
                  {done && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => runAction(startReview, a.id, a.questions.map((q) => q.questionId), nowIso()))}>
                      この問題を練習し直す
                    </Button>
                  )}
                  {a.kind === 'normal' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => runAction(startSameConditions, a.id, nowIso()))}>
                      同じ条件で新しく挑戦
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </HistoryFrame>
  )
}
