'use client'

import { useSyncExternalStore } from 'react'

/** 画面の色（端末に合わせる／ライト／ダーク）。選んだものはこの端末にだけ保存する */
export type ThemeChoice = 'system' | 'light' | 'dark'

export const THEME_KEY = 'cosmo-quiz-theme'
const NAVY = '#000033'
const LIGHT_BG = '#f7f7fc'

/** 読み込み直後に色を決めるスクリプト（白く光るのを防ぐ）。app/layout.tsx の head で実行する */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light'}catch(e){}})()`

const listeners = new Set<() => void>()

function readChoice(): ThemeChoice {
  try {
    const v = window.localStorage.getItem(THEME_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function systemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** 選択に合わせて html の class と、ブラウザの上の帯の色を変える */
export function applyTheme(choice: ThemeChoice = readChoice()) {
  const dark = choice === 'dark' || (choice === 'system' && systemDark())
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? NAVY : LIGHT_BG))
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    if (choice === 'system') window.localStorage.removeItem(THEME_KEY)
    else window.localStorage.setItem(THEME_KEY, choice)
  } catch {
    // 保存できなくても、この画面の間は切り替える
  }
  current = choice
  applyTheme(choice)
  for (const l of listeners) l()
}

let current: ThemeChoice | undefined

function subscribe(l: () => void) {
  listeners.add(l)
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystem = () => { if ((current ?? readChoice()) === 'system') applyTheme('system') }
  const onStorage = (e: StorageEvent) => { if (e.key === THEME_KEY) { current = readChoice(); applyTheme(current); l() } }
  media.addEventListener('change', onSystem)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(l)
    media.removeEventListener('change', onSystem)
    window.removeEventListener('storage', onStorage)
  }
}

/** 今の選択。サーバー描画時と読み込み前は undefined */
export function useThemeChoice(): ThemeChoice | undefined {
  return useSyncExternalStore(subscribe, () => (current ??= readChoice()), () => undefined)
}
