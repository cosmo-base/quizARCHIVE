import { testConfig } from './config'
import { resolveSnapshot } from './stats'
import type { Attempt, AttemptAnalytics, AttemptStatus } from './types'

export function scoreAttempt(attempt: Attempt, status: AttemptStatus, finishedAt: string): AttemptAnalytics {
  let correct = 0
  let answered = 0
  for (const snap of attempt.questionSnapshots) {
    const answer = attempt.answers[snap.questionId]
    if (answer === null || answer === undefined) continue
    answered += 1
    const version = resolveSnapshot(snap)
    if (version && version.correctChoiceId === answer) correct += 1
  }
  const total = attempt.questionSnapshots.length
  const durationSec = Math.max(0, (new Date(finishedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000)
  return {
    answeredCount: answered,
    unansweredCount: total - answered,
    correctCount: correct,
    wrongCount: answered - correct,
    // 未回答は0点（問題別正答率の分母から除外することとは別）
    score: correct,
    totalCount: total,
    scoreRate: total === 0 ? 0 : correct / total,
    answeredAccuracy: answered === 0 ? null : correct / answered,
    durationSec,
    status,
    userLevelAtStart: attempt.userLevelAtStart,
    bucket: attempt.statsBucket,
  }
}

/** 時間切れでも基準点以上なら合格 */
export function isPassed(attempt: Attempt) {
  if (attempt.mode !== 'test' || !attempt.analytics) return false
  return attempt.analytics.score >= testConfig.passScore
}
