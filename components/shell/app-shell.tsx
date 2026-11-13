'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, FlaskConical, History, Home, Lock, LogIn, LogOut, Medal, Menu, PencilLine, Timer, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/kit/primitives'
import { toast } from '@/components/kit/toast'
import { mutate, useAppState, useCurrentUser } from '@/lib/store/store'
import { LEVEL_LABEL } from '@/lib/domain/labels'
import { cn } from '@/lib/utils'
import { DemoMenu } from './demo-menu'
import { LoginDialog } from './login-dialog'

const NAV = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/questions', label: '過去問一覧', icon: BookOpen },
  { href: '/practice', label: '練習', icon: PencilLine },
  { href: '/test', label: 'テスト', icon: Timer },
  { href: '/history', label: '学習履歴', icon: History },
  { href: '/level', label: 'レベル・星', icon: Medal },
]

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
}

function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] font-bold text-brand">Cosmo Base</span>
        <span className="text-sm font-bold">
          <span className="hidden sm:inline">毎日宇宙クイズ </span>過去問
        </span>
      </span>
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const s = useAppState()
  const user = useCurrentUser()
  const [drawer, setDrawer] = useState(false)
  const [demo, setDemo] = useState(false)
  const [login, setLogin] = useState(false)

  // FR-14 回答中はログイン／ログアウトのUI操作を不可にする
  const playingId = pathname.startsWith('/play/') ? pathname.split('/')[2] : null
  const authLocked = !!playingId && s.attempts.some((a) => a.id === playingId && a.status === 'in_progress')

  const logout = () => {
    mutate((d) => {
      d.currentUserId = null
    })
    toast('ログアウトしました（モック）')
  }

  const authArea = authLocked ? (
    <span className="inline-flex h-10 items-center gap-1.5 rounded-md border border-dashed px-2.5 text-xs text-muted-foreground md:h-8" title="回答中はログイン状態を変更できません">
      <Lock className="size-3.5" aria-hidden />
      <span className="hidden sm:inline">回答中はログイン操作不可</span>
      <span className="sr-only sm:hidden">回答中はログイン操作できません</span>
    </span>
  ) : user ? (
    <div className="flex items-center gap-1.5">
      <span className="hidden max-w-48 items-center gap-1.5 truncate text-sm md:inline-flex">
        <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">{user.name}</span>
        <span className="rounded bg-primary px-1.5 text-xs font-bold text-primary-foreground">{LEVEL_LABEL[user.level]}</span>
      </span>
      <Button variant="outline" onClick={logout}>
        <LogOut aria-hidden />
        <span className="hidden sm:inline">ログアウト</span>
        <span className="sr-only sm:hidden">ログアウト</span>
      </Button>
    </div>
  ) : (
    <Button onClick={() => setLogin(true)}>
      <LogIn aria-hidden />
      <span className="hidden sm:inline">ログイン</span>
      <span className="sr-only sm:hidden">ログイン</span>
    </Button>
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 border-b bg-warning-soft px-3 py-1 text-center text-xs">
        <span className="font-bold text-warning">V0モック</span>
        <span>問題・正答率・利用者はすべて仮データです。実際の認証・保存・集計は行いません（このブラウザ内のみ）</span>
      </div>
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 md:px-6">
          <button type="button" onClick={() => setDrawer(true)} className="-ml-1 rounded-md p-2.5 hover:bg-muted lg:hidden" aria-label="メニューを開く">
            <Menu className="size-5" />
          </button>
          <Logo />
          <nav aria-label="メイン" className="ml-4 hidden items-center gap-0.5 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(pathname, n.href) ? 'page' : undefined}
                className={cn('rounded-md px-2.5 py-1.5 text-sm transition-colors', isActive(pathname, n.href) ? 'bg-accent font-bold text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDemo(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-dashed border-warning/60 px-2.5 text-xs font-bold text-warning hover:bg-warning-soft md:h-8"
            >
              <FlaskConical className="size-4" aria-hidden />
              <span className="hidden sm:inline">デモ操作</span>
              <span className="sr-only sm:hidden">デモ操作</span>
            </button>
            {authArea}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">Cosmo Base 毎日宇宙クイズ 過去問練習サイト（V0モック）・成績は本人のみに表示されます</footer>
      <Dialog open={drawer} onClose={() => setDrawer(false)} title="メニュー" side="left">
        <nav aria-label="メイン" className="-mx-2 flex flex-col gap-0.5">
          {NAV.map((n) => {
            const Icon = n.icon
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setDrawer(false)}
                aria-current={isActive(pathname, n.href) ? 'page' : undefined}
                className={cn('flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-sm', isActive(pathname, n.href) ? 'bg-accent font-bold text-accent-foreground' : 'hover:bg-muted')}
              >
                <Icon className="size-4" aria-hidden />
                {n.label}
              </Link>
            )
          })}
        </nav>
      </Dialog>
      <DemoMenu open={demo} onClose={() => setDemo(false)} playingId={authLocked ? playingId : null} />
      <LoginDialog open={login} onClose={() => setLogin(false)} />
    </div>
  )
}
