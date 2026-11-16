import type { Field } from './types'

/**
 * 分野。画面の表示・絞り込みに使う公開情報（正解などを含む問題データとは分ける）。
 * モック用の仮分類。実データの7分野への置き換えは別作業で行う。
 */
export const fields: Field[] = [
  { id: 'solar', name: '太陽系' },
  { id: 'stars', name: '恒星と銀河' },
  { id: 'exploration', name: '宇宙開発・探査' },
  { id: 'observation', name: '星空と観測' },
  { id: 'physics', name: '宇宙のしくみ' },
  { id: 'life', name: '宇宙と暮らし' },
]

export function fieldName(id: string) {
  return fields.find((f) => f.id === id)?.name ?? id
}
