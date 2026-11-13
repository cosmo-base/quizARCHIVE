'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/kit/primitives'
import { LoginDialog } from '@/components/shell/login-dialog'
import { useCurrentUser, useHydrated } from '@/lib/store/store'
import { cn } from '@/lib/utils'

export function HistoryFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const [login, setLogin] = useState(false)
  const tabs = [
    { href: '/history', label: '回ごとの履歴' },
    { href: '/history/questions', label: '解いた問題' },
  ]
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-xl font-bold md:text-2xl">学習履歴</h1>
      <p className="mb-4 text-sm text-muted-foreground">あなたの履歴は本人にのみ表示されます。ランキングや他の参加者への公開はありません。</p>
      <nav aria-label="学習履歴の表示切替" className="mb-4 flex gap-1 border-b">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={pathname === t.href ? 'page' : undefined}
            className={cn('-mb-px flex min-h-10 items-center border-b-2 px-3 text-sm', pathname === t.href ? 'border-primary font-bold text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {!hydrated ? (
        <p className="text-sm text-muted-foreground">読み込み中…</p>
      ) : !user ? (
        <EmptyState
          title="学習履歴はログイン利用者向けの機能です"
          action={
            <Button onClick={() => setLogin(true)}>
              <LogIn aria-hidden />
              ログイン
            </Button>
          }
        >
          ゲストの結果は終了直後の結果画面で確認できます。ゲストの履歴の扱い・ログイン後の移行は検討中です（TBD-06）。
        </EmptyState>
      ) : (
        children
      )}
      <LoginDialog open={login} onClose={() => setLogin(false)} />
    </div>
  )
}
