'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Panel } from '@/components/kit/primitives'
import { PageTitle, Stars } from '@/components/quiz/bits'
import { LoginDialog } from '@/components/shell/login-dialog'
import { useCurrentUser } from '@/lib/store/store'
import { LEVEL_LABEL, TEST_LABEL } from '@/lib/domain/labels'
import { ELIGIBLE_TEST, GUIDE_SEC, PASSES_TO_PROMOTE, formatGuide, starInfo } from '@/lib/domain/rules'
import type { Level } from '@/lib/domain/types'
import { cn } from '@/lib/utils'

const STAR_STEPS = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]

export default function LevelPage() {
  const user = useCurrentUser()
  const [login, setLogin] = useState(false)
  const levels: Level[] = [1, 2, 3, 4]

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PageTitle title="レベル・星">個人レベルは認定テストの合格で自動的に上がります。降格はありません。問題の難易度（初級〜専門家）とは別のものです。</PageTitle>

      {user ? (
        <Panel title="現在の状況">
          <ol className="mb-4 grid grid-cols-4 gap-1.5" aria-label="レベルの段階">
            {levels.map((l) => (
              <li
                key={l}
                aria-current={l === user.level ? 'step' : undefined}
                className={cn('rounded-md border px-2 py-2 text-center text-sm', l === user.level ? 'border-primary bg-primary font-bold text-primary-foreground' : l < user.level ? 'bg-info-soft text-accent-foreground' : 'bg-card text-muted-foreground')}
              >
                {LEVEL_LABEL[l]}
                {l < user.level && <span className="sr-only">（到達済み）</span>}
                {l === user.level && <span className="block text-[10px] font-normal">現在</span>}
              </li>
            ))}
          </ol>
          {user.level < 4 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">
                {TEST_LABEL[ELIGIBLE_TEST[user.level]]}の累計合格 <span className="tabular text-2xl font-bold">{user.passes}</span> / {PASSES_TO_PROMOTE}回
              </p>
              <div className="flex gap-1.5" aria-hidden>
                {Array.from({ length: PASSES_TO_PROMOTE }).map((_, i) => (
                  <span key={i} className={cn('h-3 flex-1 rounded-full', i < user.passes ? 'bg-brand' : 'bg-muted')} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">あと{PASSES_TO_PROMOTE - user.passes}回合格すると{LEVEL_LABEL[(user.level + 1) as Level]}に昇格します。不合格でも合格回数は減りません。</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-sm">専門家テストの累計合格 {user.expertPasses}回</p>
              <Stars passes={user.expertPasses} className="text-3xl" />
              <p className="text-sm text-muted-foreground">次の表示まであと{starInfo(user.expertPasses).toNext}回の合格（昇格までの合格は星に数えません）</p>
            </div>
          )}
          <Link href="/test" className={cn(buttonVariants(), 'mt-4')}>
            {TEST_LABEL[ELIGIBLE_TEST[user.level]]}を受ける
          </Link>
        </Panel>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">ログインすると、あなたのレベル・合格回数・星を確認できます。</p>
          <Button onClick={() => setLogin(true)}>
            <LogIn aria-hidden />
            ログイン
          </Button>
        </div>
      )}

      <Panel title="昇格のしくみ">
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">
          <li>全員が初級からスタートします。</li>
          <li>40問中32問以上の正解で1回合格。同じ段階で累計3回合格すると自動で昇格します。</li>
          <li>昇格後は、次の段階の合格を0から数えます。受験の回数・間隔に制限はありません。</li>
          <li>ログインして受けた、自分の段階のテストだけが認定対象です。</li>
        </ul>
      </Panel>

      <Panel title="専門家の星">
        <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7">
          {STAR_STEPS.map((n) => {
            const reached = user?.level === 4 && user.expertPasses >= n
            return (
              <li key={n} className={cn('rounded-md border px-1 py-2 text-center', reached ? 'border-brand bg-info-soft' : 'bg-card')}>
                <p className="tabular text-xs font-bold">{n}回</p>
                <Stars passes={n} className="text-sm" />
              </li>
            )
          })}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">以後も合格3回ごとに＋1。白星を5個そろえた後は塗りつぶし、黒星6個目からは数値で表示します。</p>
      </Panel>

      <Panel title="練習の目安時間（個人レベル別）">
        <table className="w-full text-sm">
          <caption className="sr-only">練習の目安時間</caption>
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-normal">個人レベル</th>
              <th className="py-1.5 font-normal">1問</th>
              <th className="py-1.5 font-normal">40問換算</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((l) => (
              <tr key={l} className={cn('border-b last:border-0', user?.level === l && 'bg-info-soft font-bold')}>
                <td className="py-1.5">{LEVEL_LABEL[l]}</td>
                <td className="tabular py-1.5">{formatGuide(GUIDE_SEC[l])}</td>
                <td className="tabular py-1.5">{formatGuide(GUIDE_SEC[l] * 40)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted-foreground">練習の目安であり、強制終了時間ではありません。テストは全員共通で60分です。</p>
      </Panel>
      <LoginDialog open={login} onClose={() => setLogin(false)} />
    </div>
  )
}
