'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * お知らせの既読（この端末・このブラウザだけ。ログインは不要）。
 * ホームには未読のお知らせだけを出し、開くか「×」で閉じると既読にする。お知らせの一覧には既読も残す。
 * ブラウザの記録を消したり、別の端末で開いたりすると、また未読として出る。
 */
const KEY = 'cbquiz:notices-read'
const listeners = new Set<() => void>()
let cache: string | null | undefined

function readRaw(): string | null {
  if (cache !== undefined) return cache
  try {
    cache = window.localStorage.getItem(KEY)
  } catch {
    cache = null
  }
  return cache
}

function parse(raw: string | null): string[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function write(ids: string[]) {
  cache = JSON.stringify(ids)
  try {
    window.localStorage.setItem(KEY, cache)
  } catch {
    // 保存できなくても、開いている間は既読として扱う
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = undefined
      l()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(l)
    window.removeEventListener('storage', onStorage)
  }
}

/** 既読のお知らせID。サーバーでの書き出し時と読み込み前は null（未読を一瞬出さないため） */
export function useReadNotices() {
  const raw = useSyncExternalStore(subscribe, () => readRaw() ?? '', () => null)
  const read = raw === null ? null : new Set(parse(raw))
  const markRead = useCallback((id: string) => {
    const ids = parse(readRaw())
    if (!ids.includes(id)) write([...ids, id])
  }, [])
  /** 公開が終わったお知らせの既読を消す（記録が増え続けないように） */
  const prune = useCallback((liveIds: string[]) => {
    const ids = parse(readRaw())
    const kept = ids.filter((id) => liveIds.includes(id))
    if (kept.length !== ids.length) write(kept)
  }, [])
  return { read, markRead, prune }
}
