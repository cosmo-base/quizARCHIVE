'use client'

import Link from 'next/link'
import { LinkButton } from '@/components/link-button'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ArrowRight, ChevronLeft, ChevronRight, PencilLine, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer, PageHeading } from '@/components/shell/page'
import { QuestionMeta } from '@/components/quiz/question-meta'
import { mockConfig } from '@/lib/config'
import { fieldName } from '@/lib/data/questions'
import { levelLabel, levels } from '@/lib/labels'
import { fetchQuestions } from '@/lib/mock-repository'
import { filterPracticePool, useAppState } from '@/lib/store'
import type { Question, QuestionDifficulty } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FilterPanel } from './filter-panel'

type Sort = 'default' | 'accuracyAsc' | 'accuracyDesc'
const sortOptions: { value: Sort; label: string }[] = [
  { value: 'default', label: '標準' },
  { value: 'accuracyAsc', label: '正答率が低い順' },
  { value: 'accuracyDesc', label: '正答率が高い順' },
]

function parseList(v: string | null) {
  return v ? v.split(',').filter(Boolean) : []
}

function sortQuestions(list: Question[], sort: Sort) {
  if (sort === 'default') return list
  // 未集計は常に最後
  return [...list].sort((a, b) => {
    if (a.displayAccuracy === null && b.displayAccuracy === null) return 0
    if (a.displayAccuracy === null) return 1
    if (b.displayAccuracy === null) return -1
    return sort === 'accuracyAsc' ? a.displayAccuracy - b.displayAccuracy : b.displayAccuracy - a.displayAccuracy
  })
}

export function QuestionListView() {
  const state = useAppState()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const keyword = params.get('q') ?? ''
  const fieldIds = parseList(params.get('field'))
  const difficulties = parseList(params.get('diff')) as QuestionDifficulty[]
  const sort = (params.get('sort') as Sort) || 'default'
  const page = Math.max(1, Number(params.get('page')) || 1)

  const { data, error, isLoading, mutate } = useSWR(state ? ['questions', state.statsRevision] : null, () => fetchQuestions(), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  const [draftKeyword, setDraftKeyword] = useState(keyword)

  const setParams = (patch: Record<string, string | string[] | null>, resetPage = true) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      const value = Array.isArray(v) ? v.join(',') : v
      if (!value || value === 'default') next.delete(k)
      else next.set(k, value)
    }
    if (resetPage) next.delete('page')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const filtered = useMemo(
    () => (data ? sortQuestions(filterPracticePool(data, { fieldIds, difficulties, keyword }), sort) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, params],
  )
  const pageSize = mockConfig.questionList.pageSize
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const hasFilters = fieldIds.length > 0 || difficulties.length > 0 || keyword.length > 0

  const practiceHref = (() => {
    const p = new URLSearchParams()
    if (fieldIds.length) p.set('field', fieldIds.join(','))
    if (difficulties.length) p.set('diff', difficulties.join(','))
    if (keyword) p.set('q', keyword)
    const qs = p.toString()
    return qs ? `/practice?${qs}` : '/practice'
  })()

  const clearAll = () => {
    setDraftKeyword('')
    setParams({ q: null, field: null, diff: null })
  }

  const filterPanel = (prefix: string) => (
    <FilterPanel
      idPrefix={prefix}
      fieldIds={fieldIds}
      difficulties={difficulties}
      onFieldsChange={(v) => setParams({ field: v })}
      onDifficultiesChange={(v) => setParams({ diff: v })}
    />
  )

  return (
    <PageContainer>
      <PageHeading title="過去問を探す" description="気になる問題を選んで、1問ずつ解けます。">
        <LinkButton href={practiceHref} variant="outline" className="h-11">
            <PencilLine aria-hidden="true" />
            この条件で練習する
          </LinkButton>
      </PageHeading>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside aria-label="絞り込み" className="hidden w-60 shrink-0 rounded-2xl border bg-card p-5 lg:block">
          {filterPanel('side')}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <form
            role="search"
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setParams({ q: draftKeyword.trim() || null })
            }}
          >
            <div className="relative flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="question-search" className="sr-only">
                問題文で検索
              </label>
              <Input
                id="question-search"
                type="search"
                value={draftKeyword}
                onChange={(e) => setDraftKeyword(e.target.value)}
                placeholder="問題文で検索"
                className="h-11 bg-card pl-9"
              />
            </div>
            <Button type="submit" className="h-11 px-4">
              検索
            </Button>
            <Button type="button" variant="outline" className="h-11 lg:hidden" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">絞り込み</span>
              {fieldIds.length + difficulties.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{fieldIds.length + difficulties.length}</span>
              )}
            </Button>
          </form>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {data ? (
                <>
                  <span className="text-base font-bold text-foreground tabular-nums">{filtered.length}</span>
                  件の問題
                </>
              ) : (
                '読み込み中…'
              )}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-muted-foreground">
                並び替え
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setParams({ sort: e.target.value })}
                className="h-11 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasFilters && (
            <ul className="flex flex-wrap items-center gap-2" aria-label="選択中の条件">
              {keyword && (
                <Chip
                  label={`「${keyword}」`}
                  onRemove={() => {
                    setDraftKeyword('')
                    setParams({ q: null })
                  }}
                />
              )}
              {fieldIds.map((f) => (
                <Chip key={f} label={fieldName(f)} onRemove={() => setParams({ field: fieldIds.filter((v) => v !== f) })} />
              ))}
              {levels
                .filter((l) => difficulties.includes(l))
                .map((l) => (
                  <Chip key={l} label={`難易度：${levelLabel[l]}`} onRemove={() => setParams({ diff: difficulties.filter((v) => v !== l) })} />
                ))}
              <li>
                <Button variant="ghost" size="sm" className="h-9 text-primary" onClick={clearAll}>
                  すべて解除
                </Button>
              </li>
            </ul>
          )}

          {error ? (
            <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center">
              <p className="font-bold">問題を読み込めませんでした</p>
              <p className="text-sm text-muted-foreground">通信状況を確認して、もう一度お試しください。</p>
              <Button variant="outline" className="h-11" onClick={() => mutate()}>
                <RefreshCw aria-hidden="true" />
                再読み込み
              </Button>
            </div>
          ) : !data || (isLoading && !data) ? (
            <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center">
              <p className="font-bold">条件に合う問題が見つかりません</p>
              <p className="text-sm text-muted-foreground">キーワードを短くするか、絞り込み条件を減らしてみてください。</p>
              <Button variant="outline" className="h-11" onClick={clearAll}>
                条件をすべて解除
              </Button>
            </div>
          ) : (
            <>
              <ul className="grid gap-4 md:grid-cols-2">
                {visible.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/questions/${q.id}`}
                      className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs transition-shadow outline-none hover:border-primary/40 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <QuestionMeta questionId={q.id} fieldId={q.fieldId} difficulty={q.difficulty} accuracy={q.displayAccuracy} />
                      <p className="line-clamp-3 flex-1 leading-relaxed text-pretty">{q.text}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        詳細へ
                        <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {pageCount > 1 && (
                <nav aria-label="ページ" className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="size-11"
                    disabled={currentPage <= 1}
                    onClick={() => setParams({ page: String(currentPage - 1) }, false)}
                    aria-label="前のページ"
                  >
                    <ChevronLeft aria-hidden="true" />
                  </Button>
                  <p className="min-w-24 text-center text-sm tabular-nums" aria-current="page">
                    {currentPage} ／ {pageCount} ページ
                  </p>
                  <Button
                    variant="outline"
                    className="size-11"
                    disabled={currentPage >= pageCount}
                    onClick={() => setParams({ page: String(currentPage + 1) }, false)}
                    aria-label="次のページ"
                  >
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>絞り込み</SheetTitle>
            <SheetDescription>同じ項目内はいずれか、項目どうしはすべてに当てはまる問題を表示します。</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4">{filterPanel('sheet')}</div>
          <SheetFooter className="flex-row gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button variant="outline" className="h-11 flex-1" onClick={clearAll}>
              すべて解除
            </Button>
            <Button className="h-11 flex-1" onClick={() => setSheetOpen(false)}>
              {`${filtered.length}件を表示`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li>
      <span className={cn('inline-flex h-9 items-center gap-1 rounded-full border bg-card pr-1 pl-3 text-sm')}>
        {label}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${label}の条件を外す`}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </span>
    </li>
  )
}
