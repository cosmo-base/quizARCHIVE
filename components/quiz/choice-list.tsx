'use client'

import { Check, X } from 'lucide-react'
import type { Choice } from '@/lib/types'
import { cn } from '@/lib/utils'

const marks = ['A', 'B', 'C', 'D', 'E', 'F']

/**
 * 選択肢。reveal を渡したときだけ正誤を表示する。
 * 回答中は正解情報を渡さないこと。
 */
export function ChoiceList({
  name,
  choices,
  value,
  onChange,
  disabled,
  reveal,
  legend,
}: {
  name: string
  choices: Choice[]
  value: string | null
  onChange?: (choiceId: string) => void
  disabled?: boolean
  reveal?: { correctChoiceId: string }
  legend: string
}) {
  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      {choices.map((c, i) => {
        const id = `${name}-${c.id}`
        const selected = value === c.id
        const isCorrect = reveal && c.id === reveal.correctChoiceId
        const isWrongPick = reveal && selected && !isCorrect
        return (
          <label
            key={c.id}
            htmlFor={id}
            className={cn(
              'relative flex min-h-14 items-center gap-3 rounded-xl border-2 bg-card px-4 py-3 transition-colors',
              !disabled && 'cursor-pointer hover:border-primary/50',
              'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
              selected && !reveal && 'border-primary bg-primary/5',
              isCorrect && 'border-success bg-success-soft',
              isWrongPick && 'border-destructive bg-destructive-soft',
              reveal && !isCorrect && !isWrongPick && 'opacity-70',
            )}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={c.id}
              checked={selected}
              onChange={() => onChange?.(c.id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-bold',
                selected && !reveal && 'border-primary bg-primary text-primary-foreground',
                isCorrect && 'border-success bg-success text-primary-foreground',
                isWrongPick && 'border-destructive bg-destructive text-primary-foreground',
              )}
            >
              {isCorrect ? <Check className="size-4" /> : isWrongPick ? <X className="size-4" /> : marks[i]}
            </span>
            <span className="flex-1 leading-relaxed">{c.text}</span>
            {isCorrect && <span className="shrink-0 text-xs font-bold text-success">正解</span>}
            {isWrongPick && <span className="shrink-0 text-xs font-bold text-destructive">あなたの回答</span>}
            {reveal && selected && isCorrect && <span className="sr-only">（あなたの回答）</span>}
          </label>
        )
      })}
    </fieldset>
  )
}
