import { Star } from 'lucide-react'
import { starDisplay } from '@/lib/recognition'
import { cn } from '@/lib/utils'

export function StarRow({ expertPasses, size = 20, className }: { expertPasses: number; size?: number; className?: string }) {
  const d = starDisplay(expertPasses)
  const label = `専門家、${d.label}`
  if (d.units === 0) {
    return <span className={cn('text-sm text-muted-foreground', className)}>{d.label}</span>
  }
  return (
    <span role="img" aria-label={label} className={cn('inline-flex items-center gap-0.5 text-primary', className)}>
      {Array.from({ length: d.filled }).map((_, i) => (
        <Star key={`f${i}`} aria-hidden="true" width={size} height={size} fill="currentColor" strokeWidth={1.5} />
      ))}
      {Array.from({ length: d.outlined }).map((_, i) => (
        <Star key={`o${i}`} aria-hidden="true" width={size} height={size} strokeWidth={1.5} />
      ))}
      {d.plus !== null && (
        <span aria-hidden="true" className="ml-1 text-base font-bold tabular-nums">
          {'+'}
          {d.plus}
        </span>
      )}
    </span>
  )
}
