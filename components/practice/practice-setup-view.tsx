'use client'

import { LinkButton } from '@/components/link-button'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Info, Loader2, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer, PageHeading, PageSkeleton, SurfaceCard } from '@/components/shell/page'
import { FilterPanel } from '@/components/questions/filter-panel'
import { ResumeBanner } from '@/components/quiz/resume-banner'
import { mockConfig } from '@/lib/config'
import { levelLabel, levels } from '@/lib/labels'
import { actions, currentUser, filterPracticePool, getAllQuestions, useAppState } from '@/lib/store'
import { formatDuration } from '@/lib/time'
import type { QuestionDifficulty } from '@/lib/types'
import { cn } from '@/lib/utils'

function parseList(v: string | null) {
  return v ? v.split(',').filter(Boolean) : []
}

export function PracticeSetupView() {
  const state = useAppState()
  const params = useSearchParams()
  const router = useRouter()
  const [fieldIds, setFieldIds] = useState<string[]>(() => parseList(params.get('field')))
  const [difficulties, setDifficulties] = useState<QuestionDifficulty[]>(
    () => parseList(params.get('diff')).filter((d) => (levels as string[]).includes(d)) as QuestionDifficulty[],
  )
  const [keyword, setKeyword] = useState(() => params.get('q') ?? '')
  const [count, setCount] = useState(mockConfig.practice.defaultCount)
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  if (!state) return <PageSkeleton />

  const user = currentUser(state)
  const pool = filterPracticePool(getAllQuestions(state), { fieldIds, difficulties, keyword })
  const short = pool.length < count
  const pace = user ? mockConfig.practice.paceSecondsPerQuestion[user.level] : null

  const start = () => {
    if (starting) return
    setStarting(true)
    setError(null)
    const result = actions.startPractice({ count, fieldIds, difficulties, timeLimitMinutes: timeLimit, keyword: keyword || undefined })
    if (result.ok) {
      router.push(`/attempts/${result.attemptId}`)
    } else {
      setError(result.message)
      setStarting(false)
    }
  }

  return (
    <PageContainer narrow>
      <PageHeading title="練習する" description="分野・難易度・問題数を選んで、自分のペースで解けます。練習ではレベルは変わりません。" />
      <ResumeBanner state={state} mode="practice" />

      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          start()
        }}
      >
        <SurfaceCard className="flex flex-col gap-6">
          <h2 className="text-lg font-bold">出題範囲</h2>
          {keyword && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
              <span>
                キーワード：<span className="font-bold">{keyword}</span>
              </span>
              <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => setKeyword('')}>
                <X aria-hidden="true" />
                解除
              </Button>
            </div>
          )}
          <FilterPanel
            idPrefix="practice"
            fieldIds={fieldIds}
            difficulties={difficulties}
            onFieldsChange={setFieldIds}
            onDifficultiesChange={setDifficulties}
          />
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {`この条件で出題できる問題：`}
            <span className="font-bold text-foreground">{`${pool.length}問`}</span>
          </p>
        </SurfaceCard>

        <SurfaceCard className="flex flex-col gap-6">
          <h2 className="text-lg font-bold">形式</h2>
          <OptionGroup
            legend="問題数"
            name="count"
            value={String(count)}
            onChange={(v) => setCount(Number(v))}
            options={mockConfig.practice.countOptions.map((n) => ({ value: String(n), label: `${n}問`, disabled: n > pool.length }))}
          />
          {pool.length < Math.max(...mockConfig.practice.countOptions) && <p className="text-sm text-muted-foreground">選択できない問題数は、条件に合う候補が不足しています。</p>}
          <OptionGroup
            legend="制限時間"
            name="time"
            value={timeLimit === null ? 'none' : String(timeLimit)}
            onChange={(v) => setTimeLimit(v === 'none' ? null : Number(v))}
            options={[{ value: 'none', label: 'なし' }, ...mockConfig.practice.timeLimitOptions.map((m) => ({ value: String(m), label: `${m}分` }))]}
          />
          {pace && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {`${levelLabel[user!.level]}の目安は1問あたり${formatDuration(pace)}、${count}問で約${formatDuration(pace * count)}です（時間切れにはなりません）。`}
            </p>
          )}
        </SurfaceCard>

        {!user && (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            ゲストでも練習できます。目安：初級ペース（1問120秒）、{count}問で約{count * 2}分。記録はこのブラウザにだけ残ります。
          </p>
        )}

        {(error || short) && (
          <p role="alert" className="rounded-xl bg-destructive-soft px-4 py-3 text-sm text-destructive">
            {error ?? `条件に合う問題が${pool.length}問しかありません。問題数を減らすか、条件を広げてください。`}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <LinkButton href="/questions" variant="outline" className="h-12">過去問一覧へ</LinkButton>
          <Button type="submit" className="h-12 text-base sm:min-w-48" disabled={short || starting}>
            {starting ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Play aria-hidden="true" />}
            {`${count}問で始める`}
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}

function OptionGroup({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string
  name: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex h-11 min-w-16 cursor-pointer items-center justify-center rounded-lg border-2 px-4 text-sm font-medium transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
              value === o.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/50',
              o.disabled && 'cursor-not-allowed opacity-40 hover:border-border',
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
