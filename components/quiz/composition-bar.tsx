import { levelLabel, levels } from '@/lib/labels'
import type { Composition, CompositionKey } from '@/lib/types'
import { cn } from '@/lib/utils'

const keys: CompositionKey[] = [...levels, 'any']
const keyLabel = (k: CompositionKey) => (k === 'any' ? '全難易度から' : levelLabel[k])
const shade: Record<CompositionKey, string> = {
  beginner: 'bg-primary/25',
  intermediate: 'bg-primary/50',
  advanced: 'bg-primary/75',
  expert: 'bg-primary',
  any: 'bg-muted-foreground/40',
}

export function CompositionBar({ composition, className }: { composition: Composition; className?: string }) {
  const total = keys.reduce((sum, k) => sum + (composition[k] ?? 0), 0)
  const active = keys.filter((k) => (composition[k] ?? 0) > 0)
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {active.map((k) => (
          <div key={k} className={shade[k]} style={{ width: `${((composition[k] ?? 0) / total) * 100}%` }} />
        ))}
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">問題難易度の構成</caption>
        <thead>
          <tr className="text-xs text-muted-foreground">
            {keys.map((k) => (
              <th key={k} scope="col" className="px-1 pb-1 text-center font-normal">
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true" className={cn('size-2 rounded-full', shade[k])} />
                  {keyLabel(k)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {keys.map((k) => (
              <td key={k} className={cn('px-1 text-center tabular-nums', (composition[k] ?? 0) === 0 ? 'text-muted-foreground' : 'font-medium')}>
                {composition[k] ?? 0}
                <span className="text-xs text-muted-foreground">問</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
