import { Check, Clock, RotateCcw, X } from 'lucide-react'
import { isPassed } from '@/lib/scoring'
import type { Attempt } from '@/lib/types'
import { cn } from '@/lib/utils'

/** 合否・完了の小さなラベル。色だけで表さずアイコンと文字を併用 */
export function AttemptOutcome({ attempt, className }: { attempt: Attempt; className?: string }) {
  const base = 'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold whitespace-nowrap'
  if (!attempt.finalized) {
    return (
      <span className={cn(base, 'bg-muted text-muted-foreground', className)}>
        <Clock aria-hidden="true" className="size-3.5" />
        回答中
      </span>
    )
  }
  if (attempt.mode === 'test') {
    const passed = isPassed(attempt)
    return passed ? (
      <span className={cn(base, 'bg-success-soft text-success', className)}>
        <Check aria-hidden="true" className="size-3.5" />
        合格
      </span>
    ) : (
      <span className={cn(base, 'bg-destructive-soft text-destructive', className)}>
        <X aria-hidden="true" className="size-3.5" />
        不合格
      </span>
    )
  }
  if (attempt.mode === 'review') {
    return (
      <span className={cn(base, 'bg-primary-soft text-primary', className)}>
        <RotateCcw aria-hidden="true" className="size-3.5" />
        復習
      </span>
    )
  }
  return <span className={cn(base, 'bg-muted text-muted-foreground', className)}>完了</span>
}
