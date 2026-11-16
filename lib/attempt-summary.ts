import { fieldName } from './fields'
import { difficultyLabel } from './labels'
import type { Attempt } from './types'

/** 回の設定の要約（例：「10問／全分野／全難易度／制限なし」）。画面用で、問題データは読み込まない */
export function attemptSettingsSummary(a: Pick<Attempt, 'mode' | 'practiceSettings'> & { questionCount: number }) {
  if (a.mode === 'practice' && a.practiceSettings) {
    const s = a.practiceSettings
    const fieldsText = s.fieldIds.length === 0 ? '全分野' : s.fieldIds.map(fieldName).join('・')
    const diffText = s.difficulties.length === 0 ? '全難易度' : s.difficulties.map((d) => difficultyLabel[d]).join('・')
    const time = s.timeLimitMinutes ? `${s.timeLimitMinutes}分` : '制限なし'
    return `${s.count}問／${fieldsText}／${diffText}／${time}`
  }
  if (a.mode === 'test') return `${a.questionCount}問／60分`
  if (a.mode === 'review') return `${a.questionCount}問の練習し直し`
  return ''
}
