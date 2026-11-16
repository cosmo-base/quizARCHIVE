'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, Flag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { reportReasonLabel } from '@/lib/labels'
import { api, newRequestId } from '@/lib/api/client'
import type { ReportReason } from '@/lib/types'
import { cn } from '@/lib/utils'

type Phase = 'form' | 'sending' | 'done' | 'failed'
const reasons = Object.keys(reportReasonLabel) as ReportReason[]

export function ReportDialog({ questionId, versionId, attemptId, triggerClassName }: { questionId: string; versionId: string; attemptId?: string; triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [detail, setDetail] = useState('')
  const [phase, setPhase] = useState<Phase>('form')
  const [touched, setTouched] = useState(false)
  /** 同じ報告の再送を一度だけ受け付けるための識別子（フォームを開き直すと新しくなる） */
  const requestId = useRef<string | null>(null)

  const detailRequired = reason === 'other'
  const reasonError = touched && !reason
  const detailError = touched && detailRequired && detail.trim().length === 0

  const reset = () => {
    requestId.current = null
    setReason(null)
    setDetail('')
    setPhase('form')
    setTouched(false)
  }

  const send = async () => {
    setTouched(true)
    if (!reason || (detailRequired && !detail.trim()) || phase === 'sending') return
    setPhase('sending')
    try {
      requestId.current ??= newRequestId()
      await api.reportsCreate({ questionId, versionId, attemptId, reason, detail: detail.trim(), requestId: requestId.current })
      setPhase('done')
    } catch {
      setPhase('failed')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (phase === 'sending') return
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="sm" className={cn('h-10 text-muted-foreground', triggerClassName)} />}>
        <Flag aria-hidden="true" />
        誤りを報告
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {phase === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 aria-hidden="true" className="size-10 text-success" />
            <DialogTitle>報告を受け付けました</DialogTitle>
            <DialogDescription>確認のうえ、必要に応じて問題を修正します。ご協力ありがとうございます。</DialogDescription>
            <Button className="mt-2 h-11 w-full" onClick={() => setOpen(false)}>
              閉じる
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>問題の誤りを報告</DialogTitle>
              <DialogDescription>{`${questionId} について、気づいた点を教えてください。`}</DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-5"
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
            >
              <fieldset className="flex flex-col gap-2" aria-describedby={reasonError ? 'report-reason-error' : undefined}>
                <legend className="mb-2 text-sm font-bold">
                  報告の種類<span className="ml-1 text-destructive">必須</span>
                </legend>
                {reasons.map((r) => (
                  <label
                    key={r}
                    className={cn(
                      'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                      reason === r && 'border-primary bg-primary/5',
                    )}
                  >
                    <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="size-4 accent-primary" />
                    <span className="text-sm">{reportReasonLabel[r]}</span>
                  </label>
                ))}
                {reasonError && (
                  <p id="report-reason-error" className="text-sm text-destructive">
                    報告の種類を選んでください。
                  </p>
                )}
              </fieldset>
              <div className="flex flex-col gap-2">
                <label htmlFor="report-detail" className="text-sm font-bold">
                  詳しい内容
                  {detailRequired ? <span className="ml-1 text-destructive">必須</span> : <span className="ml-1 font-normal text-muted-foreground">任意</span>}
                </label>
                <Textarea
                  id="report-detail"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={4}
                  maxLength={500}
                  aria-invalid={detailError || undefined}
                  aria-describedby={detailError ? 'report-detail-error' : undefined}
                  placeholder="どこが、どのように誤っているか"
                />
                {detailError && (
                  <p id="report-detail-error" className="text-sm text-destructive">
                    「その他」を選んだ場合は内容を入力してください。
                  </p>
                )}
              </div>
              {phase === 'failed' && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  送信できませんでした。入力内容はそのままです。もう一度お試しください。
                </p>
              )}
              <DialogFooter>
                <Button type="submit" className="h-11 w-full" disabled={phase === 'sending'}>
                  {phase === 'sending' ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
                  {phase === 'sending' ? '送信中…' : phase === 'failed' ? 'もう一度送信' : '送信する'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
