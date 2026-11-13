'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, PencilLine, Search, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState, Notice, Select } from '@/components/kit/primitives'
import { CategoryBadge, DifficultyBadge, PageTitle, RateText, ReportButton } from '@/components/quiz/bits'
import { mutate, useAppState, useHydrated } from '@/lib/store/store'
import { CATEGORIES, DIFFS, DIFF_LABEL } from '@/lib/domain/labels'
import { questionView } from '@/lib/domain/selectors'
import type { CategoryId, Difficulty } from '@/lib/domain/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20
type Sort = 'no' | 'rate_desc' | 'rate_asc'

/** 検索文字の正規化（全角半角・大文字小文字・空白区切りAND）。詳細は詳細設計 */
function normalize(t: string) {
  return t.normalize('NFKC').toLowerCase()
}

function ChipToggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn('inline-flex h-9 items-center gap-1 rounded-full border px-3 text-sm transition-colors md:h-8', pressed ? 'border-brand bg-info-soft font-bold text-accent-foreground' : 'bg-card text-muted-foreground hover:text-foreground')}
    >
      {pressed && <span aria-hidden>✓</span>}
      {children}
    </button>
  )
}

function QuestionList() {
  const s = useAppState()
  const hydrated = useHydrated()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cats, setCats] = useState<CategoryId[]>(() => (params.get('cat')?.split(',').filter(Boolean) as CategoryId[]) ?? [])
  const [diffs, setDiffs] = useState<Difficulty[]>(() => (params.get('diff')?.split(',').filter(Boolean).map(Number) as Difficulty[]) ?? [])
  const [sort, setSort] = useState<Sort>('no')
  const [page, setPage] = useState(1)
  const [load, setLoad] = useState<'loading' | 'error' | 'ready'>('loading')

  const fetchList = () => {
    setLoad('loading')
    const fail = s.demo.failNextLoad
    setTimeout(() => {
      if (fail) {
        mutate((d) => {
          d.demo.failNextLoad = false
        })
        setLoad('error')
      } else setLoad('ready')
    }, 450)
  }
  useEffect(() => {
    if (hydrated) fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  const all = useMemo(() => s.questions.filter((x) => x.status === 'published').map((x) => questionView(s, x)), [s])
  const filtered = useMemo(() => {
    const words = normalize(q).split(/\s+/).filter(Boolean)
    const list = all.filter(
      (x) => (cats.length === 0 || cats.includes(x.v.category)) && (diffs.length === 0 || diffs.includes(x.diff)) && words.every((w) => normalize(x.v.text).includes(w)),
    )
    if (sort === 'no') return list.sort((a, b) => a.q.no - b.q.no)
    // 未集計は並び順にかかわらず末尾（詳細設計の仮置き）
    return list.sort((a, b) => {
      if (a.rate === null) return b.rate === null ? a.q.no - b.q.no : 1
      if (b.rate === null) return -1
      return sort === 'rate_desc' ? b.rate - a.rate : a.rate - b.rate
    })
  }, [all, q, cats, diffs, sort])

  useEffect(() => setPage(1), [q, cats, diffs, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const practiceHref = `/practice?${new URLSearchParams({ ...(cats.length ? { cat: cats.join(',') } : {}), ...(diffs.length ? { diff: diffs.join(',') } : {}) }).toString()}`
  const filtering = q || cats.length || diffs.length

  return (
    <div>
      <PageTitle
        title="過去問一覧"
        actions={
          <Link href={practiceHref} className={buttonVariants({ variant: 'outline' })}>
            <PencilLine aria-hidden />
            この条件で練習する
          </Link>
        }
      >
        問題を選ぶと、回答して正解・解説を確認できます。
      </PageTitle>

      <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-card p-3 md:p-4">
        <div role="search" className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="q" className="sr-only">
            問題文を検索
          </label>
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="キーワードで問題文を検索"
            className="h-11 w-full rounded-md border border-input bg-card pr-3 pl-9 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 md:h-10 md:text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="分野で絞り込み（複数選択可）">
          <span className="w-12 text-xs font-bold text-muted-foreground">分野</span>
          {CATEGORIES.map((c) => (
            <ChipToggle key={c.id} pressed={cats.includes(c.id)} onClick={() => setCats(toggle(cats, c.id))}>
              {c.label}
            </ChipToggle>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="難易度で絞り込み（複数選択可）">
          <span className="w-12 text-xs font-bold text-muted-foreground">難易度</span>
          {DIFFS.map((d) => (
            <ChipToggle key={d} pressed={diffs.includes(d)} onClick={() => setDiffs(toggle(diffs, d))}>
              {DIFF_LABEL[d]}
            </ChipToggle>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-sm" aria-live="polite">
            {load === 'ready' ? (
              <>
                <span className="tabular font-bold">{filtered.length}</span> 問
              </>
            ) : (
              ' '
            )}
            {filtering ? (
              <button
                type="button"
                className="ml-3 inline-flex items-center gap-0.5 text-xs text-muted-foreground underline underline-offset-2"
                onClick={() => {
                  setQ('')
                  setCats([])
                  setDiffs([])
                }}
              >
                <X className="size-3" aria-hidden />
                条件をクリア
              </button>
            ) : null}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">並び替え</span>
            <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-auto">
              <option value="no">問題番号順</option>
              <option value="rate_desc">正答率が高い順</option>
              <option value="rate_asc">正答率が低い順</option>
            </Select>
          </label>
        </div>
      </div>

      {load === 'loading' && (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="読み込み中">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="h-20 animate-pulse rounded-lg border bg-card" />
          ))}
        </ul>
      )}
      {load === 'error' && (
        <Notice tone="danger" title="問題を読み込めませんでした">
          <p>通信状況を確認して、もう一度お試しください。</p>
          <Button variant="outline" className="mt-2" onClick={fetchList}>
            再読み込み
          </Button>
        </Notice>
      )}
      {load === 'ready' && shown.length === 0 && (
        <EmptyState title="該当する問題がありません">キーワードを変えるか、分野・難易度の条件を減らしてください。</EmptyState>
      )}
      {load === 'ready' && shown.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {shown.map((x) => (
              <li key={x.q.id} className="relative flex flex-col gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-lv2 md:flex-row md:items-center md:gap-4 md:p-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Link href={`/questions/${x.q.id}`} className="text-[15px] leading-relaxed font-bold text-pretty after:absolute after:inset-0 hover:underline">
                    <span className="tabular mr-2 text-xs font-normal text-muted-foreground">No.{x.q.no}</span>
                    {x.v.text}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge c={x.v.category} />
                    <DifficultyBadge d={x.diff} />
                    <span className="relative z-10">
                      <ReportButton questionId={x.q.id} versionId={x.v.versionId} no={x.q.no} size="xs" />
                    </span>
                  </div>
                </div>
                <div className="shrink-0 md:text-right">
                  <RateText rate={x.rate} size="lg" />
                </div>
              </li>
            ))}
          </ul>
          <nav aria-label="ページ切替" className="mt-4 flex items-center justify-center gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="前のページ">
              <ChevronLeft aria-hidden />
            </Button>
            <span className="tabular text-sm" aria-current="page">
              {page} / {pages} ページ
            </span>
            <Button variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="次のページ">
              <ChevronRight aria-hidden />
            </Button>
          </nav>
        </>
      )}
    </div>
  )
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中…</p>}>
      <QuestionList />
    </Suspense>
  )
}
