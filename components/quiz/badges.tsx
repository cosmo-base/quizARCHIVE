import { cn } from '@/lib/utils'
import { levelLabel, levelRank } from '@/lib/labels'
import type { QuestionDifficulty, UserLevel } from '@/lib/types'

function RankBars({ rank, className }: { rank: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('inline-flex items-end gap-0.5', className)}>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={cn('w-1 rounded-sm', n <= rank ? 'bg-current' : 'bg-current opacity-20')}
          style={{ height: `${4 + n * 2}px` }}
        />
      ))}
    </span>
  )
}

/** 問題難易度。枠線＋段階バー */
export function DifficultyBadge({ difficulty, className }: { difficulty: QuestionDifficulty; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-input bg-card px-2.5 text-xs font-medium text-foreground',
        className,
      )}
    >
      <RankBars rank={levelRank[difficulty]} className="text-primary" />
      <span>
        <span className="sr-only">問題難易度：</span>
        {levelLabel[difficulty]}
      </span>
    </span>
  )
}

/** 個人レベル。塗りつぶし＋「レベル」表記で問題難易度と区別 */
/** compact：狭い画面では「レベル」の文字を視覚的に隠す（読み上げは残す） */
export function UserLevelBadge({ level, size = 'md', className, compact = false }: { level: UserLevel; size?: 'md' | 'lg'; className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary font-medium whitespace-nowrap text-primary-foreground',
        size === 'lg' ? 'h-10 px-3.5 text-base' : 'h-7 px-2.5 text-xs',
        className,
      )}
    >
      <span className={cn('opacity-80', size === 'lg' ? 'text-sm' : 'text-[11px]', compact && 'max-sm:sr-only')}>レベル</span>
      <span>{levelLabel[level]}</span>
      <RankBars rank={levelRank[level]} />
    </span>
  )
}
