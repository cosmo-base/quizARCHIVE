import { currentVersion } from './generate'
import { displayDifficulty, displayRate } from './rules'
import { sameSubject, subjectOf } from './actions'
import type { AppState, Question } from './types'

export function questionView(s: AppState, q: Question) {
  const v = currentVersion(q)
  const st = s.stats[v.statsVersionId]
  return { q, v, st, rate: displayRate(st, s.rule), diff: displayDifficulty(st, s.rule) }
}

export function findVersion(s: AppState, questionId: string, versionId: string) {
  return s.questions.find((q) => q.id === questionId)?.versions.find((v) => v.versionId === versionId) ?? null
}

/** 本人の回のみ（他人の履歴へID指定でアクセスさせない） */
export function myAttempts(s: AppState) {
  const me = subjectOf(s)
  return s.attempts.filter((a) => sameSubject(a.subject, me)).sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}
