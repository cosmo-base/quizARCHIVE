'use client'

import dynamic from 'next/dynamic'

/** 開発用のデモ設定。本番（静的書き出し）では読み込まない */
const DemoControls = process.env.NODE_ENV === 'production' ? null : dynamic(() => import('./demo-controls').then((m) => m.DemoControls), { ssr: false })

export function DemoControlsLoader() {
  return DemoControls ? <DemoControls /> : null
}
