import { mockConfig } from './config'
import { getContent, getVersion, questionContents } from './data/questions'
import type { Question, QuestionDifficulty, QuestionSnapshot, QuestionStats, StatsBucket } from './types'

const { minBasicAnswers, rejudgeInterval, thresholds } = mockConfig.difficulty

/** 正答率から問題難易度を判定（80%はテスト合格基準であり、ここでは使わない） */
export function classifyAccuracy(accuracy: number): QuestionDifficulty {
  if (accuracy > thresholds.beginner) return 'beginner'
  if (accuracy > thresholds.intermediate) return 'intermediate'
  if (accuracy > thresholds.advanced) return 'advanced'
  return 'expert'
}

export function emptyStats(versionId: string): QuestionStats {
  return { versionId, basicAnswerCount: 0, basicCorrectCount: 0, reviewAnswerCount: 0, reviewCorrectCount: 0 }
}

/** 難易度と表示正答率を導出。復習の回答は使わない */
export function deriveDisplay(stats: QuestionStats, snsAccuracy?: number) {
  if (stats.basicAnswerCount < minBasicAnswers) {
    if (stats.inherited) {
      return { difficulty: stats.inherited.difficulty, displayAccuracy: stats.inherited.accuracy }
    }
    return { difficulty: 'beginner' as const, displayAccuracy: snsAccuracy ?? null }
  }
  const accuracy = stats.basicCorrectCount / stats.basicAnswerCount
  return {
    difficulty: stats.judgedDifficulty ?? classifyAccuracy(accuracy),
    displayAccuracy: accuracy,
  }
}

export function buildQuestion(id: string, statsMap: Record<string, QuestionStats>): Question | undefined {
  const content = getContent(id)
  if (!content) return undefined
  const stats = statsMap[id] ?? emptyStats(content.current.versionId)
  const { difficulty, displayAccuracy } = deriveDisplay(stats, content.snsAccuracy)
  return {
    id: content.id,
    versionId: content.current.versionId,
    fieldId: content.fieldId,
    text: content.current.text,
    choices: content.current.choices,
    correctChoiceId: content.current.correctChoiceId,
    explanation: content.current.explanation,
    references: content.current.references,
    difficulty,
    displayAccuracy,
    basicAnswerCount: stats.basicAnswerCount,
    basicCorrectCount: stats.basicCorrectCount,
    reviewAnswerCount: stats.reviewAnswerCount,
    reviewCorrectCount: stats.reviewCorrectCount,
    snsAccuracy: content.snsAccuracy,
    inheritedAccuracy: stats.inherited?.accuracy,
  }
}

export function buildAllQuestions(statsMap: Record<string, QuestionStats>) {
  return questionContents.map((c) => buildQuestion(c.id, statsMap)!).filter(Boolean)
}

export function toSnapshot(q: Question): QuestionSnapshot {
  return {
    questionId: q.id,
    versionId: q.versionId,
    fieldId: q.fieldId,
    difficulty: q.difficulty,
    displayAccuracy: q.displayAccuracy,
  }
}

/** スナップショットの版の内容を引く（当時の問題・正解・解説） */
export function resolveSnapshot(s: QuestionSnapshot) {
  const found = getVersion(s.versionId)
  if (!found) return undefined
  return { ...found.version, questionId: s.questionId, fieldId: s.fieldId, difficulty: s.difficulty, displayAccuracy: s.displayAccuracy }
}

/**
 * 最終回答のみを統計に反映する。未選択は分母に含めない。
 * 旧版の回答は新版の分母へ足さない。
 */
export function applyAnswerToStats(
  statsMap: Record<string, QuestionStats>,
  questionId: string,
  versionId: string,
  correct: boolean,
  bucket: StatsBucket,
) {
  const content = getContent(questionId)
  if (!content || content.current.versionId !== versionId) return
  const stats = statsMap[questionId] ?? emptyStats(versionId)
  if (bucket === 'review') {
    stats.reviewAnswerCount += 1
    if (correct) stats.reviewCorrectCount += 1
  } else {
    stats.basicAnswerCount += 1
    if (correct) stats.basicCorrectCount += 1
    const reached = stats.basicAnswerCount >= minBasicAnswers
    const due = stats.judgedAtCount === undefined || stats.basicAnswerCount - stats.judgedAtCount >= rejudgeInterval
    if (reached && due) {
      stats.judgedDifficulty = classifyAccuracy(stats.basicCorrectCount / stats.basicAnswerCount)
      stats.judgedAtCount = stats.basicAnswerCount
    }
  }
  statsMap[questionId] = stats
}
