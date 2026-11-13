'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { DifficultyBadge } from '@/components/quiz/badges'
import { fields } from '@/lib/data/questions'
import { levels } from '@/lib/labels'
import type { QuestionDifficulty } from '@/lib/types'

export function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/** 分野・難易度の複数選択。軸内OR・軸間AND（モック仮仕様） */
export function FilterPanel({
  fieldIds,
  difficulties,
  onFieldsChange,
  onDifficultiesChange,
  idPrefix,
}: {
  fieldIds: string[]
  difficulties: QuestionDifficulty[]
  onFieldsChange: (v: string[]) => void
  onDifficultiesChange: (v: QuestionDifficulty[]) => void
  idPrefix: string
}) {
  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">分野</legend>
        {fields.map((f) => {
          const id = `${idPrefix}-field-${f.id}`
          return (
            <label key={f.id} htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted/60">
              <Checkbox id={id} checked={fieldIds.includes(f.id)} onCheckedChange={() => onFieldsChange(toggle(fieldIds, f.id))} />
              <span className="text-sm">{f.name}</span>
            </label>
          )
        })}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">問題の難易度</legend>
        {levels.map((l) => {
          const id = `${idPrefix}-diff-${l}`
          return (
            <label key={l} htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted/60">
              <Checkbox id={id} checked={difficulties.includes(l)} onCheckedChange={() => onDifficultiesChange(toggle(difficulties, l))} />
              <DifficultyBadge difficulty={l} />
            </label>
          )
        })}
      </fieldset>
    </div>
  )
}
