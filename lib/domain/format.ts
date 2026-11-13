import { CATEGORY_LABEL, DIFF_LABEL, TEST_LABEL } from './labels'
import { formatDuration } from './rules'
import type { Attempt } from './types'

export function attemptTitle(a: Attempt) {
  if (a.mode === 'test' && a.testType) return TEST_LABEL[a.testType]
  return a.kind === 'review' ? '復習（練習）' : '練習'
}

export function settingsText(a: Attempt) {
  if (a.mode === 'test') return '40問・60分'
  const p = a.practice
  if (!p) return ''
  if (a.kind === 'review') return `${p.count}問・履歴の問題を練習し直し`
  const cat = p.categories.length ? p.categories.map((c) => CATEGORY_LABEL[c]).join('・') : '全分野'
  const dif = p.difficulties.length ? p.difficulties.map((d) => DIFF_LABEL[d]).join('・') : '全難易度'
  const time = p.timeLimitSec ? `制限${formatDuration(p.timeLimitSec)}` : '制限なし'
  return `${p.count}問・${cat}・${dif}・${time}`
}
