'use client'

import { Button } from '@/components/ui/button'
import { Dialog, Notice } from '@/components/kit/primitives'
import { toast } from '@/components/kit/toast'
import { mutate, useAppState } from '@/lib/store/store'
import { LEVEL_LABEL } from '@/lib/domain/labels'
import { Stars } from '@/components/quiz/bits'

/** 認証方式は未選定（TBD-06）。V0ではデモ用の利用者を選んでログインしたことにする */
export function LoginDialog({ open, onClose, onLoggedIn }: { open: boolean; onClose: () => void; onLoggedIn?: () => void }) {
  const s = useAppState()
  return (
    <Dialog open={open} onClose={onClose} title="ログイン（モック）" description="認証方式は技術相談中です。V0ではデモ用の利用者を選んでください。" size="md">
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {s.users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => {
                  mutate((d) => {
                    d.currentUserId = u.id
                  })
                  toast(`${u.name} としてログインしました（モック）`)
                  onClose()
                  onLoggedIn?.()
                }}
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 text-left hover:border-lv2 hover:bg-info-soft"
              >
                <span className="text-sm font-bold">{u.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-primary px-1.5 py-0.5 font-bold text-primary-foreground">{LEVEL_LABEL[u.level]}</span>
                  {u.level === 4 ? <Stars passes={u.expertPasses} className="text-sm" /> : <span className="tabular">合格 {u.passes}/3</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Notice tone="info">ログインすると合格実績・レベル・星と学習履歴を保存できます。ログインはサービス利用の必須条件ではありません。</Notice>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
