import Link from 'next/link'
import { ChevronRight, Info, TriangleAlert } from 'lucide-react'
import { notices } from '@/lib/data/notices'
import { formatDate } from '@/lib/time'
import { cn } from '@/lib/utils'
import { routes } from '@/lib/routes'

export function NoticeList() {
  return (
    <section aria-labelledby="notices-heading" className="flex flex-col gap-2">
      <h2 id="notices-heading" className="text-sm font-medium text-muted-foreground">
        運営からのお知らせ
      </h2>
      <ul className="flex flex-col gap-2">
        {notices.map((n) => {
          const correction = n.kind === 'correction'
          const Icon = correction ? TriangleAlert : Info
          return (
            <li key={n.id}>
              <Link
                href={routes.notice(n.id)}
                className={cn(
                  'group flex items-start gap-3 rounded-xl border p-4 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  correction ? 'border-destructive/30 bg-destructive-soft hover:border-destructive/50' : 'bg-card hover:bg-muted/60',
                )}
              >
                <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', correction ? 'text-destructive' : 'text-primary')} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-xs font-bold',
                        correction ? 'bg-destructive text-primary-foreground' : 'bg-primary-soft text-primary',
                      )}
                    >
                      {correction ? '訂正' : 'お知らせ'}
                    </span>
                    <span className="font-medium text-pretty">{n.title}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    <time dateTime={n.publishedAt}>{formatDate(n.publishedAt)}</time>
                    {'　'}
                    {n.summary}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
