'use client'

import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { loginDemo } from '@/lib/api/client'

/** デモログイン。パスワードや個人情報は入力させない */
export function DemoLoginDialog({
  open,
  onOpenChange,
  onLoggedIn,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoggedIn?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { setError(''); onOpenChange(o) } }}>
      <DialogContent className="gap-5 p-6 sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">デモユーザーでログイン</DialogTitle>
          <DialogDescription className="leading-relaxed">
            これはUI確認用のデモログインです。メールアドレスやパスワードは入力しません。ログインすると、学習履歴・合格実績・レベルが保存されます。
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
            <UserRound aria-hidden="true" className="size-5" />
          </span>
          <div className="text-sm">
            <p className="font-medium">デモユーザー</p>
            <p className="text-muted-foreground">サンプルの学習履歴があります</p>
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="-mx-6 -mb-6 p-4 px-6">
          <Button variant="outline" className="h-11 px-4" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            className="h-11 px-5"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              setError('')
              loginDemo()
                .then(() => {
                  onOpenChange(false)
                  onLoggedIn?.()
                })
                .catch(() => setError('ログインできませんでした。もう一度お試しください。'))
                .finally(() => setBusy(false))
            }}
          >
            {busy ? 'ログインしています…' : 'ログインする'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
