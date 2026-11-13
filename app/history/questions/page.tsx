'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState, Tabs } from '@/components/kit/primitives'
import { toastResult } from '@/components/kit/toast'
import { CategoryBadge, Verdict, nowIso } from '@/components/quiz/bits'
import { HistoryFrame } from '@/components/quiz/history-tabs'
import { runAction, useAppState } from '@/lib/store/store'
import { sameSubject, startReview, subjectOf } from '@/lib/domain/actions'
import { formatDateTime } from '@/lib/domain/rules'
import { myAttempts } from '@/lib/domain/selectors'
import { currentVersion } from '@/lib/domain/generate'

interface Row {
  questionId: string
  normalN: number
  normalCorrect: number
  reviewN: number
  reviewCorrect: number
  last: { correct: boolean | null; at: string; attemptId: string | null; kind: 'normal' | 'review' | 'single' }
}

export default function SolvedQuestionsPage() {
  const s = useAppState()
  const router = useRouter()
  const [f, setF] = useState<'all' | 'wrong'>('all')
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    const m = new Map<string, Row>()
    const touch = (qid: string, kind: Row['last']['kind'], correct: boolean | null, at: string, attemptId: string | null) => {
      const r = m.get(qid) ?? { questionId: qid, normalN: 0, normalCorrect: 0, reviewN: 0, reviewCorrect: 0, last: { correct, at, attemptId, kind } }
      if (correct !== null) {
        if (kind === 'review') {
          r.reviewN++
          if (correct) r.reviewCorrect++
        } else {
          r.normalN++
          if (correct) r.normalCorrect++
        }
      }
      if (at >= r.last.at) r.last = { correct, at, attemptId, kind }
      m.set(qid, r)
    }
    for (const a of myAttempts(s)) {
      if (a.status === 'in_progress') continue
      for (const q of a.questions) touch(q.questionId, a.kind, q.correct, a.finishedAt ?? a.startedAt, a.id)
    }
    const me = subjectOf(s)
    for (const sa of s.singleAnswers.filter((x) => sameSubject(x.subject, me))) {
      const qid = s.questions.find((q) => q.versions.some((v) => v.versionId === sa.versionId))?.id
      if (qid) touch(qid, 'single', sa.correct, sa.at, null)
    }
    return [...m.values()].sort((a, b) => b.last.at.localeCompare(a.last.at))
  }, [s])

  const wrong = rows.filter((r) => r.last.correct !== true)
  const list = f === 'all' ? rows : wrong
  const review = (ids: string[]) => {
    if (busy) return
    setBusy(true)
    const r = toastResult(runAction(startReview, null, ids, nowIso()))
    if (r.ok && r.id) router.push(`/play/${r.id}`)
    else setBusy(false)
  }

  return (
    <HistoryFrame>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs
          label="表示する問題"
          value={f}
          onChange={setF}
          items={[
            { value: 'all', label: 'すべて', count: rows.length },
            { value: 'wrong', label: '最後に不正解・未回答', count: wrong.length },
          ]}
        />
        <Button variant="outline" disabled={busy || wrong.length === 0} onClick={() => review(wrong.slice(0, 40).map((r) => r.questionId))}>
          不正解・未回答の問題を復習（最大40問）
        </Button>
      </div>
      {list.length === 0 ? (
        <EmptyState title="該当する問題はありません" />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {list.map((r) => {
            const q = s.questions.find((x) => x.id === r.questionId)!
            const v = currentVersion(q)
            return (
              <li key={r.questionId} className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link href={`/questions/${q.id}`} className="text-sm leading-relaxed font-bold hover:underline">
                    <span className="tabular mr-2 text-xs font-normal text-muted-foreground">No.{q.no}</span>
                    {v.text}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <CategoryBadge c={v.category} />
                    <span className="tabular">
                      通常 {r.normalCorrect}/{r.normalN} 正解
                    </span>
                    <span className="tabular">
                      復習 {r.reviewCorrect}/{r.reviewN} 正解
                    </span>
                    <span>
                      最終：{formatDateTime(r.last.at)}（{r.last.kind === 'review' ? '復習' : r.last.kind === 'single' ? '単問' : '練習・テスト'}）
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Verdict correct={r.last.correct} />
                  {r.last.attemptId && (
                    <Link href={`/result/${r.last.attemptId}`} className="text-xs text-brand underline underline-offset-2">
                      該当の回
                    </Link>
                  )}
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => review([q.id])}>
                    復習
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </HistoryFrame>
  )
}
