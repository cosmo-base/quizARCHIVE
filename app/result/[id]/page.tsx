'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { History, PartyPopper, RotateCcw, Sparkles } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState, Notice, Tabs } from '@/components/kit/primitives'
import { toastResult } from '@/components/kit/toast'
import { AnsweredChoices, CategoryBadge, DifficultyBadge, Explanation, ReportButton, Stars, Verdict, nowIso } from '@/components/quiz/bits'
import { mutate, runAction, useAppState, useCurrentUser, useHydrated } from '@/lib/store/store'
import { expireOverdue, sameSubject, startReview, startSameConditions, subjectOf } from '@/lib/domain/actions'
import { FINISH_LABEL, LEVEL_LABEL, STATUS_META, TEST_LABEL } from '@/lib/domain/labels'
import { PASSES_TO_PROMOTE, PASS_SCORE, formatDateTime, formatDuration, formatRate, starInfo } from '@/lib/domain/rules'
import { findVersion } from '@/lib/domain/selectors'
import { attemptTitle, settingsText } from '@/lib/domain/format'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'wrong' | 'blank'

export default function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const s = useAppState()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const [filter, setFilter] = useState<Filter>('all')
  const [busy, setBusy] = useState(false)
  const a = s.attempts.find((x) => x.id === id)
  const own = a && sameSubject(a.subject, subjectOf(s))

  useEffect(() => {
    if (hydrated) mutate((d) => void expireOverdue(d, nowIso()))
  }, [hydrated])

  if (!hydrated) return <p className="text-sm text-muted-foreground">読み込み中…</p>
  if (!a || !own)
    return (
      <EmptyState title="結果を表示できません" action={<Link href="/history" className="text-sm text-brand underline">学習履歴へ</Link>}>
        存在しないか、別の利用者の回です。成績は本人のみに表示されます。
      </EmptyState>
    )
  if (a.status === 'in_progress')
    return (
      <EmptyState title="この回はまだ終了していません" action={<Link href={`/play/${a.id}`} className={buttonVariants()}>回答を再開する</Link>}>
        終了を確定すると結果と解説が表示されます。
      </EmptyState>
    )

  const total = a.questions.length
  const answered = a.questions.filter((q) => q.selectedId).length
  const correct = a.questions.filter((q) => q.correct).length
  const blank = total - answered
  const passed = a.mode === 'test' ? correct >= PASS_SCORE : null
  const duration = a.finishedAt ? (new Date(a.finishedAt).getTime() - new Date(a.startedAt).getTime()) / 1000 : 0
  const r = a.recognition
  const list = a.questions.filter((q) => (filter === 'wrong' ? q.correct === false : filter === 'blank' ? !q.selectedId : true))

  const act = (fn: () => ReturnType<typeof runAction>) => {
    if (busy) return
    setBusy(true)
    const res = toastResult(fn())
    if (res.ok && res.id) router.push(`/play/${res.id}`)
    else setBusy(false)
  }
  const reviewSet = () => act(() => runAction(startReview, a.id, a.questions.map((q) => q.questionId), nowIso()))
  const reviewOne = (qid: string) => act(() => runAction(startReview, a.id, [qid], nowIso()))
  const again = () => act(() => runAction(startSameConditions, a.id, nowIso()))

  const summary = `${attemptTitle(a)}の結果。${a.mode === 'test' ? `得点${correct}点、40点満点。${passed ? '合格' : '不合格'}。` : `${total}問中${correct}問正解。`}${r?.promoted ? `${LEVEL_LABEL[r.levelAfter]}に昇格しました。` : ''}`

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="sr-only" role="status">
        {summary}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(a.startedAt)} 開始 ・ {settingsText(a)}
          </p>
          <h1 className="text-xl font-bold md:text-2xl">{attemptTitle(a)}の結果</h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={cn('rounded-md border px-2 py-0.5 text-xs font-bold', a.status === 'timed_out' ? 'border-warning/40 bg-warning-soft text-warning' : 'bg-muted')}>{STATUS_META[a.status].label}</span>
          {a.finishReason && <span className="rounded-md border bg-card px-2 py-0.5 text-xs">{FINISH_LABEL[a.finishReason]}</span>}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="得点の概要">
        <div className={cn('col-span-2 rounded-lg border p-4 md:col-span-1', passed === true && 'border-success/40 bg-success-soft', passed === false && 'bg-card', passed === null && 'bg-card')}>
          <p className="text-xs text-muted-foreground">{a.mode === 'test' ? '得点' : '正解数'}</p>
          <p className="tabular text-3xl font-bold">
            {correct}
            <span className="text-lg text-muted-foreground"> / {total}</span>
          </p>
          {passed !== null && <p className={cn('mt-1 text-sm font-bold', passed ? 'text-success' : 'text-foreground')}>{passed ? '合格（32問以上正解）' : `不合格（合格まであと${PASS_SCORE - correct}問）`}</p>}
        </div>
        {[
          ['回答', `${answered}問`],
          ['未回答', `${blank}問`],
          ['所要時間', formatDuration(duration)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="tabular text-2xl font-bold">{v}</p>
          </div>
        ))}
      </section>
      <p className="tabular text-sm text-muted-foreground">
        得点率 {formatRate(correct / total)}（正解数÷出題数）・回答済み正答率 {answered ? formatRate(correct / answered) : '算出不可（回答なし）'}（正解数÷回答数）・不正解 {answered - correct}問
      </p>

      {a.mode === 'test' &&
        (r ? (
          <section className={cn('flex flex-col gap-2 rounded-lg border p-4', r.promoted ? 'border-brand bg-info-soft' : 'bg-card')} aria-label="認定">
            {r.promoted ? (
              <p className="flex items-center gap-2 text-lg font-bold">
                <PartyPopper className="size-5 text-brand" aria-hidden />
                {LEVEL_LABEL[r.levelAfter]}に昇格しました！
              </p>
            ) : r.testType === 'star' ? (
              <p className="flex flex-wrap items-center gap-2 font-bold">
                <Sparkles className="size-4 text-brand" aria-hidden />
                専門家テスト 累計合格 {r.expertPassesAfter}回
                <Stars passes={r.expertPassesAfter} />
                {starInfo(r.expertPassesAfter).k > starInfo(r.expertPassesBefore).k && <span className="text-success">星が増えました</span>}
              </p>
            ) : (
              <p className="font-bold">
                {TEST_LABEL[r.testType]}の合格 {r.passesAfter} / {PASSES_TO_PROMOTE}回{r.passed ? '（今回の合格を加算）' : '（今回は加算なし・合格回数は減りません）'}
              </p>
            )}
            {r.testType === 'star' && <p className="text-sm text-muted-foreground">次の星の表示まであと{starInfo(r.expertPassesAfter).toNext}回の合格</p>}
            {r.promoted && <p className="text-sm">次は{TEST_LABEL[r.levelAfter === 4 ? 'star' : r.levelAfter === 3 ? 'to4' : 'to3']}に挑戦できます。合格回数は0から数えます。</p>}
          </section>
        ) : a.certifying ? (
          <Notice tone="warning">受験中にレベルが変わったため、この回は認定に加算されていません。</Notice>
        ) : (
          <Notice tone="info" title="ゲストとして受験した結果です">
            合否は確認できますが、合格・昇格・星には反映されません。後からログインしても認定には反映されません。
          </Notice>
        ))}
      {a.kind === 'review' && <Notice tone="info">復習の結果は、昇格・星や問題の正答率（基本集計）には反映されません。</Notice>}

      <div className="flex flex-wrap gap-2">
        {a.kind === 'normal' ? (
          <Button size="lg" className="h-11 md:h-10" onClick={again} disabled={busy}>
            <RotateCcw aria-hidden />
            同じ条件で新しく挑戦
          </Button>
        ) : null}
        {user ? (
          <Button size="lg" variant="outline" className="h-11 md:h-10" onClick={reviewSet} disabled={busy}>
            {a.kind === 'review' ? 'もう一度復習する' : 'この問題セットを練習し直す'}
          </Button>
        ) : null}
        <Link href="/history" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-11 md:h-10' })}>
          <History aria-hidden />
          学習履歴
        </Link>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        「新しく挑戦」は現在の問題から新しいセットを作ります（通常集計・受験資格に従う）。「練習し直す」は同じ問題で復習します（別集計）。
        {!user && ' 復習・学習履歴はログイン利用者向けの機能です。'}
      </p>

      <section aria-labelledby="review-h" className="flex flex-col gap-3">
        <h2 id="review-h" className="text-lg font-bold">
          問題と解説
        </h2>
        <Tabs
          label="表示する問題"
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'すべて', count: total },
            { value: 'wrong', label: '不正解', count: answered - correct },
            { value: 'blank', label: '未回答', count: blank },
          ]}
        />
        {list.length === 0 && <EmptyState title="該当する問題はありません" />}
        <ol className="flex flex-col gap-3">
          {list.map((aq) => {
            const v = findVersion(s, aq.questionId, aq.versionId)!
            const q = s.questions.find((x) => x.id === aq.questionId)!
            const changed = q.currentVersionId !== aq.versionId
            return (
              <li key={aq.order} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">問題 {aq.order + 1}</span>
                  <Verdict correct={aq.correct} />
                  <span className="tabular text-xs text-muted-foreground">No.{q.no}</span>
                  <CategoryBadge c={aq.category} />
                  <DifficultyBadge d={aq.difficultyAtStart} prefix="出題時 " />
                </div>
                <p className="leading-relaxed font-bold">{v.text}</p>
                <AnsweredChoices choices={aq.choiceOrder.map((cid) => v.choices.find((c) => c.id === cid)!)} correctId={v.correctId} selectedId={aq.selectedId} />
                <Explanation v={v} />
                {changed && <p className="text-xs text-warning">この問題はその後修正されています。表示は出題時の版です。</p>}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <ReportButton questionId={q.id} versionId={v.versionId} attemptId={a.id} no={q.no} />
                  {user && (
                    <Button variant="outline" size="sm" onClick={() => reviewOne(q.id)} disabled={busy}>
                      この問題を練習し直す
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
