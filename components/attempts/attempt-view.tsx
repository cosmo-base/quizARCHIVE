'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PageContainer, PageSkeleton, SurfaceCard } from '@/components/shell/page'
import { ChoiceList } from '@/components/quiz/choice-list'
import { QuestionMeta } from '@/components/quiz/question-meta'
import { LinkButton } from '@/components/link-button'
import { actions, isOwnAttempt, useAppState } from '@/lib/store'
import { resolveSnapshot } from '@/lib/stats'
import { attemptTitle } from '@/lib/labels'
import { formatClock } from '@/lib/time'
import type { Attempt } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useIdFromQuery } from '@/components/id-from-query'
import { routes } from '@/lib/routes'

export function AttemptViewFromQuery() {
  return <AttemptView id={useIdFromQuery()} />
}

export function AttemptView({ id }: { id: string }) {
  const state = useAppState()
  if (!state) return <PageSkeleton />
  const attempt = state.attempts[id]
  if (!attempt) return <PageContainer><h1>この回が見つかりません</h1><LinkButton href="/">ホームへ</LinkButton></PageContainer>
  if (!isOwnAttempt(state, attempt)) return <PageContainer><h1>この回は表示できません</h1><p>別の利用者の回です。成績・履歴は本人のみに表示されます。</p><LinkButton href="/">ホームへ</LinkButton></PageContainer>
  return <ActiveAttempt key={id} attempt={attempt} />
}

function ActiveAttempt({ attempt }: { attempt: Attempt }) {
  const router = useRouter()
  const [answers, setAnswers] = useState(attempt.answers)
  const answersRef = useRef(answers)
  const [index, setIndex] = useState(attempt.currentIndex)
  const [now, setNow] = useState(Date.now())
  const [unsaved, setUnsaved] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [panel, setPanel] = useState(false)
  const finishing = useRef(false)
  const active = !attempt.finalized
  const finish = (timedOut = false) => {
    if (finishing.current) return
    finishing.current = true
    actions.finalizeAttempt(attempt.id, timedOut ? 'timedOut' : 'completed', answersRef.current)
    router.replace(routes.result(attempt.id))
  }
  useEffect(() => {
    if (attempt.finalized) { router.replace(routes.result(attempt.id)); return }
    const tick = () => {
      setNow(Date.now())
      if (attempt.deadlineAt && Date.now() >= new Date(attempt.deadlineAt).getTime() && !finishing.current) {
        finishing.current = true
        actions.finalizeAttempt(attempt.id, 'timedOut', answersRef.current)
        router.replace(routes.result(attempt.id))
      }
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [attempt.id, attempt.finalized, attempt.deadlineAt, router])
  useEffect(() => {
    if (!active) return
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    const back = () => { if (!finishing.current) { window.history.pushState(null, '', window.location.href); setConfirm(true) } }
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('beforeunload', unload)
    window.addEventListener('popstate', back)
    return () => { window.removeEventListener('beforeunload', unload); window.removeEventListener('popstate', back) }
  }, [active])
  const save = (next: Record<string, string | null>) => {
    try { actions.saveAnswers(attempt.id, next); setUnsaved(false) } catch { setUnsaved(true) }
  }
  const choose = (choice: string) => {
    if (!active || finishing.current) return
    if (attempt.deadlineAt && Date.now() >= new Date(attempt.deadlineAt).getTime()) { finish(true); return }
    const next = { ...answersRef.current, [attempt.questionSnapshots[index].questionId]: choice }
    answersRef.current = next
    setAnswers(next)
    save(next)
  }
  const go = (next: number) => { setIndex(next); actions.setCurrentIndex(attempt.id, next); setPanel(false) }
  const snap = attempt.questionSnapshots[index]
  const content = resolveSnapshot(snap)
  if (!content || !active) return <PageSkeleton />
  const total = attempt.questionSnapshots.length
  const answered = Object.values(answers).filter(Boolean).length
  const seconds = attempt.deadlineAt ? Math.ceil((new Date(attempt.deadlineAt).getTime() - now) / 1000) : (now - new Date(attempt.startedAt).getTime()) / 1000
  const warning = attempt.deadlineAt && seconds <= 60 ? '残り1分です。' : attempt.deadlineAt && seconds <= 300 ? '残り5分です。' : ''
  const numbers = <div className="flex flex-col gap-4"><p className="text-sm">回答済み {answered}／{total}問</p><div className="grid grid-cols-5 gap-2">{attempt.questionSnapshots.map((q, i) => <Button key={q.questionId} variant={answers[q.questionId] ? 'secondary' : 'outline'} className={cn('h-11 min-w-0', index === i && 'ring-2 ring-primary')} aria-current={index === i ? 'step' : undefined} aria-label={`問題${i + 1} ${answers[q.questionId] ? '回答済み' : '未回答'}`} onClick={() => go(i)}>{i + 1}</Button>)}</div><p className="text-sm text-muted-foreground">枠線：現在の問題／塗り：回答済み</p></div>
  return <div className="min-h-dvh pb-[calc(6rem+env(safe-area-inset-bottom))]">
    <header className="border-b bg-card"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4"><button onClick={() => setConfirm(true)} className="min-h-11 text-left font-bold focus-visible:outline-2 focus-visible:outline-primary">Cosmo Base <span className="text-sm font-normal">宇宙クイズ</span></button><div className="flex items-center gap-3"><span className="text-sm">{attemptTitle(attempt.mode, attempt.testKind)}</span><Button variant="outline" className="h-11" onClick={() => setConfirm(true)}>終了する</Button></div></div></header>
    <main><PageContainer>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">問題 {index + 1} <span className="font-normal text-muted-foreground">／{total}</span></p><div className="flex items-center gap-2"><Clock className="size-4" aria-hidden="true" /><span className="text-sm">{attempt.deadlineAt ? '残り時間' : '経過時間'}</span><span className="font-mono text-xl tabular-nums">{formatClock(seconds)}</span></div></div>
      <p role="status" className="text-sm text-muted-foreground">{unsaved ? '未保存の回答があります' : answered > 0 ? '回答を保存しました' : ''}{unsaved && <Button variant="link" onClick={() => save(answersRef.current)}>再試行</Button>}</p>
      <p role="status" className="text-sm text-destructive">{warning}</p>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]">
        <SurfaceCard className="flex min-w-0 flex-col gap-6"><QuestionMeta questionId={snap.questionId} fieldId={snap.fieldId} difficulty={snap.difficulty} accuracy={snap.displayAccuracy} /><h1 className="text-xl font-bold leading-relaxed text-pretty md:text-2xl">{content.text}</h1><ChoiceList name={`attempt-${snap.questionId}`} legend="回答を選択" choices={content.choices} value={answers[snap.questionId] ?? null} onChange={choose} /><p className="text-sm text-muted-foreground">回答は終了するまで変更できます。答え合わせは最後にまとめて行います。</p></SurfaceCard>
        <SurfaceCard className="hidden lg:block">{numbers}</SurfaceCard>
      </div>
      <Button variant="outline" className="h-12 lg:hidden" onClick={() => setPanel(true)}>回答状況（{answered}／{total}問）</Button>
    </PageContainer></main>
    <nav aria-label="問題の移動" className="fixed inset-x-0 bottom-0 border-t bg-card px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom))]"><div className="mx-auto flex max-w-6xl justify-between gap-3"><Button variant="outline" className="h-12" disabled={index === 0} onClick={() => go(index - 1)}><ChevronLeft data-icon="inline-start" />前の問題</Button><Button className="h-12" onClick={() => index === total - 1 ? setConfirm(true) : go(index + 1)}>{index === total - 1 ? '回答を確認' : '次の問題'}<ChevronRight data-icon="inline-end" /></Button></div></nav>
    <Sheet open={panel} onOpenChange={setPanel}><SheetContent><SheetHeader><SheetTitle>回答状況</SheetTitle></SheetHeader><div className="overflow-y-auto p-4">{numbers}</div></SheetContent></Sheet>
    <Dialog open={confirm} onOpenChange={setConfirm}><DialogContent><DialogTitle>回答を終了しますか？</DialogTitle><DialogDescription>回答済み{answered}問／未回答{total - answered}問。未回答の問題は0点となります。終了後は回答を変更できません。</DialogDescription><p className="text-sm">確認中も時間は進みます。</p><Button variant="outline" className="h-12" onClick={() => setConfirm(false)}>回答を見直す</Button><Button className="h-12" onClick={() => finish()}>終了して結果を見る</Button></DialogContent></Dialog>
  </div>
}
