import { BookOpen, ExternalLink } from 'lucide-react'
import type { Reference } from '@/lib/types'

export function ExplanationBlock({ explanation, references }: { explanation: string; references: Reference[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-muted/60 p-4 md:p-5">
      <div className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <BookOpen aria-hidden="true" className="size-4 text-primary" />
          解説
        </h3>
        <p className="leading-relaxed text-pretty">{explanation}</p>
      </div>
      {references.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">参考文献</h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {references.map((r) => (
              <li key={r.title} className="leading-relaxed">
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                    {r.title}
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                    <span className="sr-only">（新しいタブで開きます）</span>
                  </a>
                ) : (
                  <span>{r.title}</span>
                )}
                {r.publisher && <span className="text-muted-foreground">{`　${r.publisher}`}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
