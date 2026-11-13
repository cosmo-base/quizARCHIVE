'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { actions, currentUser, useAppState, type DemoFlags } from '@/lib/store'
import { levels, levelLabel } from '@/lib/labels'

export function DemoControls() {
  const state = useAppState()
  const path = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  if (process.env.NODE_ENV === 'production' || !state) return null
  const user = currentUser(state)
  const activeId = path.match(/^\/attempts\/([^/]+)$/)?.[1]
  const scenario = (kind: 'fail31' | 'pass32' | 'timeout32' | 'timeout0') => {
    const result = actions.runScenario(kind)
    if (result.ok) { setOpen(false); router.push(`/attempts/${result.attemptId}/result`) } else setError(result.message)
  }
  const flags: [keyof DemoFlags, string][] = [['saveFailure', '回答保存を失敗させる'], ['reportFailure', '報告送信を失敗させる'], ['listError', '一覧の読み込みエラー'], ['emptyHistory', '履歴0件']]
  return <><div className="fixed right-3 bottom-24 z-40"><Button variant="outline" className="h-11 shadow-sm" onClick={() => setOpen(true)}><Settings2 data-icon="inline-start" />デモ設定</Button></div><Sheet open={open} onOpenChange={setOpen}><SheetContent className="overflow-y-auto"><SheetHeader><SheetTitle>開発用デモ設定</SheetTitle><SheetDescription>UI検証専用です。本番では表示されません。</SheetDescription></SheetHeader><div className="flex flex-col gap-6 p-4">
    <section className="flex flex-col gap-3"><h3 className="font-bold">利用者</h3><p className="text-sm">{user ? `ログイン中・${levelLabel[user.level]}` : 'ゲスト'}</p><Button variant="outline" disabled={Boolean(activeId)} onClick={() => user ? actions.logout() : actions.login()}>{user ? 'ゲストに切替' : 'デモログイン'}</Button>{activeId && <p className="text-sm text-muted-foreground">回答中は利用者・資格を変更できません。</p>}<div className="flex flex-wrap gap-2">{levels.map(l => <Button variant="outline" key={l} disabled={Boolean(activeId)} onClick={() => actions.applyUserPreset(l, 0)}>{levelLabel[l]}</Button>)}</div><div className="flex flex-wrap gap-2">{[0, 1, 2].map(n => <Button key={n} variant="outline" disabled={!user || Boolean(activeId)} onClick={() => actions.applyUserPreset(user!.level, n)}>合格{n}／3</Button>)}</div></section>
    <section className="flex flex-col gap-3"><h3 className="font-bold">専門家の合格数</h3><div className="flex flex-wrap gap-2">{[14, 15, 17, 18, 29, 30, 33, 36].map(n => <Button key={n} variant="outline" disabled={Boolean(activeId)} onClick={() => actions.applyUserPreset('expert', 0, n)}>{n}回</Button>)}</div></section>
    <section className="flex flex-col gap-3"><h3 className="font-bold">結果シナリオ</h3><p className="text-sm text-muted-foreground">各ボタンは新しい受験を作成します。結果の再表示では加算しません。</p>{([['fail31', '31点不合格'], ['pass32', '32点合格'], ['timeout32', '32回答32正解・8未回答で時間切れ'], ['timeout0', '0回答で時間切れ']] as const).map(([key, label]) => <Button key={key} variant="outline" disabled={Boolean(activeId)} onClick={() => scenario(key)}>{label}</Button>)}</section>
    {activeId && <section className="flex flex-col gap-3"><h3 className="font-bold">回答中の時計</h3><Button variant="outline" onClick={() => { actions.setDeadlineFromNow(activeId, 10); setOpen(false) }}>残り10秒にする</Button><Button variant="outline" onClick={() => { actions.setDeadlineFromNow(activeId, 0); setOpen(false) }}>期限到達</Button></section>}
    <section className="flex flex-col gap-3"><h3 className="font-bold">空状態・失敗と復旧</h3>{flags.map(([key, label]) => <label key={key} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={state.demo[key]} onChange={e => actions.setDemoFlag(key, e.target.checked)} />{label}</label>)}<Button variant="outline" disabled={Boolean(activeId)} onClick={() => { setOpen(false); router.push('/questions?q=該当なしのデモ検索') }}>検索0件を表示</Button></section>
    {error && <p role="alert">{error}</p>}<Button variant="destructive" disabled={Boolean(activeId)} onClick={() => { actions.resetMock(); setOpen(false); router.push('/') }}>モックをリセット</Button>
  </div></SheetContent></Sheet></>
}
