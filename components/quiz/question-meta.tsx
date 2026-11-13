import { fieldName } from '@/lib/data/questions'
import type { QuestionDifficulty } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DifficultyBadge } from './badges'

export function accuracyText(accuracy: number | null) {
  return accuracy === null ? '未集計' : `${Math.round(accuracy * 100)}%`
}

/** 分野・問題難易度・正答率（1つだけ。由来ラベルは出さない） */
export function QuestionMeta({
  questionId,
  fieldId,
  difficulty,
  accuracy,
  showId = true,
  className,
}: {
  questionId?: string
  fieldId: string
  difficulty: QuestionDifficulty
  accuracy: number | null
  showId?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 text-sm', className)}>
      {showId && questionId && <span className="font-mono text-xs text-muted-foreground">{questionId}</span>}
      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{fieldName(fieldId)}</span>
      <DifficultyBadge difficulty={difficulty} />
      <span className="text-xs text-muted-foreground">
        正答率 <span className="font-bold text-foreground tabular-nums">{accuracyText(accuracy)}</span>
      </span>
    </div>
  )
}
