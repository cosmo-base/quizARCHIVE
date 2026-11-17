/**
 * Discord ログインのブラウザ側の処理（docs/api.md 6章）。
 * クライアントIDは公開されても問題ない値。ビルド時に環境変数で渡す（コードには書かない）。
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? ''
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const STATE_KEY = 'cosmo-quiz-login-state'
const SCOPE = 'identify guilds.members.read' // メールアドレス（email）は求めない

export const isDiscordLoginReady = CLIENT_ID !== ''

export function redirectUri() {
  return `${window.location.origin}${BASE_PATH}/auth/callback`
}

/** ログイン後に戻る先として受け付けるのは、このサイトの中のパスだけ */
export function safeReturnTo(path: unknown): string {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return '/'
  if (path.startsWith('/auth/callback')) return '/'
  return path
}

/** 今の画面のパス（公開パスを除く）。ログイン後にここへ戻る */
export function currentPath() {
  const p = window.location.pathname
  const path = BASE_PATH && p.startsWith(BASE_PATH) ? p.slice(BASE_PATH.length) || '/' : p
  return `${path}${window.location.search}`
}

function randomState() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Discord の認可画面へ移動する */
export function startDiscordLogin(returnTo: string = currentPath()) {
  if (!isDiscordLoginReady) throw new Error('Discord ログインの設定がありません。')
  const state = randomState()
  sessionStorage.setItem(STATE_KEY, JSON.stringify({ state, returnTo: safeReturnTo(returnTo) }))
  const q = new URLSearchParams({ client_id: CLIENT_ID, response_type: 'code', scope: SCOPE, redirect_uri: redirectUri(), state, prompt: 'none' })
  window.location.assign(`https://discord.com/oauth2/authorize?${q.toString()}`)
}

/** 保存した state と戻り先を取り出す（一度だけ使える） */
export function takeLoginState(): { state: string; returnTo: string } | null {
  try {
    const raw = sessionStorage.getItem(STATE_KEY)
    sessionStorage.removeItem(STATE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as { state?: unknown; returnTo?: unknown }
    if (typeof v.state !== 'string' || !v.state) return null
    return { state: v.state, returnTo: safeReturnTo(v.returnTo) }
  } catch {
    return null
  }
}
