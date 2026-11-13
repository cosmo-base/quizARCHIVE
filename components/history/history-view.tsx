'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageContainer, PageHeading, PageSkeleton, SurfaceCard } from '@/components/shell/page'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/link-button'
import { DemoLoginDialog } from '@/components/quiz/demo-login-dialog'
import { QuestionMeta } from '@/components/quiz/question-meta'
import { AttemptOutcome } from './attempt-outcome'
import { actions, currentUser, getAllQuestions, useAppState } from '@/lib/store'
import { ownedAttempts, solvedQuestions, attemptSettingsSummary } from '@/lib/selectors'
import { attemptTitle, statusLabel } from '@/lib/labels'
import { formatDateTime, formatDuration } from '@/lib/time'
import { routes } from '@/lib/routes'

export function HistoryView({ questions = false }: { questions?: boolean }) {
  const state = useAppState()
  const [login, setLogin] = useState(false)
  const [mode, setMode] = useState('all')
  const [status, setStatus] = useState('all')
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  if (!state) return <PageSkeleton />
  /** 解いた問題の一覧から、その1問を練習し直す（復習・別集計） */
  const review = (questionId: string, sourceAttemptId?: string) => {
    if (starting) return
    setStarting(true)
    setError('')
    const result = actions.startReview(sourceAttemptId ?? null, [questionId])
    if (result.ok) router.push(routes.attempt(result.attemptId))
    else { setError(result.message); setStarting(false) }
  }
  const user = currentUser(state)
  const attempts = ownedAttempts(state).filter(a => (mode === 'all' || a.mode === mode) && (status === 'all' || a.status === status))
  const solved = solvedQuestions(state)
  const all = getAllQuestions(state)
  return <PageContainer><PageHeading title="学習履歴" description="これまでの挑戦を振り返って、次の学びにつなげよう。" />
    {!user ? <SurfaceCard className="flex flex-col items-start gap-4"><h2 className="text-xl font-bold">学びの記録を残しませんか？</h2><p>ログインすると、学習履歴・合格実績・レベル・星を保存できます。</p><Button className="h-12" onClick={() => setLogin(true)}>デモログイン</Button></SurfaceCard> : <>
      <nav className="flex gap-3" aria-label="履歴の種類"><LinkButton variant={questions ? 'outline' : 'default'} href="/history" className="h-12">実施履歴</LinkButton><LinkButton variant={questions ? 'default' : 'outline'} href="/history/questions" className="h-12">解いた問題</LinkButton></nav>
      {questions ? <div className="flex flex-col gap-4">{error && <p role="alert" className="text-destructive">{error}</p>}<p className="text-sm text-muted-foreground">「練習し直す」は復習として別に集計され、正答率・昇格には含まれません。</p>{solved.length === 0 ? <EmptyHistory /> : solved.map(row => {
        const q = all.find(q => q.id === row.questionId)
        if (!q) return null
        return <SurfaceCard key={q.id} className="flex flex-col gap-3"><QuestionMeta questionId={q.id} fieldId={q.fieldId} difficulty={q.difficulty} accuracy={q.displayAccuracy} /><Link href={routes.question(q.id)} className="font-bold hover:text-primary hover:underline">{q.text}</Link><p className="text-sm text-muted-foreground">前回：{row.lastCorrect ? '正解' : '不正解'} ／ 回答回数：{row.count}回 ／ {formatDateTime(row.lastAt)}</p><div className="flex flex-wrap gap-3">{row.lastAttemptId && <LinkButton href={routes.result(row.lastAttemptId)} variant="outline" className="h-11">該当の回を見る</LinkButton>}<Button variant="outline" className="h-11" disabled={starting} onClick={() => review(q.id, row.lastAttemptId)}>この問題を練習し直す</Button></div></SurfaceCard>
      })}</div> : <>
        <div className="flex flex-wrap gap-3"><label className="flex items-center gap-2 text-sm">種別<select className="h-11 rounded-lg border bg-card px-3" value={mode} onChange={e => setMode(e.target.value)}><option value="all">すべて</option><option value="practice">練習</option><option value="test">テスト</option><option value="review">復習</option></select></label><label className="flex items-center gap-2 text-sm">終了状態<select className="h-11 rounded-lg border bg-card px-3" value={status} onChange={e => setStatus(e.target.value)}><option value="all">すべて</option><option value="inProgress">回答中</option><option value="completed">終了</option><option value="timedOut">時間切れ</option></select></label></div>
        {attempts.length === 0 ? <EmptyHistory /> : <div className="overflow-hidden rounded-2xl border bg-card"><div className="hidden grid-cols-[1fr_2fr_1fr_1fr] gap-4 border-b bg-muted px-6 py-3 text-sm font-bold md:grid"><span>日時・結果</span><span>実施内容</span><span>回答・得点</span><span>所要時間・状態</span></div>{attempts.map(a => <Link key={a.id} href={a.finalized ? routes.result(a.id) : routes.attempt(a.id)} className="flex flex-col gap-3 border-b p-5 last:border-0 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary md:grid md:grid-cols-[1fr_2fr_1fr_1fr] md:gap-4 md:p-6"><div className="flex flex-wrap items-start gap-2 md:flex-col"><time className="text-sm">{formatDateTime(a.startedAt)}</time><AttemptOutcome attempt={a} /></div><div><h2 className="font-bold">{attemptTitle(a.mode, a.testKind)}</h2><p className="text-sm text-muted-foreground">{attemptSettingsSummary(a)}</p></div><div className="text-sm"><p className="font-bold">{a.analytics ? `${a.analytics.correctCount}／${a.analytics.totalCount}点` : '途中保存'}</p><p>{a.analytics ? `回答${a.analytics.answeredCount}問・未回答${a.analytics.unansweredCount}問` : `${Object.values(a.answers).filter(Boolean).length}問回答済み`}</p></div><div className="text-sm"><p>{a.analytics ? formatDuration(a.analytics.durationSec) : '—'}</p><p className="text-muted-foreground">{statusLabel[a.status]}</p></div></Link>)}</div>}
      </>}
    </>}
    <DemoLoginDialog open={login} onOpenChange={setLogin} />
  </PageContainer>
}
function EmptyHistory() { return <SurfaceCard className="flex flex-col items-start gap-4"><h2 className="font-bold">表示できる学習履歴はありません</h2><p className="text-muted-foreground">条件を変更するか、最初の練習を始めましょう。</p><LinkButton href="/practice">練習する</LinkButton></SurfaceCard> }
