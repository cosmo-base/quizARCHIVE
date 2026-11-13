'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Notice, Panel, Segmented, Select } from '@/components/kit/primitives'
import { toastResult } from '@/components/kit/toast'
import { PageTitle, nowIso } from '@/components/quiz/bits'
import { runAction, useAppState, useCurrentUser } from '@/lib/store/store'
import { startPractice } from '@/lib/domain/actions'
import { practiceCandidates } from '@/lib/domain/generate'
import { CATEGORIES, DIFFS, DIFF_LABEL, LEVEL_LABEL } from '@/lib/domain/labels'
import { GUIDE_SEC, PRACTICE_COUNTS, PRACTICE_TIME_OPTIONS, formatGuide } from '@/lib/domain/rules'
import type { CategoryId, Difficulty, Level } from '@/lib/domain/types'
import { cn } from '@/lib/utils'

function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className={cn('inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50', checked ? 'border-brand bg-info-soft font-bold' : 'bg-card')}>
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-[var(--brand)]" />
      {children}
    </label>
  )
}

function PracticeSettingsForm() {
  const s = useAppState()
  const user = useCurrentUser()
  const router = useRouter()
  const params = useSearchParams()
  const [count, setCount] = useState('10')
  const [cats, setCats] = useState<CategoryId[]>(() => (params.get('cat')?.split(',').filter(Boolean) as CategoryId[]) ?? [])
  const [diffs, setDiffs] = useState<Difficulty[]>(() => (params.get('diff')?.split(',').filter(Boolean).map(Number) as Difficulty[]) ?? [])
  const [time, setTime] = useState('none')
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const candidates = useMemo(() => practiceCandidates(s, { categories: cats, difficulties: diffs }).length, [s, cats, diffs])
  const n = Number(count)
  // ゲストの目安表示基準は TBD-01。V0では初級の目安を仮表示
  const guideLevel: Level = user?.level ?? 1
  const guideSec = GUIDE_SEC[guideLevel] * n
  const timeLimitSec = time === 'none' ? null : time === 'guide' ? guideSec : Number(time)
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const start = () => {
    if (starting) return
    setStarting(true)
    setError(null)
    const r = runAction(startPractice, { count: n, categories: cats, difficulties: diffs, timeLimitSec }, nowIso())
    if (r.ok && r.id) router.push(`/play/${r.id}`)
    else {
      if (!r.ok) setError(r.message)
      toastResult(r)
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="練習する">
        条件に合う問題からランダムに出題します。途中で回答を変更でき、正誤と解説は終了後にまとめて表示します。個人レベルによる難易度の制限はありません。
      </PageTitle>
      <div className="flex flex-col gap-4">
        <Panel title="問題数">
          <Segmented label="問題数" value={count} onChange={setCount} items={PRACTICE_COUNTS.map((c) => ({ value: String(c), label: `${c}問` }))} />
        </Panel>
        <Panel title="分野" actions={<span className="text-xs text-muted-foreground">未選択はすべての分野</span>}>
          <div className="flex flex-wrap gap-2" role="group" aria-label="分野">
            {CATEGORIES.map((c) => (
              <Check key={c.id} checked={cats.includes(c.id)} onChange={() => setCats(toggle(cats, c.id))}>
                {c.label}
              </Check>
            ))}
          </div>
        </Panel>
        <Panel title="問題の難易度" actions={<span className="text-xs text-muted-foreground">未選択はすべての難易度</span>}>
          <div className="flex flex-wrap gap-2" role="group" aria-label="問題の難易度">
            {DIFFS.map((d) => (
              <Check key={d} checked={diffs.includes(d)} onChange={() => setDiffs(toggle(diffs, d))}>
                {DIFF_LABEL[d]}
              </Check>
            ))}
          </div>
        </Panel>
        <Panel title="時間設定">
          <Field label="制限時間" htmlFor="time" hint="時間切れになると、その時点の回答で自動的に終了します。選択肢は仮の値です（TBD-01）。">
            <Select id="time" value={time} onChange={(e) => setTime(e.target.value)} className="max-w-xs">
              {PRACTICE_TIME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value === 'guide' ? `${o.label}（${formatGuide(guideSec)}）` : o.label}
                </option>
              ))}
            </Select>
          </Field>
          <p className="mt-3 text-sm leading-relaxed">
            目安：{user ? `あなたのレベル（${LEVEL_LABEL[guideLevel]}）` : '初級の目安（ゲスト・仮）'}では1問 {formatGuide(GUIDE_SEC[guideLevel])}、{n}問で <span className="font-bold">{formatGuide(guideSec)}</span>。強制終了時間ではありません。
          </p>
        </Panel>

        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:rounded-lg md:border md:bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" aria-live="polite">
              条件に合う問題 <span className="tabular text-lg font-bold">{candidates}</span> 問
              {candidates < n && <span className="ml-2 font-bold text-danger">（{n}問に足りません）</span>}
            </p>
            <Button size="lg" className="h-11 px-6 md:h-10" disabled={candidates < n || starting} onClick={start}>
              <Play aria-hidden />
              {n}問で練習を始める
            </Button>
          </div>
          {candidates < n && <p className="text-xs text-muted-foreground">重複なしで出題できる問題数のみ開始できます。分野・難易度の条件を広げるか、問題数を減らしてください。</p>}
          {error && <Notice tone="danger">{error}</Notice>}
        </div>
      </div>
    </div>
  )
}

export default function PracticePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中…</p>}>
      <PracticeSettingsForm />
    </Suspense>
  )
}
