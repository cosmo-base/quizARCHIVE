'use client'

import { PlayCircle } from 'lucide-react'
import { LinkButton } from '@/components/link-button'
import { useInProgress } from '@/lib/api/hooks'
import { attemptTitle } from '@/lib/labels'
import { routes } from '@/lib/routes'
import type { Mode } from '@/lib/types'

export function ResumeBanner({ mode }: { mode?: Mode }) {
  const { data } = useInProgress()
  const a = (data ?? []).find((x) => !mode || x.mode === mode)
  if (!a) return null
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <p className="font-bold">{`回答中の${attemptTitle(a.mode, a.testKind)}があります`}</p>
        <p className="text-sm text-muted-foreground">{`${a.questionCount}問中 ${a.answeredCount}問回答済み。続きから再開できます。`}</p>
      </div>
      <LinkButton href={routes.attempt(a.id)} className="h-11 shrink-0">
        <PlayCircle aria-hidden="true" />
        再開する
      </LinkButton>
    </div>
  )
}
