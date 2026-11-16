import { getContent } from './data/questions'
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


export interface SolvedQuestionRow {
  questionId: string
  fieldId: string
  lastCorrect: boolean | null
  lastAt: string
  count: number
  /** 最新の回答が練習・テスト・復習のときの回ID（単問回答のみなら undefined） */
  lastAttemptId?: string
}

/** 解いた問題（最終回答のある問題のみ）。前回＝最新の回答 */
export function solvedQuestions(state: AppState): SolvedQuestionRow[] {
  const rows = new Map<string, SolvedQuestionRow>()
  const add = (questionId: string, fieldId: string, correct: boolean, at: string, attemptId?: string) => {
    const prev = rows.get(questionId)
    if (!prev) {
      rows.set(questionId, { questionId, fieldId, lastCorrect: correct, lastAt: at, count: 1, lastAttemptId: attemptId })
      return
    }
    prev.count += 1
    if (at > prev.lastAt) {
      prev.lastAt = at
      prev.lastCorrect = correct
      prev.lastAttemptId = attemptId
    }
  }
  for (const a of ownedAttempts(state)) {
    if (!a.finalized || !a.finishedAt) continue
    for (const snap of a.questionSnapshots) {
      const answer = a.answers[snap.questionId]
      if (answer === null || answer === undefined) continue
      const v = resolveSnapshot(snap)
      add(snap.questionId, snap.fieldId, v?.correctChoiceId === answer, a.finishedAt, a.id)
    }
  }
  if (!state.demo.emptyHistory) {
    const single = state.singleAnswers[state.sessionUserId ?? 'guest'] ?? {}
    for (const r of Object.values(single)) {
      const fieldId = getContent(r.questionId)?.fieldId ?? ''
      if (!r.explanationOnly && r.correct !== null) add(r.questionId, fieldId, r.correct, r.at)
      for (const t of r.retries ?? []) add(r.questionId, fieldId, t.correct, t.at)
    }
  }
  return [...rows.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}
