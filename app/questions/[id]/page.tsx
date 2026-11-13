'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { ArrowLeft, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, Notice } from '@/components/kit/primitives'
import { AnsweredChoices, CategoryBadge, ChoiceList, DifficultyBadge, Explanation, MockTag, RateText, ReportButton, Verdict, nowIso } from '@/components/quiz/bits'
import { getState, mutate, runAction, useAppState, useHydrated } from '@/lib/store/store'
import { answerSingle, hasViewedExplanation, viewExplanation } from '@/lib/domain/actions'
import { questionView } from '@/lib/domain/selectors'
import { formatRate } from '@/lib/domain/rules'

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const s = useAppState()
  const hydrated = useHydrated()
  const q = s.questions.find((x) => x.id === id)
  const [selected, setSelected] = useState<string | null>(null)
  const [answer, setAnswer] = useState<{ selectedId: string; correct: boolean; counted: boolean } | null>(null)
  const [confirmPeek, setConfirmPeek] = useState(false)
  const [busy, setBusy] = useState(false)
  const eventRef = useRef<string | null>(null)

  if (!hydrated) return <p className="text-sm text-muted-foreground">読み込み中…</p>
  if (!q)
    return (
      <EmptyState title="問題が見つかりません" action={<Link href="/questions" className="text-sm text-brand underline">過去問一覧へ</Link>}>
        URLが正しいか確認してください。
      </EmptyState>
    )
  const { v, st, rate, diff } = questionView(s, q)
  const viewed = hasViewedExplanation(s, v.versionId)
  const showExplanation = !!answer || viewed

  const submit = () => {
    if (!selected || busy) return
    setBusy(true)
    // 同一回答イベントの再送は一度だけ集計（イベントIDで識別）
    eventRef.current ??= `sa-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const r = runAction(answerSingle, q.id, v.versionId, selected, eventRef.current, nowIso())
    setBusy(false)
    if (r.ok) {
      const ans = getState().singleAnswers.find((x) => x.id === eventRef.current)
      setAnswer({ selectedId: selected, correct: selected === v.correctId, counted: ans ? ans.counted === 'basic' : !viewed })
    }
  }
  const retry = () => {
    eventRef.current = null // 意図的な再回答は新しいイベント
    setAnswer(null)
    setSelected(null)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link href="/questions" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        過去問一覧
      </Link>

      <article className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:p-6">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tabular text-xs text-muted-foreground">No.{q.no}</span>
            <CategoryBadge c={v.category} />
            <DifficultyBadge d={diff} />
            <span className="ml-auto">
              <RateText rate={rate} size="sm" />
            </span>
          </div>
          <h1 className="text-lg leading-relaxed font-bold text-pretty md:text-xl">{v.text}</h1>
          {q.status === 'stopped' && <Notice tone="warning">この問題は現在出題を停止しています。</Notice>}
        </header>

        {!answer ? (
          <>
            <ChoiceList choices={v.choices} value={selected} onChange={setSelected} legend={v.text} />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="h-11 px-6 md:h-10" disabled={!selected || busy} onClick={submit}>
                回答する
              </Button>
              {!viewed && !confirmPeek && (
                <button type="button" className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-2" onClick={() => setConfirmPeek(true)}>
                  <Eye className="size-4" aria-hidden />
                  回答せずに解説を見る
                </button>
              )}
            </div>
            {viewed && <p className="text-xs leading-relaxed text-muted-foreground">この問題は解説を閲覧済みのため、ここでの回答は正答率の集計に含まれません。</p>}
            {confirmPeek && !viewed && (
              <Notice tone="warning" title="解説を先に表示しますか？">
                <p>解説を見た後の回答は、この問題の正答率の集計に含まれません（このブラウザで記録・仮）。</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    onClick={() => {
                      mutate((d) => viewExplanation(d, v.versionId))
                      setConfirmPeek(false)
                    }}
                  >
                    解説を表示する
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmPeek(false)}>
                    やめる
                  </Button>
                </div>
              </Notice>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <Verdict correct={answer.correct} />
              <span className="text-sm font-bold">{answer.correct ? '正解です' : '不正解です'}</span>
              {!answer.counted && <span className="text-xs text-muted-foreground">（解説閲覧後の回答のため集計対象外）</span>}
            </div>
            <AnsweredChoices choices={v.choices} correctId={v.correctId} selectedId={answer.selectedId} />
          </div>
        )}

        {showExplanation && (
          <section className="flex flex-col gap-2">
            {!answer && <AnsweredChoices choices={v.choices} correctId={v.correctId} selectedId={null} />}
            <Explanation v={v} />
          </section>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <ReportButton questionId={q.id} versionId={v.versionId} no={q.no} />
          {answer && (
            <Button variant="outline" onClick={retry}>
              もう一度回答する
            </Button>
          )}
        </footer>
      </article>

      <details className="rounded-lg border border-dashed border-warning/50 bg-card px-4 py-3 text-sm">
        <summary className="cursor-pointer font-bold text-warning">
          デモ専用：内部の集計値（参加者には表示しない）
        </summary>
        <dl className="tabular mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">版</dt>
            <dd>
              {v.versionId}
              {v.changeNote && `（${v.changeNote}）`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">基本回答（正解/回答）</dt>
            <dd>
              {st.basicCorrect} / {st.basicN}（{formatRate(st.basicN ? st.basicCorrect / st.basicN : null, 1)}）
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">復習回答（正解/回答）</dt>
            <dd>
              {st.reviewCorrect} / {st.reviewN}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">SNS正答率</dt>
            <dd>{formatRate(st.snsRate, 1)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">判定済み件数／次の境界</dt>
            <dd>
              {st.lastJudgedN} 件 ／ {st.lastJudgedN < s.rule.minN ? s.rule.minN : st.lastJudgedN + s.rule.interval} 件
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">表示中の値の由来</dt>
            <dd>{st.basicN >= s.rule.minN ? 'サイト基本正答率' : st.inherit ? `旧版から継承（${st.inherit.fromStatsVersionId}）` : 'SNS正答率'}</dd>
          </div>
        </dl>
        <p className="mt-2">
          <MockTag />
        </p>
      </details>
    </div>
  )
}
