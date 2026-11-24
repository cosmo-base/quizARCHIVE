'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ChevronLeft, ChevronRight, Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PageContainer, PageSkeleton, SurfaceCard } from '@/components/shell/page'
import { ChoiceList } from '@/components/quiz/choice-list'
import { QuestionMeta } from '@/components/quiz/question-meta'
import { TimeSensitiveNote } from '@/components/quiz/time-sensitive-note'
import { LinkButton } from '@/components/link-button'
import { useIdFromQuery } from '@/components/id-from-query'
import { api } from '@/lib/api/client'
import { finishAttempt, refreshUserState, useAttempt } from '@/lib/api/hooks'
import { ApiError, type AttemptDetail } from '@/lib/api/types'
import { attemptTitle } from '@/lib/labels'
import { routes } from '@/lib/routes'
import { formatClock } from '@/lib/time'
import { cn } from '@/lib/utils'

export function AttemptViewFromQuery() {
  return <AttemptView id={useIdFromQuery()} />
}

export function AttemptView({ id }: { id: string }) {
  const router = useRouter()
  const { data: attempt, error, mutate } = useAttempt(id)
  useEffect(() => {
    if (!attempt?.finalized) return
    // 開いたときに時間切れで確定した回もあるため、レベル・履歴を取り直してから結果へ
    void refreshUserState()
    router.replace(routes.result(attempt.id))
  }, [attempt?.finalized, attempt?.id, router])

  if (error instanceof ApiError && error.code === 'FORBIDDEN') {
    return <PageContainer><h1>この回は表示できません</h1><p>別の利用者の回です。成績・履歴は本人のみに表示されます。</p><LinkButton href="/">ホームへ</LinkButton></PageContainer>
  }
  if (error instanceof ApiError && error.code === 'NOT_FOUND') {
    return <PageContainer><h1>この回が見つかりません</h1><LinkButton href="/">ホームへ</LinkButton></PageContainer>
  }
  if (error && !attempt) {
    return (
      <PageContainer>
        <h1>回を読み込めませんでした</h1>
        <p>通信状況を確認して、もう一度お試しください。回答は保存済みの内容から再開できます。</p>
        <Button variant="outline" className="h-11 self-start" onClick={() => mutate()}><RefreshCw data-icon="inline-start" />再読み込み</Button>
      </PageContainer>
    )
  }
  if (!attempt || attempt.finalized) return <PageSkeleton />
  return <ActiveAttempt key={id} attempt={attempt} />
}

type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

function ActiveAttempt({ attempt }: { attempt: AttemptDetail }) {
  const router = useRouter()
  const [answers, setAnswers] = useState(attempt.answers)
  const answersRef = useRef(answers)
  const seqRef = useRef(attempt.savedSeq)
  const [index, setIndex] = useState(attempt.currentIndex)
  const [now, setNow] = useState(Date.now())
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [finishError, setFinishError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [panel, setPanel] = useState(false)
  const finishing = useRef(false)
  const [grading, setGrading] = useState(false)
  const deadline = attempt.deadlineAt ? new Date(attempt.deadlineAt).getTime() : null

  /** 終了の確定。期限を過ぎていれば、サーバーが期限時点の保存内容で採点する */
  const finish = () => {
    if (finishing.current) return
    finishing.current = true
    setGrading(true)
    setFinishError('')
    // 採点結果を一時保存に入れてから移る（結果の画面が採点前のデータを読んで、回答中の画面へ戻すのを防ぐ）
    finishAttempt({ attemptId: attempt.id, answers: answersRef.current, seq: ++seqRef.current })
      .then(() => router.replace(routes.result(attempt.id)))
      .catch((e: Error) => {
        finishing.current = false
        setGrading(false)
        setFinishError(e.message || '終了できませんでした。もう一度お試しください。')
      })
  }

  useEffect(() => {
    const tick = () => {
      setNow(Date.now())
      if (deadline !== null && Date.now() >= deadline) finish()
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.id, deadline])

  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    const back = () => { if (!finishing.current) { window.history.pushState(null, '', window.location.href); setConfirm(true) } }
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('beforeunload', unload)
    window.addEventListener('popstate', back)
    return () => { window.removeEventListener('beforeunload', unload); window.removeEventListener('popstate', back) }
  }, [])

  /** 回答の保存。古い送信で新しい選択を上書きしないよう、送るたびに番号を増やす */
  const save = (changed: Record<string, string | null>, currentIndex?: number) => {
    const seq = ++seqRef.current
    if (Object.keys(changed).length > 0) setSaveState('saving')
    api
      .attemptsSave({ attemptId: attempt.id, answers: changed, seq, currentIndex })
      .then(() => { if (seq === seqRef.current && Object.keys(changed).length > 0) setSaveState('saved') })
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.code === 'DEADLINE_PASSED') { finish(); return }
        if (Object.keys(changed).length > 0) setSaveState('failed')
      })
  }
  const resendAll = () => save(answersRef.current, index)

  const choose = (choice: string) => {
    if (finishing.current) return
    if (deadline !== null && Date.now() >= deadline) { finish(); return }
    const qid = attempt.questions[index].id
    const next = { ...answersRef.current, [qid]: choice }
    answersRef.current = next
    setAnswers(next)
    // 未保存が残っているときは、全体をまとめて送り直す
    save(saveState === 'failed' ? next : { [qid]: choice }, index)
  }
  const go = (next: number) => {
    setIndex(next)
    setPanel(false)
    save({}, next)
  }

  const q = attempt.questions[index]
  if (!q) return <PageSkeleton />
  const total = attempt.questions.length
  const answered = Object.values(answers).filter(Boolean).length
  const seconds = deadline !== null ? Math.ceil((deadline - now) / 1000) : (now - new Date(attempt.startedAt).getTime()) / 1000
  const warning = deadline !== null && seconds <= 60 ? '残り1分です。' : deadline !== null && seconds <= 300 ? '残り5分です。' : ''
  const statusText = grading ? '採点しています…' : saveState === 'failed' ? '未保存の回答があります' : saveState === 'saving' ? '回答を保存しています…' : answered > 0 ? '回答を保存しました' : ''
  const numbers = <div className="flex flex-col gap-4"><p className="text-sm">回答済み {answered}／{total}問</p><div className="grid grid-cols-5 gap-2">{attempt.questions.map((x, i) => <Button key={x.id} variant={answers[x.id] ? 'default' : 'outline'} className={cn('h-11 min-w-0', index === i && 'ring-2 ring-primary ring-offset-2 ring-offset-card')} aria-current={index === i ? 'step' : undefined} aria-label={`問題${i + 1} ${answers[x.id] ? '回答済み' : '未回答'}`} onClick={() => go(i)}>{i + 1}</Button>)}</div><p className="text-sm text-muted-foreground">濃い色：回答済み／二重の枠：表示中の問題</p></div>
  return <div className="min-h-dvh pb-[calc(6rem+env(safe-area-inset-bottom))]">
    <header className="border-b bg-card"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4"><button onClick={() => setConfirm(true)} className="min-h-11 text-left font-bold focus-visible:outline-2 focus-visible:outline-primary">Cosmo Base <span className="text-sm font-normal">宇宙クイズ</span></button><div className="flex items-center gap-3"><span className="text-sm">{attemptTitle(attempt.mode, attempt.testKind)}</span><Button variant="outline" className="h-11" onClick={() => setConfirm(true)}>終了する</Button></div></div></header>
    <main><PageContainer>
      {attempt.mode === 'test' && attempt.adjusted && (
        <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />分野を均等にするため、問題難易度の構成を調整しました。合格条件（40問中32問以上）は変わりません。</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">問題 {index + 1} <span className="font-normal text-muted-foreground">／{total}</span></p><div className="flex items-center gap-2"><Clock className="size-4" aria-hidden="true" /><span className="text-sm">{deadline !== null ? '残り時間' : '経過時間'}</span><span className="font-mono text-xl tabular-nums">{formatClock(seconds)}</span></div></div>
      <p role="status" className="text-sm text-muted-foreground">{statusText}{saveState === 'failed' && <Button variant="link" onClick={resendAll}>再試行</Button>}</p>
      <p role="status" className="text-sm text-destructive">{warning}</p>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]">
        <SurfaceCard className="flex min-w-0 flex-col gap-6"><QuestionMeta questionId={q.id} fieldId={q.fieldId} difficulty={q.difficulty} accuracy={q.displayAccuracy} /><h1 className="text-xl font-bold leading-relaxed text-pretty md:text-2xl">{q.text}</h1><TimeSensitiveNote postedOn={q.postedOn} timeSensitive={q.timeSensitive} className="-mt-3" /><ChoiceList name={`attempt-${q.id}`} legend="回答を選択" choices={q.choices} value={answers[q.id] ?? null} onChange={choose} /><p className="text-sm text-muted-foreground">回答は終了するまで変更できます。答え合わせは最後にまとめて行います。</p></SurfaceCard>
        <SurfaceCard className="hidden lg:block">{numbers}</SurfaceCard>
      </div>
      <Button variant="outline" className="h-12 lg:hidden" onClick={() => setPanel(true)}>回答状況（{answered}／{total}問）</Button>
    </PageContainer></main>
    <nav aria-label="問題の移動" className="fixed inset-x-0 bottom-0 border-t bg-card px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom))]"><div className="mx-auto flex max-w-6xl justify-between gap-3"><Button variant="outline" className="h-12" disabled={index === 0} onClick={() => go(index - 1)}><ChevronLeft data-icon="inline-start" />前の問題</Button><Button className="h-12" onClick={() => index === total - 1 ? setConfirm(true) : go(index + 1)}>{index === total - 1 ? '回答を確認' : '次の問題'}<ChevronRight data-icon="inline-end" /></Button></div></nav>
    <Sheet open={panel} onOpenChange={setPanel}><SheetContent><SheetHeader><SheetTitle>回答状況</SheetTitle></SheetHeader><div className="overflow-y-auto p-4">{numbers}</div></SheetContent></Sheet>
    <Dialog open={confirm} onOpenChange={(o) => { if (!grading) setConfirm(o) }}><DialogContent><DialogTitle>回答を終了しますか？</DialogTitle><DialogDescription>回答済み{answered}問／未回答{total - answered}問。未回答の問題は0点となります。終了後は回答を変更できません。</DialogDescription><p className="text-sm">確認中も時間は進みます。</p>{finishError && <p role="alert" className="text-sm text-destructive">{finishError}</p>}<Button variant="outline" className="h-12" disabled={grading} onClick={() => setConfirm(false)}>回答を見直す</Button><Button className="h-12" disabled={grading} onClick={() => finish()}>{grading ? '採点しています…' : '終了して結果を見る'}</Button></DialogContent></Dialog>
  </div>
}
