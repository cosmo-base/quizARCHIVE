'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, Notice, Select, Switch } from '@/components/kit/primitives'
import { toast } from '@/components/kit/toast'
import { mutate, resetDemo, useAppState } from '@/lib/store/store'

/** デモ専用の操作。参加者向け機能ではない */
export function DemoMenu({ open, onClose, playingId }: { open: boolean; onClose: () => void; playingId: string | null }) {
  const s = useAppState()
  const [confirmReset, setConfirmReset] = useState(false)
  const playing = playingId ? s.attempts.find((a) => a.id === playingId) : null

  const flag = (key: keyof typeof s.demo, label: string) => (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="leading-relaxed">{label}</span>
      <Switch
        label={label}
        checked={s.demo[key]}
        onChange={(v) =>
          mutate((d) => {
            d.demo[key] = v
          })
        }
      />
    </label>
  )

  return (
    <Dialog open={open} onClose={onClose} title="デモ操作" description="画面と状態遷移を確認するためのV0専用の操作です。" size="md">
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold">失敗状態の再現</h3>
          {flag('failNextSave', '次の回答保存を失敗させる（未同期の表示）')}
          {flag('failNextReport', '次の誤り報告の送信を失敗させる')}
          {flag('failNextLoad', '次の一覧読み込みを失敗させる')}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">時間</h3>
          {playing?.deadline ? (
            <Button
              variant="outline"
              onClick={() => {
                mutate((d) => {
                  const a = d.attempts.find((x) => x.id === playingId)
                  if (a) a.deadline = new Date(Date.now() + 15000).toISOString()
                })
                toast('残り時間を15秒にしました（デモ）')
                onClose()
              }}
            >
              この回の残り時間を15秒にする
            </Button>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">制限時間つきの練習・テストを回答中に、残り時間を短縮して時間切れを確認できます。</p>
          )}
          <Button
            variant="outline"
            onClick={() => {
              mutate((d) => {
                d.setHistory = {}
              })
              toast('重複防止用の履歴をリセットしました（日付変更の再現）')
            }}
          >
            日付変更を再現（重複防止履歴のみリセット）
          </Button>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">難易度の再判定間隔（運営設定の仮）</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">最低認定件数 {s.rule.minN} 件は固定。間隔変更後の次の境界は「前回判定件数＋新間隔」とする仮置き（TBD-07）。</p>
          <Select
            aria-label="再判定間隔"
            value={String(s.rule.interval)}
            onChange={(e) => {
              const v = Number(e.target.value)
              mutate((d) => {
                d.rule.interval = v
              })
              toast(`再判定間隔を${v}件にしました`)
            }}
          >
            <option value="10">10件ごと（初期設定）</option>
            <option value="100">100件ごと</option>
          </Select>
        </section>

        <section className="flex flex-col gap-2 border-t pt-4">
          {confirmReset ? (
            <Notice tone="danger" title="初期状態に戻しますか？">
              <p>このブラウザに保存した回答・履歴・レベルの変化はすべて消えます。</p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    resetDemo()
                    setConfirmReset(false)
                    toast('デモを初期状態に戻しました')
                    onClose()
                  }}
                >
                  リセットする
                </Button>
                <Button variant="outline" onClick={() => setConfirmReset(false)}>
                  やめる
                </Button>
              </div>
            </Notice>
          ) : (
            <Button variant="outline" onClick={() => setConfirmReset(true)}>
              デモを初期状態に戻す
            </Button>
          )}
        </section>
      </div>
    </Dialog>
  )
}
