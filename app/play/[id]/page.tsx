'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleAlert, CloudCheck, Flag, LoaderCircle, RotateCw, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, EmptyState, Notice } from '@/components/kit/primitives'
import { toast } from '@/components/kit/toast'
import { CategoryBadge, ChoiceList, RateText, nowIso } from '@/components/quiz/bits'
import { mutate, runAction, useAppState, useHydrated } from '@/lib/store/store'
import { finishAttempt, moveTo, saveAnswer, sameSubject, subjectOf } from '@/lib/domain/actions'
import { TEST_LABEL } from '@/lib/domain/labels'
import { formatDuration } from '@/lib/domain/rules'
import { findVersion } from '@/lib/domain/selectors'
import { cn } from '@/lib/utils'

type Sync = { selectedId: string | null; seq: number; status: 'saving' | 'saved' | 'failed' }

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])
  return now
}

export default function PlayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const s = useAppState()
  const hydrated = useHydrated()
  const a = s.attempts.find((x) => x.id === id)
  const own = a && sameSubject(a.subject, subjectOf(s))
  const active = !!a && own && a.status === 'in_progress'
  const now = useNow(!!active)
  const [sync, setSync] = useState<Record<number, Sync>>({})
  const seqRef = useRef<Record<number, number>>({})
  const [confirm, setConfirm] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [announce, setAnnounce] = useState('')
  const announced = useRef<Set<number>>(new Set())
  const headingRef = useRef<HTMLHeadingElement>(null)

  const finish = useCallback(
    (trigger: 'manual' | 'timeout') => {
      const r = runAction(finishAttempt, id, trigger, nowIso())
      if (r.ok) router.replace(`/result/${id}`)
      else {
        toast(r.message, false)
        setFinishing(false)
      }
    },
    [id, router],
  )

  // 終了済みの回は結果へ
  useEffect(() => {
    if (hydrated && a && own && a.status !== 'in_progress') router.replace(`/result/${id}`)
  }, [hydrated, a, own, id, router])

  // 期限到達で自動確定（端末時刻ではなく開始時に確定した期限で判定する想定）
  const remaining = a?.deadline ? Math.ceil((new Date(a.deadline).getTime() - now) / 1000) : null
  useEffect(() => {
    if (!active || remaining === null) return
    if (remaining <= 0 && !finishing) {
      setFinishing(true)
      setConfirm(false)
      finish('timeout')
    }
    for (const mark of [600, 300, 60]) {
      if (remaining <= mark && remaining > mark - 5 && !announced.current.has(mark)) {
        announced.current.add(mark)
        setAnnounce(`残り時間 ${mark / 60}分です`)
      }
    }
  }, [remaining, active, finishing, finish])

  if (!hydrated) return <p className="text-sm text-muted-foreground">読み込み中…</p>
  if (!a || !own)
    return (
      <EmptyState title="この回は表示できません" action={<Link href="/" className="text-sm text-brand underline">ホームへ</Link>}>
        存在しないか、別の利用者の回です。
      </EmptyState>
    )
  if (a.status !== 'in_progress') return <p className="text-sm text-muted-foreground">結果へ移動しています…</p>

  const idx = a.currentIndex
  const aq = a.questions[idx]
  const v = findVersion(s, aq.questionId, aq.versionId)!
  const no = s.questions.find((q) => q.id === aq.questionId)?.no
  const selectedOf = (i: number) => (sync[i] ? sync[i].selectedId : a.questions[i].selectedId)
  const answeredCount = a.questions.filter((_, i) => selectedOf(i)).length
  const unanswered = a.questions.length - answeredCount
  const failed = Object.entries(sync).filter(([, x]) => x.status === 'failed')
  const saving = Object.values(sync).some((x) => x.status === 'saving')

  const save = (i: number, selectedId: string | null) => {
    const seq = (seqRef.current[i] = (seqRef.current[i] ?? a.questions[i].savedSeq) + 1)
    setSync((m) => ({ ...m, [i]: { selectedId, seq, status: 'saving' } }))
    setTimeout(() => {
      const r = runAction(saveAnswer, id, i, selectedId, seq, nowIso())
      setSync((m) => (m[i]?.seq === seq ? { ...m, [i]: { ...m[i], status: r.ok ? 'saved' : 'failed' } } : m))
    }, 250)
  }
  const resendAll = () => failed.forEach(([i, x]) => save(Number(i), x.selectedId))
  const go = (i: number) => {
    if (i < 0 || i >= a.questions.length) return
    mutate((d) => moveTo(d, id, i))
    requestAnimationFrame(() => headingRef.current?.focus())
  }
  const doFinish = () => {
    if (finishing) return
    setFinishing(true)
    // 未同期の選択は終了前に再送し、保存済みの内容で確定する（TBD-05 の仮挙動）
    for (const [i, x] of Object.entries(sync)) {
      if (x.status !== 'saved') runAction(saveAnswer, id, Number(i), x.selectedId, x.seq + 1000, nowIso())
    }
    finish('manual')
  }

  const title = a.mode === 'test' && a.testType ? TEST_LABEL[a.testType] : a.kind === 'review' ? '復習（練習）' : '練習'
  const elapsed = Math.floor((now - new Date(a.startedAt).getTime()) / 1000)
  const low = remaining !== null && remaining <= 300

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>
      <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-background/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:rounded-lg md:border md:bg-card">
        <p className="text-sm font-bold">
          {title}
          {a.kind === 'review' && <span className="ml-2 rounded border border-dashed px-1 text-xs font-normal text-muted-foreground">昇格・正答率の対象外</span>}
          {a.mode === 'test' && !a.certifying && <span className="ml-2 rounded border border-dashed px-1 text-xs font-normal text-muted-foreground">認定なし</span>}
        </p>
        <p className="tabular text-sm">
          問題 <span className="font-bold">{idx + 1}</span> / {a.questions.length}
        </p>
        <p className={cn('tabular ml-auto inline-flex items-center gap-1 text-sm', low ? 'font-bold text-danger' : remaining !== null ? 'font-bold text-warning' : 'text-muted-foreground')}>
          <Timer className="size-4" aria-hidden />
          {remaining !== null ? (
            <>
              <span className="sr-only">残り時間</span>
              <span className="hidden sm:inline">残り </span>
              {formatDuration(remaining)}
            </>
          ) : (
            <>経過 {formatDuration(elapsed)}（制限なし）</>
          )}
        </p>
      </div>

      <article className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular text-xs text-muted-foreground">No.{no}</span>
          <CategoryBadge c={aq.category} />
          <span className="ml-auto">
            <RateText rate={aq.displayRateAtStart} size="sm" />
          </span>
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="text-lg leading-relaxed font-bold text-pretty outline-none md:text-xl">
          <span className="sr-only">問題{idx + 1}：</span>
          {v.text}
        </h1>
        <ChoiceList key={idx} choices={aq.choiceOrder.map((cid) => v.choices.find((c) => c.id === cid)!)} value={selectedOf(idx)} onChange={(cid) => save(idx, cid)} legend={`問題${idx + 1}の選択肢`} />
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-2 text-xs">
          <SaveStatus state={sync[idx]?.status ?? (aq.savedAt ? 'saved' : null)} />
          {selectedOf(idx) && (
            <button type="button" className="text-muted-foreground underline underline-offset-2" onClick={() => save(idx, null)}>
              選択を取り消す
            </button>
          )}
        </div>
        {failed.length > 0 && (
          <Notice tone="danger" title={`未同期の回答が${failed.length}件あります`}>
            <p>通信に失敗したため、選択がまだ保存されていません。</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={resendAll}>
              <RotateCw aria-hidden />
              再送する
            </Button>
          </Notice>
        )}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" className="h-11 md:h-10" disabled={idx === 0} onClick={() => go(idx - 1)}>
            <ChevronLeft aria-hidden />
            前へ
          </Button>
          <Button variant="outline" size="lg" className="h-11 md:h-10" disabled={idx === a.questions.length - 1} onClick={() => go(idx + 1)}>
            次へ
            <ChevronRight aria-hidden />
          </Button>
          <Button size="lg" className="ml-auto h-11 px-5 md:h-10" onClick={() => setConfirm(true)} disabled={finishing}>
            <Flag aria-hidden />
            終了する
          </Button>
        </div>
      </article>

      <nav aria-label="問題番号へ移動" className="rounded-lg border bg-card p-3">
        <ol className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {a.questions.map((q, i) => {
            const done = !!selectedOf(i)
            const cur = i === idx
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={cur ? 'step' : undefined}
                  aria-label={`問題${i + 1}（${done ? '回答済み' : '未回答'}${cur ? '・表示中' : ''}）`}
                  className={cn(
                    'tabular relative flex h-10 w-full items-center justify-center rounded-md border text-sm font-bold transition-colors',
                    done ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted',
                    cur && 'ring-2 ring-warning ring-offset-2',
                  )}
                >
                  {i + 1}
                  {done && <span className="absolute top-0.5 right-1 text-[9px]" aria-hidden>✓</span>}
                </button>
              </li>
            )
          })}
        </ol>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex size-4 items-center justify-center rounded-sm bg-primary text-[9px] text-primary-foreground">✓</span>回答済み {answeredCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-4 rounded-sm border bg-card" />
            未回答 {unanswered}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-4 rounded-sm border ring-2 ring-warning" />
            表示中の問題
          </span>
        </div>
      </nav>

      <p className="text-xs leading-relaxed text-muted-foreground">
        正誤・正解・解説は終了後にまとめて表示します。回答中はログイン／ログアウトできません。外部の検索や資料の参照は自由です。
        {saving && ' 保存中…'}
      </p>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="終了しますか？"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(false)} data-autofocus>
              見直す
            </Button>
            <Button onClick={doFinish} disabled={finishing}>
              {finishing ? '処理中…' : '終了を確定する'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-sm">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-md border px-2 py-2">
              <p className="text-xs text-muted-foreground">回答済み</p>
              <p className="tabular text-xl font-bold">{answeredCount}問</p>
            </div>
            <div className={cn('rounded-md border px-2 py-2', unanswered > 0 && 'border-warning/40 bg-warning-soft')}>
              <p className="text-xs text-muted-foreground">未回答</p>
              <p className="tabular text-xl font-bold">{unanswered}問</p>
            </div>
          </div>
          {unanswered > 0 && <p className="leading-relaxed">未回答の問題は0点として採点されます。{a.mode === 'test' && '全問に回答していなくても、32問以上正解なら合格です。'}</p>}
          {failed.length > 0 && <p className="text-danger">未同期の回答は、終了時に再送してから確定します。</p>}
          <p className="text-xs text-muted-foreground">終了を確定すると、回答は変更できません。</p>
        </div>
      </Dialog>
    </div>
  )
}

function SaveStatus({ state }: { state: 'saving' | 'saved' | 'failed' | null }) {
  if (!state) return <span className="text-muted-foreground">未回答</span>
  if (state === 'saving')
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground" role="status">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        保存中…
      </span>
    )
  if (state === 'failed')
    return (
      <span className="inline-flex items-center gap-1 font-bold text-danger" role="status">
        <CircleAlert className="size-3.5" aria-hidden />
        未同期（保存に失敗）
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-success" role="status">
      <CloudCheck className="size-3.5" aria-hidden />
      保存済み
    </span>
  )
}
