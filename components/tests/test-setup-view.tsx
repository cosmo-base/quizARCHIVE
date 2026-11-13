'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PageContainer, PageHeading, PageSkeleton, SurfaceCard } from '@/components/shell/page'
import { CompositionBar } from '@/components/quiz/composition-bar'
import { LevelProgressSummary } from '@/components/quiz/level-progress'
import { ResumeBanner } from '@/components/quiz/resume-banner'
import { testCompositions } from '@/lib/config'
import { testKindLabel, testKindTarget } from '@/lib/labels'
import { eligibleTestKind } from '@/lib/recognition'
import { actions, currentUser, useAppState } from '@/lib/store'
import type { Question, TestKind } from '@/lib/types'

export function TestSetupView() {
  const state = useAppState()
  const router = useRouter()
  const [guestPrompt, setGuestPrompt] = useState(false)
  const [prepared, setPrepared] = useState<{ kind: TestKind; questions: Question[]; adjusted: boolean } | null>(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  if (!state) return <PageSkeleton />
  const user = currentUser(state)
  const prepare = (kind: TestKind) => {
    setError('')
    const result = actions.prepareTest(kind)
    if (!result.ok) { setError(result.message); return }
    setPrepared({ kind, questions: result.questions, adjusted: result.adjusted })
    if (!user) setGuestPrompt(true)
  }
  const start = () => {
    if (!prepared || starting) return
    setStarting(true)
    const result = actions.startTest(prepared.kind, prepared.questions, prepared)
    if (result.ok) router.push(`/attempts/${result.attemptId}`)
    else { setError(result.message); setStarting(false); setPrepared(null) }
  }
  return <PageContainer>
    <PageHeading title="テストに挑戦" description="学んだことを確かめて、次のレベルへ。一歩ずつ、宇宙に詳しくなろう。" />
    <ResumeBanner state={state} mode="test" />
    <SurfaceCard className="flex flex-col gap-5">
      <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5 text-primary" aria-hidden="true" />テストのルール</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{['40問', '60分', '32問以上で合格', '累計3回で昇格'].map(t => <p key={t} className="rounded-xl bg-muted p-4 text-center font-bold">{t}</p>)}</div>
      <p className="text-sm text-muted-foreground">何度でも挑戦できます。受験間隔の制限はなく、調べながら解いても大丈夫です。不合格でも合格回数はリセットされません。</p>
      {user ? <LevelProgressSummary user={user} /> : <p className="text-sm">ゲストでの挑戦は、今回は認定対象外です。</p>}
    </SurfaceCard>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="grid gap-5 md:grid-cols-2">{(Object.keys(testKindLabel) as TestKind[]).map(kind => {
      const allowed = !user || eligibleTestKind(user.level) === kind
      return <SurfaceCard key={kind} className="flex flex-col gap-5">
        <div><p className="text-sm text-primary">{testKindTarget[kind]}</p><h2 className="text-xl font-bold">{testKindLabel[kind]}</h2></div>
        <p className="text-sm text-muted-foreground">{kind === 'expertStars' ? '3回合格ごとに星が進みます。' : '累計3回の合格で、次のレベルに昇格します。'}</p>
        <div className="flex flex-col gap-3"><h3 className="text-sm font-bold">基準の問題難易度構成</h3><CompositionBar composition={testCompositions[kind]} /></div>
        <Button className="h-12" disabled={!allowed} onClick={() => prepare(kind)}>{allowed ? '開始前の確認へ' : '現在の資格では受験できません'}<ArrowRight data-icon="inline-end" /></Button>
      </SurfaceCard>
    })}</div>
    <p className="text-sm text-muted-foreground">分野を均等に出題するため、問題の難易度構成が調整されることがあります。</p>
    <Dialog open={guestPrompt} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <div className="flex items-start justify-between gap-3"><DialogTitle>ログインして挑戦を記録しませんか？</DialogTitle><Button variant="ghost" size="icon-lg" aria-label="ログインせずに進む" onClick={() => setGuestPrompt(false)}><X /></Button></div>
        <DialogDescription>ログインすると、合格実績・レベル・星を保存できます。</DialogDescription>
        <p className="text-sm leading-relaxed">ログインせずに受けたテストは、後からログインしても認定実績に反映されません。</p>
        <p className="text-sm text-muted-foreground">デモユーザーでログインします。個人情報の入力は不要です。</p>
        <Button className="h-12" onClick={() => { actions.login(); setGuestPrompt(false); setPrepared(null); setError('ログインしました。現在の資格に合ったテストを選んでください。') }}>ログインする</Button>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(prepared) && !guestPrompt} onOpenChange={open => { if (!open && !starting) setPrepared(null) }}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{prepared ? testKindLabel[prepared.kind] : '開始前の確認'}</DialogTitle>
        <DialogDescription>40問・60分。開始後は回答を変更できます。答え合わせは最後にまとめて行います。</DialogDescription>
        {prepared?.adjusted && <p className="rounded-lg bg-muted p-3">分野を均等にするため、問題難易度の構成を調整しました。</p>}
        <p>{user ? '今回のテストは認定対象です。' : '今回は認定対象外です。'}</p>
        <Button className="h-12" disabled={starting} onClick={start}>{starting ? '開始しています…' : 'テストを開始'}</Button>
      </DialogContent>
    </Dialog>
  </PageContainer>
}
