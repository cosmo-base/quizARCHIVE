'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Notice, Panel } from '@/components/kit/primitives'
import { toastResult } from '@/components/kit/toast'
import { PageTitle, Stars, nowIso } from '@/components/quiz/bits'
import { LoginDialog } from '@/components/shell/login-dialog'
import { runAction, useAppState, useCurrentUser } from '@/lib/store/store'
import { startTest, testEligibility } from '@/lib/domain/actions'
import { DIFF_LABEL, LEVEL_LABEL, TEST_LABEL, TEST_SHORT, TEST_TYPES } from '@/lib/domain/labels'
import { COMPOSITION, ELIGIBLE_TEST, PASSES_TO_PROMOTE, PASS_SCORE, TEST_COUNT, starInfo } from '@/lib/domain/rules'
import type { Difficulty, TestType } from '@/lib/domain/types'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const SEG: { key: Difficulty | 'any'; label: string; cls: string }[] = [
  { key: 1, label: DIFF_LABEL[1], cls: 'bg-lv1 text-foreground' },
  { key: 2, label: DIFF_LABEL[2], cls: 'bg-lv2 text-foreground' },
  { key: 3, label: DIFF_LABEL[3], cls: 'bg-lv3 text-primary-foreground' },
  { key: 4, label: DIFF_LABEL[4], cls: 'bg-lv4 text-primary-foreground' },
  { key: 'any', label: '全難易度ランダム', cls: 'bg-muted-foreground/60 text-primary-foreground' },
]

function CompositionBar({ type }: { type: TestType }) {
  const c = COMPOSITION[type]
  const parts = SEG.filter((p) => c[p.key] > 0)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-7 overflow-hidden rounded-md text-xs font-bold" aria-hidden>
        {parts.map((p) => (
          <div key={String(p.key)} className={cn('flex items-center justify-center', p.cls)} style={{ width: `${(c[p.key] / TEST_COUNT) * 100}%` }}>
            {c[p.key]}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">基準構成：{parts.map((p) => `${p.label} ${c[p.key]}問`).join('・')}</p>
    </div>
  )
}

/** SCR-06 ゲスト案内。背景クリック・Escでは閉じない。×で閉じるとゲストとして開始 */
function GuestModal({ open, type, onLogin, onContinue }: { open: boolean; type: TestType; onLogin: () => void; onContinue: () => void }) {
  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-foreground/50" aria-hidden />
      <GuestModalBody type={type} onLogin={onLogin} onContinue={onContinue} />
    </div>,
    document.body,
  )
}

function GuestModalBody({ type, onLogin, onContinue }: { type: TestType; onLogin: () => void; onContinue: () => void }) {
  // フォーカスをモーダル内に閉じ込める（Tabの循環）
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const els = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button'))
    const first = els[0]
    const last = els[els.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-title"
      aria-describedby="guest-desc"
      onKeyDown={onKeyDown}
      className="relative w-full rounded-t-xl bg-card shadow-xl md:max-w-lg md:rounded-xl"
    >
      <header className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <h2 id="guest-title" className="text-lg font-bold">
          テスト開始前のご案内
        </h2>
        <button
          type="button"
          onClick={onContinue}
          className="-mr-2 -mt-1 inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted"
          aria-label="閉じてゲストとしてテストを開始する"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>
      <div id="guest-desc" className="flex flex-col gap-3 px-5 py-4 text-sm leading-relaxed">
        <p className="font-bold">{TEST_LABEL[type]}（40問・60分）</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>ログインすると、合格実績・レベル・星を保存できます。</li>
          <li>
            <span className="font-bold">ログインせずに受けた結果は、後からログインしても実績に反映されません。</span>
          </li>
          <li>ゲストでも合否は結果画面で確認できます。</li>
        </ul>
        <p className="text-xs text-muted-foreground">このご案内を表示している間は、制限時間は始まりません。右上の × で閉じると、ゲストとしてテストを開始します。</p>
      </div>
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
        <Button size="lg" className="h-11 px-6 md:h-10" onClick={onLogin} autoFocus>
          ログイン
        </Button>
      </footer>
    </div>
  )
}

export default function TestPage() {
  const s = useAppState()
  const user = useCurrentUser()
  const router = useRouter()
  const [selected, setSelected] = useState<TestType>(user ? ELIGIBLE_TEST[user.level] : 'to2')
  const [guestOpen, setGuestOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eligibleType = user ? ELIGIBLE_TEST[user.level] : null
  const type = user ? eligibleType! : selected
  const el = testEligibility(s, type)

  const begin = () => {
    if (starting) return
    setStarting(true)
    setError(null)
    const r = runAction(startTest, type, nowIso())
    if (r.ok && r.id) router.push(`/play/${r.id}`)
    else {
      if (!r.ok) setError(r.message)
      toastResult(r)
      setStarting(false)
    }
  }
  const onStart = () => {
    if (!user) setGuestOpen(true) // ゲストは毎回案内
    else begin()
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="テストを受ける">40問・制限時間60分。32問以上（80％以上）の正解で1回合格です。外部の検索や資料の参照は自由です。</PageTitle>

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['40問', '出題数'],
          ['60分', '制限時間（全員共通）'],
          [`${PASS_SCORE}問以上`, '正解で合格（80％）'],
          ['累計3回', '合格で自動昇格'],
        ].map(([a, b]) => (
          <div key={b} className="rounded-lg border bg-card px-3 py-3 text-center">
            <p className="text-xl font-bold">{a}</p>
            <p className="text-xs text-muted-foreground">{b}</p>
          </div>
        ))}
      </div>

      {user ? (
        <Panel title="あなたの受験段階" className="mb-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <p>
              現在のレベル <span className="text-lg font-bold">{LEVEL_LABEL[user.level]}</span>
            </p>
            {user.level < 4 ? (
              <p>
                {TEST_LABEL[eligibleType!]}の合格 <span className="tabular text-lg font-bold">{user.passes}</span> / {PASSES_TO_PROMOTE}回
                <span className="text-muted-foreground">（あと{PASSES_TO_PROMOTE - user.passes}回で昇格）</span>
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <Stars passes={user.expertPasses} /> <span className="text-muted-foreground">次の表示まであと{starInfo(user.expertPasses).toNext}回</span>
              </p>
            )}
          </div>
        </Panel>
      ) : (
        <Notice tone="info" className="mb-4" title="ゲストとして受験します">
          どのテストにも挑戦できますが、合格・昇格・星は認定されません。後からログインしても認定には反映されません。
        </Notice>
      )}

      <fieldset className="mb-4 flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">テストの種類</legend>
        {TEST_TYPES.map((t) => {
          const allowed = !user || t === eligibleType
          const checked = type === t
          return (
            <label
              key={t}
              className={cn(
                'flex flex-col gap-2 rounded-lg border-2 bg-card p-3 md:flex-row md:items-center md:gap-4',
                allowed ? 'cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50' : 'cursor-not-allowed opacity-60',
                checked ? 'border-brand' : 'border-border',
              )}
            >
              <span className="flex items-center gap-2 md:w-56">
                <input type="radio" name="test-type" className="size-4 accent-[var(--brand)]" checked={checked} disabled={!allowed} onChange={() => setSelected(t)} />
                <span className="font-bold">{TEST_LABEL[t]}</span>
              </span>
              <span className="flex-1">
                <CompositionBar type={t} />
              </span>
              <span className="text-xs md:w-32 md:text-right">
                {!allowed ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Lock className="size-3.5" aria-hidden />
                    受験対象外
                  </span>
                ) : user ? (
                  <span className="font-bold text-success">認定対象</span>
                ) : (
                  <span className="text-muted-foreground">ゲスト（認定なし）</span>
                )}
                <span className="sr-only">{TEST_SHORT[t]}</span>
              </span>
            </label>
          )
        })}
        <p className="text-xs leading-relaxed text-muted-foreground">
          分野の均等配分を難易度構成より優先します。基準どおりの問題が足りない場合は近い難易度で補い、実際の構成を記録します。代替があっても合格条件は32／40問のままです。
        </p>
      </fieldset>

      <div className="flex flex-col items-start gap-2 rounded-lg border bg-card p-4">
        <p className="text-sm leading-relaxed">開始すると60分の時計が動き始めます。再読み込みや離席、通信切断でも時計は止まりません。全問に回答しなくても終了できます。</p>
        <Button size="lg" className="h-11 px-6 md:h-10" disabled={!el.canStart || starting} onClick={onStart}>
          <Play aria-hidden />
          {TEST_LABEL[type]}を開始する
        </Button>
        {!el.canStart && el.reason && <p className="text-sm text-danger">{el.reason}</p>}
        {error && <Notice tone="danger">{error}</Notice>}
      </div>

      <GuestModal
        open={guestOpen}
        type={type}
        onLogin={() => {
          setGuestOpen(false)
          setLoginOpen(true)
        }}
        onContinue={() => {
          setGuestOpen(false)
          begin()
        }}
      />
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
