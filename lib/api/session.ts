'use client'

import { useSyncExternalStore } from 'react'
import type { SessionInfo } from './types'

/**
 * ブラウザ側で持つログイン状態とゲストID。
 * 表示名はこの端末にだけ保存し、サーバー（スプシ）には保存しない。
 */
const SESSION_KEY = 'cosmo-quiz-session'
const GUEST_KEY = 'cosmo-quiz-guest-id'

const listeners = new Set<() => void>()
let cached: SessionInfo | null | undefined

function read(): SessionInfo | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as SessionInfo
    if (!s.token || new Date(s.expiresAt).getTime() <= Date.now()) return null
    return s
  } catch {
    return null
  }
}

export function getSession(): SessionInfo | null {
  if (typeof window === 'undefined') return null
  if (cached === undefined) cached = read()
  return cached
}

export function setSession(s: SessionInfo | null) {
  cached = s
  try {
    if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // 保存できなくても、この画面の間はログイン状態を保つ
  }
  for (const l of listeners) l()
}

export function getGuestId(): string {
  try {
    let id = window.localStorage.getItem(GUEST_KEY)
    if (!id) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(GUEST_KEY, id)
    }
    return id
  } catch {
    return 'guest-unsaved'
  }
}

function subscribe(l: () => void) {
  listeners.add(l)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== SESSION_KEY) return
    cached = undefined
    l()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(l)
    window.removeEventListener('storage', onStorage)
  }
}

/** ログイン状態。サーバー描画時と読み込み前は undefined */
export function useSession(): SessionInfo | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getSession(),
    () => undefined,
  )
}
