'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DemoLoginDialog } from '@/components/quiz/demo-login-dialog'
import { isMockApi } from '@/lib/api/client'
import { isDiscordLoginReady, startDiscordLogin } from '@/lib/auth/discord'

/** ログインの入口。GAS につないでいるときは Discord ログイン、モックのときはデモログイン */
export function LoginDialog(props: { open: boolean; onOpenChange: (open: boolean) => void; onLoggedIn?: () => void }) {
  if (isMockApi) return <DemoLoginDialog {...props} />
  return <DiscordLoginDialog open={props.open} onOpenChange={props.onOpenChange} />
}

function DiscordLoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [moving, setMoving] = useState(false)
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!moving) onOpenChange(o) }}>
      <DialogContent className="gap-5 p-6 sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Discord でログイン</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Cosmo Base の Discord サーバーに参加している人がログインできます。ログインすると、学習履歴・合格実績・レベルが保存されます。
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Discord から受け取るのは、サーバーに参加しているかの確認と、画面に表示する名前だけです。メールアドレスは受け取りません。
        </p>
        {!isDiscordLoginReady && <p role="alert" className="text-sm text-destructive">ログインは準備中です。</p>}
        <DialogFooter className="-mx-6 -mb-6 p-4 px-6">
          <Button variant="outline" className="h-11 px-4" disabled={moving} onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            className="h-11 px-5"
            disabled={moving || !isDiscordLoginReady}
            onClick={() => {
              setMoving(true)
              startDiscordLogin()
            }}
          >
            {moving ? 'Discord に移動しています…' : 'Discord でログイン'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
