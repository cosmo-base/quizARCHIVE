import type { Field } from './types'

/**
 * 分野（7分野）。画面の表示・絞り込みに使う公開情報（正解などを含む問題データとは分ける）。
 * 元のクイズスプシの「クイズの分類」に対応する。
 */
export const fields: Field[] = [
  { id: 'astronomy', name: '天文' },
  { id: 'development', name: '宇宙開発' },
  { id: 'business', name: '宇宙ビジネス' },
  { id: 'exploration', name: '宇宙探査' },
  { id: 'history', name: '歴史' },
  { id: 'basics', name: '宇宙基礎' },
  { id: 'policy', name: '宇宙政策' },
]

export function fieldName(id: string) {
  return fields.find((f) => f.id === id)?.name ?? id
}
