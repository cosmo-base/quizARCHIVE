import { testConfig } from '@/lib/config'
import { levelLabel } from '@/lib/labels'
import { nextLevel, starDisplay } from '@/lib/recognition'
import type { UserProfile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { StarRow } from './star-row'

/** 累計合格の進捗（○/3回合格）。不合格でリセットしない */
export function PassDots({ passes, className }: { passes: number; className?: string }) {
  const total = testConfig.passesToPromote
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn('h-2 w-8 rounded-full', i < passes ? 'bg-primary' : 'bg-border')} />
      ))}
    </span>
  )
}

export function LevelProgressSummary({ user }: { user: UserProfile }) {
  if (user.level === 'expert') {
    const star = starDisplay(user.expertPasses)
    return (
      <div className="flex flex-col gap-2">
        <StarRow expertPasses={user.expertPasses} size={22} />
        <p className="text-sm text-muted-foreground">
          {`専門家になってから${user.expertPasses}回合格。次の星まであと`}
          <span className="font-bold text-foreground">{`${star.remainingToNext}回`}</span>
          の合格
        </p>
      </div>
    )
  }
  const next = nextLevel(user.level)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <PassDots passes={user.passesAtCurrentLevel} />
        <span className="font-bold tabular-nums">{`${user.passesAtCurrentLevel}／${testConfig.passesToPromote}回合格`}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {next ? `あと${testConfig.passesToPromote - user.passesAtCurrentLevel}回の合格で${levelLabel[next]}に昇格` : ''}
      </p>
    </div>
  )
}
