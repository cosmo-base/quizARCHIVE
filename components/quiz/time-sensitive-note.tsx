import { CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 時事問題：出題日の時点の内容であることを示す（postedOn は yyyy-mm-dd） */
export function TimeSensitiveNote({ postedOn, timeSensitive, className }: { postedOn?: string; timeSensitive?: boolean; className?: string }) {
  if (!timeSensitive || !postedOn) return null
  const [y, m, d] = postedOn.split('-').map(Number)
  if (!y || !m || !d) return null
  return (
    <p className={cn('flex items-start gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground', className)}>
      <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        {y}年{m}月{d}日の出題時点の内容です。その後、変わっている場合があります。
      </span>
    </p>
  )
}
