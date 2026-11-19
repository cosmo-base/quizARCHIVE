'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { api, isMockApi, loginDemo } from '@/lib/api/client'
import { isDiscordLoginReady, startDiscordLogin } from '@/lib/auth/discord'
import { useMe } from '@/lib/api/hooks'
import { useSession } from '@/lib/api/session'
import type { TestKind } from '@/lib/types'
import { routes } from '@/lib/routes'

export function TestSetupView() {
  const session = useSession()
  const { data: me } = useMe()
  const router = useRouter()
  const [guestPrompt, setGuestPrompt] = useState(false)
  /** 開始前の確認で選んでいる種類。問題は「開始」のときにサーバーが選ぶ */
  const [prepared, setPrepared] = useState<{ kind: TestKind } | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)
  const ready = session !== undefined && (!session || me !== undefined)
  const user = session ? (me ?? null) : null
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const params = useSearchParams()
  const autoOpened = useRef(false)
  // 結果画面の「同じ条件で新しく挑戦」から来た場合（?kind=）、その種類の開始前確認を一度だけ開く
  useEffect(() => {
    const kind = params.get('kind') as TestKind | null
    if (!ready || autoOpened.current || !kind || !(kind in testKindLabel)) return
    autoOpened.current = true
    if (user && eligibleTestKind(user.level) !== kind) { setError('現在のレベルでは、このテストは開始できません。受験できるテストを選んでください。'); return }
    prepare(kind)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, params])
  if (!ready) return <PageSkeleton />
  function prepare(kind: TestKind) {
    setError('')
    setPrepared({ kind })
    if (!user) setGuestPrompt(true)
  }
  const start = () => {
    if (!prepared || starting) return
    setStarting(true)
    // 資格の確認・出題・期限の決定はサーバー側で行う
    api
      .attemptsStart({ mode: 'test', testKind: prepared.kind })
      .then((a) => router.push(routes.attempt(a.id)))
      .catch((e: Error) => {
        setError(e.message)
        setStarting(false)
        setPrepared(null)
      })
  }
  return <PageContainer>
    <PageHeading title="テストに挑戦" description="学んだことを確かめて、次のレベルへ。一歩ずつ、宇宙に詳しくなろう。" />
    <ResumeBanner mode="test" />
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
        <p className="text-sm text-muted-foreground">{isMockApi ? 'デモユーザーでログインします。個人情報の入力は不要です。' : 'Cosmo Base の Discord サーバーに参加している人がログインできます。メールアドレスは受け取りません。'}</p>
        <Button
          className="h-12"
          disabled={loggingIn || (!isMockApi && !isDiscordLoginReady)}
          onClick={() => {
            setLoggingIn(true)
            if (!isMockApi) { startDiscordLogin(); return } // Discord へ移動し、ログイン後にこの画面へ戻る
            loginDemo()
              .then(() => { setGuestPrompt(false); setPrepared(null); setError('ログインしました。現在の資格に合ったテストを選んでください。') })
              .catch(() => setError('ログインできませんでした。もう一度お試しください。'))
              .finally(() => setLoggingIn(false))
          }}
        >
          {loggingIn ? 'ログインしています…' : isMockApi ? 'ログインする' : 'Discord でログイン'}
        </Button>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(prepared) && !guestPrompt} onOpenChange={open => { if (!open && !starting) setPrepared(null) }}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{prepared ? testKindLabel[prepared.kind] : '開始前の確認'}</DialogTitle>
        <DialogDescription>40問・60分。開始後は回答を変更できます。答え合わせは最後にまとめて行います。</DialogDescription>
        <p>{user ? '今回のテストは認定対象です。' : '今回は認定対象外です。'}</p>
        <Button className="h-12" disabled={starting} onClick={start}>{starting ? '開始しています…' : 'テストを開始'}</Button>
      </DialogContent>
    </Dialog>
  </PageContainer>
}
