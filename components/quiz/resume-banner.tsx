'use client'

import { PlayCircle } from 'lucide-react'
import { LinkButton } from '@/components/link-button'

import { attemptTitle } from '@/lib/labels'
import { inProgressAttempts } from '@/lib/selectors'
import type { AppState } from '@/lib/store'
import type { Mode } from '@/lib/types'
import { routes } from '@/lib/routes'

export function ResumeBanner({ state, mode }: { state: AppState; mode?: Mode }) {
  const list = inProgressAttempts(state).filter((a) => !mode || a.mode === mode)
  const a = list[0]
  if (!a) return null
  const answered = Object.values(a.answers).filter(Boolean).length
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <p className="font-bold">{`回答中の${attemptTitle(a.mode, a.testKind)}があります`}</p>
        <p className="text-sm text-muted-foreground">{`${a.questionSnapshots.length}問中 ${answered}問回答済み。続きから再開できます。`}</p>
      </div>
      <LinkButton href={routes.attempt(a.id)} className="h-11 shrink-0">
          <PlayCircle aria-hidden="true" />
          再開する
        </LinkButton>
    </div>
  )
}
