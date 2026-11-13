'use client'

import { useId, useState } from 'react'
import { Check, CircleCheck, CircleX, ExternalLink, Flag, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, Field, Notice, Select, Textarea } from '@/components/kit/primitives'
import { toast } from '@/components/kit/toast'
import { CATEGORY_LABEL, CHOICE_MARK, DIFF_LABEL, REPORT_REASON } from '@/lib/domain/labels'
import { formatRate, starInfo } from '@/lib/domain/rules'
import { submitReport } from '@/lib/domain/actions'
import { runAction } from '@/lib/store/store'
import type { CategoryId, Choice, Difficulty, QuestionVersion, ReportReason } from '@/lib/domain/types'
import { cn } from '@/lib/utils'

export function nowIso() {
  return new Date().toISOString()
}

export function PageTitle({ title, children, actions }: { title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-xl font-bold text-pretty md:text-2xl">{title}</h1>
        {children && <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const DIFF_CLASS: Record<Difficulty, string> = {
  1: 'border-lv2/60 bg-info-soft text-accent-foreground',
  2: 'border-lv2 bg-lv1/50 text-accent-foreground',
  3: 'border-lv3 bg-lv3 text-primary-foreground',
  4: 'border-lv4 bg-lv4 text-primary-foreground',
}

export function DifficultyBadge({ d, prefix }: { d: Difficulty; prefix?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-xs font-bold whitespace-nowrap', DIFF_CLASS[d])}>
      {prefix}
      {DIFF_LABEL[d]}
    </span>
  )
}

export function CategoryBadge({ c }: { c: CategoryId }) {
  return <span className="inline-flex shrink-0 items-center rounded-md border bg-card px-1.5 py-0.5 text-xs whitespace-nowrap text-muted-foreground">{CATEGORY_LABEL[c]}</span>
}

/** 参加者向けの正答率は常に1つ。由来（SNS／サイト）は表示しない（FR-21） */
export function RateText({ rate, size = 'md' }: { rate: number | null; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={cn('tabular inline-flex items-baseline gap-1 whitespace-nowrap', size === 'sm' && 'text-xs text-muted-foreground', size === 'md' && 'text-sm', size === 'lg' && 'text-base font-bold')}>
      <span className={size === 'sm' ? '' : 'text-xs text-muted-foreground'}>正答率</span>
      <span className={cn(size !== 'sm' && 'font-bold', rate === null && 'font-normal text-muted-foreground')}>{formatRate(rate)}</span>
    </span>
  )
}

export function Stars({ passes, className }: { passes: number; className?: string }) {
  const info = starInfo(passes)
  if (info.k === 0) return <span className={cn('text-sm text-muted-foreground', className)}>星なし</span>
  return (
    <span className={cn('tabular text-lg tracking-wider text-lv4', className)} aria-label={info.plus ? `黒星プラス${info.plus}` : `黒星${info.black}個、白星${info.white}個`}>
      {info.text}
    </span>
  )
}

/**
 * 選択肢。ネイティブのラジオボタンで、キーボード・支援技術から操作できる。
 * 選択状態は色だけでなくアイコンと文言でも示す。
 */
export function ChoiceList({
  choices,
  value,
  onChange,
  legend,
  disabled,
  name,
}: {
  choices: Choice[]
  value: string | null
  onChange: (id: string) => void
  legend: React.ReactNode
  disabled?: boolean
  name?: string
}) {
  const auto = useId()
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {choices.map((c, i) => {
          const checked = value === c.id
          return (
            <label
              key={c.id}
              className={cn(
                'relative flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border-2 bg-card px-3 py-2.5 text-sm leading-relaxed transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50',
                checked ? 'border-brand bg-info-soft' : 'border-border hover:border-lv2',
                disabled && 'cursor-default opacity-80',
              )}
            >
              <input type="radio" name={name ?? auto} value={c.id} checked={checked} onChange={() => onChange(c.id)} className="sr-only" />
              <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold', checked ? 'border-brand bg-brand text-primary-foreground' : 'border-input')} aria-hidden>
                {checked ? <Check className="size-3.5" /> : CHOICE_MARK[i]}
              </span>
              <span className="flex-1">
                <span className="sr-only">{CHOICE_MARK[i]}：</span>
                {c.text}
              </span>
              {checked && <span className="shrink-0 self-center text-xs font-bold text-brand">選択中</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** 正解・自分の回答・正誤を色以外でも示す一覧（結果・単問の解説後） */
export function AnsweredChoices({ choices, correctId, selectedId }: { choices: Choice[]; correctId: string; selectedId: string | null }) {
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {choices.map((c, i) => {
        const isCorrect = c.id === correctId
        const isMine = c.id === selectedId
        return (
          <li
            key={c.id}
            className={cn(
              'flex items-start gap-2 rounded-md border px-2.5 py-2 text-sm leading-relaxed',
              isCorrect ? 'border-success/40 bg-success-soft' : isMine ? 'border-danger/40 bg-danger-soft' : 'bg-card',
            )}
          >
            <span className="mt-0.5 font-mono text-xs font-bold">{CHOICE_MARK[i]}</span>
            <span className="flex-1">{c.text}</span>
            <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs font-bold">
              {isCorrect && (
                <span className="inline-flex items-center gap-0.5 text-success">
                  <CircleCheck className="size-3.5" aria-hidden />
                  正解
                </span>
              )}
              {isMine && <span className={isCorrect ? 'text-success' : 'text-danger'}>あなたの回答</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function Verdict({ correct }: { correct: boolean | null }) {
  if (correct === null)
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-dashed px-1.5 py-0.5 text-xs font-bold text-muted-foreground">
        <Minus className="size-3.5" aria-hidden />
        未回答
      </span>
    )
  return correct ? (
    <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success-soft px-1.5 py-0.5 text-xs font-bold text-success">
      <CircleCheck className="size-3.5" aria-hidden />
      正解
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md border border-danger/30 bg-danger-soft px-1.5 py-0.5 text-xs font-bold text-danger">
      <CircleX className="size-3.5" aria-hidden />
      不正解
    </span>
  )
}

/** 解説・参考文献。任意テキストはReactのテキストとして描画し、HTMLとして解釈しない */
export function Explanation({ v }: { v: QuestionVersion }) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted/60 px-3 py-2.5 text-sm leading-relaxed">
      <div>
        <p className="text-xs font-bold text-muted-foreground">解説</p>
        <p className="whitespace-pre-wrap">{v.explanation}</p>
      </div>
      {v.references.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground">参考文献</p>
          <ul className="flex flex-col gap-0.5">
            {v.references.map((r, i) => (
              <li key={i} className="text-sm">
                {r.url && /^https?:\/\//.test(r.url) ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand underline underline-offset-2">
                    {r.title}
                    <ExternalLink className="size-3" aria-hidden />
                    <span className="sr-only">（新しいタブで開く）</span>
                  </a>
                ) : (
                  r.title
                )}
                {r.publisher && <span className="text-muted-foreground">（{r.publisher}）</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** SCR-13 誤り報告 */
export function ReportButton({ questionId, versionId, attemptId = null, no, size = 'sm' }: { questionId: string; versionId: string; attemptId?: string | null; no: number; size?: 'sm' | 'xs' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn('inline-flex items-center gap-1 text-muted-foreground underline underline-offset-2 hover:text-foreground', size === 'xs' ? 'text-xs' : 'text-sm')}>
        <Flag className="size-3.5" aria-hidden />
        誤りを報告
      </button>
      <ReportDialog open={open} onClose={() => setOpen(false)} questionId={questionId} versionId={versionId} attemptId={attemptId} no={no} />
    </>
  )
}

function ReportDialog({ open, onClose, questionId, versionId, attemptId, no }: { open: boolean; onClose: () => void; questionId: string; versionId: string; attemptId: string | null; no: number }) {
  const [reason, setReason] = useState<ReportReason>('answer')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const close = () => {
    setBody('')
    setDone(false)
    setError(null)
    setReason('answer')
    onClose()
  }
  const send = () => {
    if (sending) return // 二重送信防止
    setSending(true)
    setError(null)
    setTimeout(() => {
      const r = runAction(submitReport, { questionId, versionId, attemptId, reason, body: body.trim() }, nowIso())
      setSending(false)
      if (r.ok) {
        setDone(true)
        toast(r.message ?? '報告を受け付けました')
      } else setError(r.message)
    }, 500)
  }
  return (
    <Dialog
      open={open}
      onClose={close}
      title={`問題 No.${no} の誤りを報告`}
      description="運営が内容を確認します。報告だけで問題が自動停止することはありません。"
      size="md"
      footer={
        done ? (
          <Button onClick={close}>閉じる</Button>
        ) : (
          <>
            <Button variant="outline" onClick={close}>
              キャンセル
            </Button>
            <Button onClick={send} disabled={sending || (reason === 'other' && !body.trim())}>
              {sending ? '送信中…' : error ? '再送信する' : '送信する'}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <Notice tone="success" title="送信が完了しました">
          ご報告ありがとうございます。対応状況の個別連絡は行いません（仮）。
        </Notice>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            送信内容：問題ID {questionId}／版 {versionId}
            {attemptId && <>／該当回 {attemptId}</>}
          </p>
          <Field label="理由" htmlFor="report-reason" required>
            <Select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
              {REPORT_REASON.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="詳細" htmlFor="report-body" hint={reason === 'other' ? '「その他」の場合は詳細を入力してください' : '任意。根拠となる資料があれば記載してください'}>
            <Textarea id="report-body" value={body} maxLength={1000} onChange={(e) => setBody(e.target.value)} />
          </Field>
          {error && (
            <Notice tone="danger" title="送信できませんでした">
              {error}
            </Notice>
          )}
        </div>
      )}
    </Dialog>
  )
}

export function MockTag({ children = '仮データ' }: { children?: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-md border border-dashed border-warning/60 px-1.5 py-0.5 text-[11px] font-bold text-warning">{children}</span>
}
