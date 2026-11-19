'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/link-button'
import { PageContainer, SurfaceCard } from '@/components/shell/page'
import { loginWithDiscordCode } from '@/lib/api/client'
import { ApiError } from '@/lib/api/types'
import { redirectUri, startDiscordLogin, takeLoginState } from '@/lib/auth/discord'

/** Discord から戻ってきたところ。state を確かめて GAS でログインし、元の画面へ戻る */
export function AuthCallbackView() {
  const params = useSearchParams()
  const router = useRouter()
  const started = useRef(false)
  const [error, setError] = useState('')
  const [returnTo, setReturnTo] = useState('/')

  useEffect(() => {
    if (started.current) return // code は一度しか使えないため、二重に送らない
    started.current = true
    const saved = takeLoginState()
    if (saved) setReturnTo(saved.returnTo)
    if (params.get('error')) {
      setError(params.get('error') === 'access_denied' ? 'ログインを取りやめました。' : 'ログインできませんでした。もう一度お試しください。')
      return
    }
    const code = params.get('code')
    if (!saved || !code || params.get('state') !== saved.state) {
      setError('ログインの確認ができませんでした。もう一度ログインしてください。')
      return
    }
    loginWithDiscordCode(code, redirectUri())
      .then(() => router.replace(saved.returnTo))
      .catch((e: unknown) => {
        if (e instanceof ApiError && (e.code === 'NOT_MEMBER' || e.code === 'BUSY')) setError(e.message)
        else setError('ログインできませんでした。もう一度お試しください。')
      })
  }, [params, router])

  return (
    <PageContainer narrow>
      <SurfaceCard className="flex flex-col gap-4">
        {error ? (
          <>
            <h1 className="text-lg font-bold">ログインできませんでした</h1>
            <p role="alert" className="leading-relaxed">{error}</p>
            <div className="flex flex-wrap gap-3">
              <Button className="h-11 px-5" onClick={() => startDiscordLogin(returnTo)}>もう一度ログイン</Button>
              <LinkButton href={returnTo} variant="outline" className="h-11 px-5">ログインせずに戻る</LinkButton>
            </div>
          </>
        ) : (
          <p role="status" className="text-muted-foreground">ログインしています…</p>
        )}
      </SurfaceCard>
    </PageContainer>
  )
}
