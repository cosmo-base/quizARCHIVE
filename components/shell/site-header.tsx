'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, ClipboardCheck, History, Home, LogOut, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DemoLoginDialog } from '@/components/quiz/demo-login-dialog'
import { UserLevelBadge } from '@/components/quiz/badges'
import { actions, currentUser, useAppState } from '@/lib/store'
import { cn } from '@/lib/utils'

export const navItems = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/questions', label: '過去問', icon: BookOpen },
  { href: '/practice', label: '練習', icon: PencilLine },
  { href: '/tests', label: 'テスト', icon: ClipboardCheck },
  { href: '/history', label: '学習履歴', icon: History },
]

export function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Wordmark() {
  return (
    <span className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-[17px] font-bold tracking-tight text-foreground">Cosmo Base</span>
      <span className="text-sm font-medium text-primary">宇宙クイズ</span>
    </span>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const state = useAppState()
  const user = state ? currentUser(state) : null
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Cosmo Base 宇宙クイズ ホーム">
          <Wordmark />
        </Link>

        <nav aria-label="メイン" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      active ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex min-h-10 items-center gap-2">
          {!state ? (
            <span className="h-9 w-24 animate-pulse rounded-lg bg-muted" aria-hidden="true" />
          ) : user ? (
            <>
              <Link href="/progress" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label={`個人レベルを見る`}>
                <UserLevelBadge level={user.level} compact />
              </Link>
              <Button variant="ghost" size="icon" className="size-10" aria-label="ログアウト" onClick={() => actions.logout()}>
                <LogOut aria-hidden="true" />
              </Button>
            </>
          ) : (
            <Button variant="outline" className="h-10 px-3.5" onClick={() => setLoginOpen(true)}>
              ログイン
            </Button>
          )}
        </div>
      </div>
      <DemoLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="メイン" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ul className="grid grid-cols-5">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-15 flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none focus-visible:bg-muted',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
