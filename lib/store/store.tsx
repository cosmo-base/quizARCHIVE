'use client'

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import type { AppState } from '@/lib/domain/types'
import type { Result } from '@/lib/domain/actions'
import { getUser } from '@/lib/domain/actions'
import { SCHEMA, createSeed } from '@/lib/mock/seed'

/**
 * モックサービス：モジュール内の外部ストア＋このブラウザの localStorage。
 * 本番では永続保存・認証つきのAPIへ差し替える（ブラウザ保存だけで認定・統計を実現したとしない）。
 */
const STORAGE_KEY = 'cb-quiz-v0'

const seed = createSeed()
let current: AppState = seed
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    } catch {
      // 保存できなくても画面操作は続行（モック）
    }
  }
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getState() {
  return current
}

export function runAction<A extends unknown[]>(fn: (s: AppState, ...args: A) => Result, ...args: A): Result {
  const draft = structuredClone(current)
  const r = fn(draft, ...args)
  current = draft
  emit()
  return r
}

export function mutate(fn: (s: AppState) => void) {
  const draft = structuredClone(current)
  fn(draft)
  current = draft
  emit()
}

export function resetDemo() {
  current = createSeed()
  emit()
}

const HydratedCtx = createContext(false)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AppState
        if (parsed && parsed.schema === SCHEMA && Array.isArray(parsed.questions)) {
          current = parsed
          for (const l of listeners) l()
        }
      }
    } catch {
      // 壊れた保存データは無視して初期データで続行
    }
    setHydrated(true)
  }, [])
  return <HydratedCtx.Provider value={hydrated}>{children}</HydratedCtx.Provider>
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => seed,
  )
}

export function useHydrated() {
  return useContext(HydratedCtx)
}

export function useCurrentUser() {
  const s = useAppState()
  return getUser(s, s.currentUserId)
}

export function useAction() {
  return useCallback(runAction, [])
}
