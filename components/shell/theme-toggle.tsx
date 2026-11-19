'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setThemeChoice, useThemeChoice, type ThemeChoice } from '@/lib/theme'

const order: ThemeChoice[] = ['system', 'light', 'dark']
const label: Record<ThemeChoice, string> = { system: '端末に合わせる', light: 'ライト', dark: 'ダーク' }
const icon = { system: Monitor, light: Sun, dark: Moon }

/** 押すたびに「端末に合わせる → ライト → ダーク」と切り替える */
export function ThemeToggle() {
  const choice = useThemeChoice() ?? 'system'
  const next = order[(order.indexOf(choice) + 1) % order.length]
  const Icon = icon[choice]
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-10"
      aria-label={`画面の色：${label[choice]}（押すと「${label[next]}」に切り替え）`}
      title={`画面の色：${label[choice]}`}
      onClick={() => setThemeChoice(next)}
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}
