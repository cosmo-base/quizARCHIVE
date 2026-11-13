import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export function PageContainer({ children, className, narrow }: { children: React.ReactNode; className?: string; narrow?: boolean }) {
  return (
    <div className={cn('mx-auto flex w-full flex-col gap-6 px-4 py-6 md:px-6 md:py-10', narrow ? 'max-w-3xl' : 'max-w-6xl', className)}>
      {children}
    </div>
  )
}

export function PageHeading({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-balance md:text-3xl">{title}</h1>
        {description && <p className="text-pretty text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function SurfaceCard({ children, className, as: Tag = 'section', ...rest }: { children: React.ReactNode; className?: string; as?: 'section' | 'div' | 'article' } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn('rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(23,36,61,0.04),0_4px_16px_rgba(23,36,61,0.04)] md:p-6', className)} {...rest}>
      {children}
    </Tag>
  )
}

export function PageSkeleton() {
  return (
    <PageContainer>
      <span className="sr-only" role="status">
        読み込み中
      </span>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-5 w-80 max-w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </PageContainer>
  )
}
