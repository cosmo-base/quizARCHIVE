import type { PracticeSettings, Question } from './types'

/** 分野・難易度・キーワードでの絞り込み（同じ項目内はいずれか、項目どうしはすべて）。画面とモックで共通 */
export function filterPracticePool<Q extends Pick<Question, 'fieldId' | 'difficulty' | 'text'>>(questions: Q[], settings: Pick<PracticeSettings, 'fieldIds' | 'difficulties' | 'keyword'>) {
  const kw = settings.keyword?.trim()
  return questions.filter(
    (q) =>
      (settings.fieldIds.length === 0 || settings.fieldIds.includes(q.fieldId)) &&
      (settings.difficulties.length === 0 || settings.difficulties.includes(q.difficulty)) &&
      (!kw || q.text.includes(kw)),
  )
}
