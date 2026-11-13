import { fieldName, getContent } from './data/questions'
import { levelLabel } from './labels'
import { resolveSnapshot } from './stats'
import type { AppState } from './store'
import type { Attempt } from './types'

/** 現在の利用者（ゲストはゲストの回）の回 */
export function ownedAttempts(state: AppState): Attempt[] {
  const uid = state.sessionUserId ?? undefined
  if (state.demo.emptyHistory) return []
  return Object.values(state.attempts)
    .filter((a) => a.userId === uid)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

export function inProgressAttempts(state: AppState) {
  const uid = state.sessionUserId ?? undefined
  return Object.values(state.attempts)
    .filter((a) => a.userId === uid && a.status === 'inProgress')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

export function isExpired(a: Attempt, now = Date.now()) {
  return Boolean(a.deadlineAt && new Date(a.deadlineAt).getTime() <= now)
}

export function attemptSettingsSummary(a: Attempt) {
  if (a.mode === 'practice' && a.practiceSettings) {
    const s = a.practiceSettings
    const fieldsText = s.fieldIds.length === 0 ? '全分野' : s.fieldIds.map(fieldName).join('・')
    const diffText = s.difficulties.length === 0 ? '全難易度' : s.difficulties.map((d) => levelLabel[d]).join('・')
    const time = s.timeLimitMinutes ? `${s.timeLimitMinutes}分` : '制限なし'
    return `${s.count}問／${fieldsText}／${diffText}／${time}`
  }
  if (a.mode === 'test') return `${a.questionSnapshots.length}問／60分`
  if (a.mode === 'review') return `${a.questionSnapshots.length}問の練習し直し`
  return ''
}

export interface SolvedQuestionRow {
  questionId: string
  fieldId: string
  lastCorrect: boolean | null
  lastAt: string
  count: number
}

/** 解いた問題（最終回答のある問題のみ）。前回＝最新の回答 */
export function solvedQuestions(state: AppState): SolvedQuestionRow[] {
  const rows = new Map<string, SolvedQuestionRow>()
  const add = (questionId: string, fieldId: string, correct: boolean, at: string) => {
    const prev = rows.get(questionId)
    if (!prev) {
      rows.set(questionId, { questionId, fieldId, lastCorrect: correct, lastAt: at, count: 1 })
      return
    }
    prev.count += 1
    if (at > prev.lastAt) {
      prev.lastAt = at
      prev.lastCorrect = correct
    }
  }
  for (const a of ownedAttempts(state)) {
    if (!a.finalized || !a.finishedAt) continue
    for (const snap of a.questionSnapshots) {
      const answer = a.answers[snap.questionId]
      if (answer === null || answer === undefined) continue
      const v = resolveSnapshot(snap)
      add(snap.questionId, snap.fieldId, v?.correctChoiceId === answer, a.finishedAt)
    }
  }
  if (!state.demo.emptyHistory) {
    const single = state.singleAnswers[state.sessionUserId ?? 'guest'] ?? {}
    for (const r of Object.values(single)) {
      if (r.explanationOnly || r.correct === null) continue
      add(r.questionId, getContent(r.questionId)?.fieldId ?? '', r.correct, r.at)
    }
  }
  return [...rows.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}
