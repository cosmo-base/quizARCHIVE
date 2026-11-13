'use client'
import { useState } from 'react'
import { PageContainer, PageHeading, PageSkeleton, SurfaceCard } from '@/components/shell/page'
import { LevelProgressSummary } from '@/components/quiz/level-progress'
import { DemoLoginDialog } from '@/components/quiz/demo-login-dialog'
import { StarRow } from '@/components/quiz/star-row'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/link-button'
import { currentUser, useAppState } from '@/lib/store'
import { levels, levelLabel } from '@/lib/labels'

export function ProgressView() {
  const state = useAppState()
  const [login, setLogin] = useState(false)
  if (!state) return <PageSkeleton />
  const user = currentUser(state)
  return <PageContainer narrow><PageHeading title="レベルと星" description="積み重ねた学びを、自分だけの道しるべに。" />
    <SurfaceCard className="flex flex-col gap-5">{user ? <><p className="text-sm text-muted-foreground">現在の個人レベル</p><h2 className="text-3xl font-bold text-primary">{levelLabel[user.level]}</h2><LevelProgressSummary user={user} /><LinkButton href="/tests" className="h-12">対象のテストに挑戦</LinkButton></> : <><h2 className="text-xl font-bold">ログインして挑戦を記録</h2><p>個人レベルは初級から始まります。ゲストのテストは認定対象外です。</p><Button className="h-12" onClick={() => setLogin(true)}>デモログイン</Button></>}</SurfaceCard>
    <SurfaceCard id="rules" className="flex flex-col gap-5"><h2 className="text-xl font-bold">レベルのロードマップ</h2><ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">{levels.map(level => <li key={level} className="rounded-xl border bg-muted p-4 text-center"><span className="font-bold">{levelLabel[level]}</span>{user?.level === level && <p className="text-sm text-primary">現在のレベル</p>}</li>)}</ol><p className="text-sm text-muted-foreground">対象テストに累計3回合格すると昇格します。不合格でも合格数はリセットされず、降格もしません。</p></SurfaceCard>
    <SurfaceCard className="flex flex-col gap-5"><h2 className="text-xl font-bold">専門家になったら、星を集めよう</h2><p>専門家になってから3回合格するごとに星が進みます。白星が5個そろった後は、順に黒星へ変わります。</p><div className="flex flex-col gap-3">{[3, 15, 18, 30, 33, 36].map(n => <div key={n} className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3"><span className="text-sm">{n}回合格</span><StarRow expertPasses={n} /></div>)}</div><p className="text-sm text-muted-foreground">問題の訂正によって、過去の合格・レベル・星を増減することはありません。問題難易度と個人レベルは別の指標です。</p></SurfaceCard>
    <DemoLoginDialog open={login} onOpenChange={setLogin} />
  </PageContainer>
}
