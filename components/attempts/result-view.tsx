'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { PageContainer, PageHeading, PageSkeleton, SurfaceCard } from '@/components/shell/page'
import { ChoiceList } from '@/components/quiz/choice-list'
import { ExplanationBlock } from '@/components/quiz/explanation-block'
import { ReportDialog } from '@/components/quiz/report-dialog'
import { QuestionMeta } from '@/components/quiz/question-meta'
import { StarRow } from '@/components/quiz/star-row'
import { LinkButton } from '@/components/link-button'
import { actions, useAppState } from '@/lib/store'
import { resolveSnapshot } from '@/lib/stats'
import { isPassed } from '@/lib/scoring'
import { attemptTitle, levelLabel } from '@/lib/labels'
import { formatDuration, formatPercent } from '@/lib/time'

export function ResultView({ id }: { id: string }) {
  const state = useAppState()
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const a = state?.attempts[id]
  useEffect(() => { if (a && !a.finalized) router.replace(`/attempts/${id}`); else if (a) actions.markResultViewed(id) }, [a?.finalized, id, router])
  if (!state) return <PageSkeleton />
  if (!a) return <PageContainer><h1>結果が見つかりません</h1><LinkButton href="/">ホームへ</LinkButton></PageContainer>
  if (!a.analytics) return <PageSkeleton />
  const s = a.analytics
  const title = a.mode === 'test' ? isPassed(a) ? '合格' : '今回は不合格' : a.mode === 'review' ? '復習が完了しました' : '練習が完了しました'
  const begin = (review: boolean) => {
    if (starting) return
    if (!review && a.mode === 'test') { router.push('/tests'); return }
    setStarting(true)
    const result = review ? actions.startReview(id) : actions.startPractice(a.practiceSettings ?? { count: a.questionSnapshots.length, fieldIds: [...new Set(a.questionSnapshots.map(q => q.fieldId))], difficulties: [], timeLimitMinutes: null })
    if (result.ok) router.push(`/attempts/${result.attemptId}`)
    else { setError(result.message); setStarting(false) }
  }
  return <PageContainer>
    <PageHeading title="結果と解説" description={attemptTitle(a.mode, a.testKind)} />
    <SurfaceCard className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-2xl font-bold" aria-live="polite">{title}</h2>
      {a.status === 'timedOut' && <p className="rounded-lg bg-muted px-3 py-1 text-sm">時間切れで終了しました</p>}
      <p className="text-5xl font-bold text-primary tabular-nums">{s.score}<span className="text-xl text-muted-foreground">／{s.totalCount}点</span></p>
      <p className="font-bold">得点率 {formatPercent(s.scoreRate)}</p>
      <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">{[['回答済み', s.answeredCount], ['正解', s.correctCount], ['誤答', s.wrongCount], ['未回答', s.unansweredCount]].map(([label, n]) => <div key={label} className="rounded-xl bg-muted p-3"><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-bold">{n}<span className="text-sm font-normal">問</span></p></div>)}</div>
      <p className="text-sm text-muted-foreground">回答した問題の正答率：{formatPercent(s.answeredAccuracy)} ／ 所要時間：{formatDuration(s.durationSec)}</p>
      {a.mode === 'review' && <p className="text-sm">この結果は通常の正答率・昇格判定には含まれません。</p>}
      {a.mode === 'test' && !a.recognitionEligible && <p className="text-sm">認定対象外：ログインせずに開始したテストです。</p>}
      {a.recognition?.applied && <div className="flex flex-col items-center gap-2 rounded-xl bg-primary-soft p-4"><p className="font-bold text-primary">{a.recognition.promoted ? `${levelLabel[a.recognition.levelAfter!]}に昇格しました` : '合格実績を記録しました'}</p>{a.recognition.levelAfter === 'expert' && a.recognition.expertPassesAfter !== undefined ? <StarRow expertPasses={a.recognition.expertPassesAfter} /> : <p>累計合格 {a.recognition.progressAfter ?? 0}／3回</p>}</div>}
    </SurfaceCard>
    <div className="flex flex-wrap gap-3"><Button className="h-12" disabled={starting} onClick={() => begin(false)}>同じ条件で新しく挑戦</Button><Button variant="outline" className="h-12" disabled={starting} onClick={() => begin(true)}>この問題を練習し直す</Button><LinkButton href="/history" variant="outline" className="h-12">履歴へ</LinkButton><LinkButton href="/" variant="ghost" className="h-12">ホームへ</LinkButton></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <SurfaceCard className="flex flex-col gap-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">全問の振り返り</h2><label className="flex items-center gap-2 text-sm">表示<select className="h-11 rounded-lg border bg-card px-3" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">すべて</option><option value="correct">正解</option><option value="wrong">不正解</option><option value="unanswered">未回答</option></select></label></div>
      <Accordion multiple>{a.questionSnapshots.map((snap, i) => {
        const q = resolveSnapshot(snap)
        if (!q) return null
        const answer = a.answers[snap.questionId]
        const outcome = !answer ? 'unanswered' : answer === q.correctChoiceId ? 'correct' : 'wrong'
        if (filter !== 'all' && filter !== outcome) return null
        return <AccordionItem key={snap.questionId} value={snap.questionId}><AccordionTrigger><span className="flex flex-col items-start gap-2 text-left"><span className="text-sm text-muted-foreground">問題{i + 1} ・ {outcome === 'correct' ? '正解' : outcome === 'wrong' ? '不正解' : '未回答'}</span><span className="leading-relaxed">{q.text}</span></span></AccordionTrigger><AccordionContent><div className="flex flex-col gap-4"><QuestionMeta questionId={snap.questionId} fieldId={snap.fieldId} difficulty={snap.difficulty} accuracy={snap.displayAccuracy} /><p>あなたの回答：{q.choices.find(c => c.id === answer)?.text ?? '未回答'}</p><ChoiceList name={`result-${snap.questionId}`} legend="選択肢と正解" choices={q.choices} value={answer ?? null} disabled reveal={{ correctChoiceId: q.correctChoiceId }} /><ExplanationBlock explanation={q.explanation} references={q.references} /><ReportDialog questionId={snap.questionId} versionId={snap.versionId} /></div></AccordionContent></AccordionItem>
      })}</Accordion>
    </SurfaceCard>
  </PageContainer>
}
