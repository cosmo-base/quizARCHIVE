import { eligibleTestByLevel, testConfig } from './config'
import { levels } from './labels'
import type { Attempt, Level, RecognitionOutcome, TestKind, UserProfile } from './types'

export function eligibleTestKind(level: Level): TestKind {
  return eligibleTestByLevel[level]
}

export function nextLevel(level: Level): Level | null {
  const idx = levels.indexOf(level)
  return idx < levels.length - 1 ? levels[idx + 1] : null
}

/**
 * 認定の適用。同じ attemptId には一度だけ実行する（再表示・再読み込みで二重加算しない）。
 * 不合格でリセットせず、降格もしない。
 */
export function applyRecognition(user: UserProfile, attempt: Attempt, passed: boolean): RecognitionOutcome {
  if (!attempt.recognitionEligible || !attempt.userId) return { applied: false, reason: 'guest' }
  if (user.recognizedAttemptIds.includes(attempt.id)) return { applied: false, reason: 'notEligible' }
  const levelBefore = user.level
  if (!passed) {
    return {
      applied: false,
      reason: 'notPassed',
      levelBefore,
      levelAfter: levelBefore,
      progressAfter: user.passesAtCurrentLevel,
      expertPassesAfter: user.expertPasses,
    }
  }
  if (!attempt.testKind || eligibleTestKind(user.level) !== attempt.testKind) {
    return { applied: false, reason: 'levelChanged', levelBefore, levelAfter: levelBefore }
  }
  user.recognizedAttemptIds.push(attempt.id)
  if (user.level === 'expert') {
    user.expertPasses += 1
    return { applied: true, levelBefore, levelAfter: 'expert', expertPassesAfter: user.expertPasses, promoted: false }
  }
  user.passesAtCurrentLevel += 1
  if (user.passesAtCurrentLevel >= testConfig.passesToPromote) {
    user.level = nextLevel(user.level) ?? user.level
    user.passesAtCurrentLevel = 0
    return { applied: true, levelBefore, levelAfter: user.level, progressAfter: 0, promoted: true, expertPassesAfter: user.expertPasses }
  }
  return { applied: true, levelBefore, levelAfter: user.level, progressAfter: user.passesAtCurrentLevel, promoted: false }
}

export interface StarDisplay {
  units: number
  filled: number
  outlined: number
  plus: number | null
  label: string
  remainingToNext: number
}

/**
 * 専門家になってからの合格数で星を計算。
 * 3回ごとに1段階：白星1〜5 → 黒星1〜5（白星を塗りつぶす）→ ★＋6以降
 */
export function starDisplay(expertPasses: number): StarDisplay {
  const per = testConfig.passesPerStar
  const units = Math.floor(expertPasses / per)
  const remainingToNext = per - (expertPasses % per)
  if (units === 0) return { units, filled: 0, outlined: 0, plus: null, label: 'まだ星はありません', remainingToNext }
  if (units <= 5) return { units, filled: 0, outlined: units, plus: null, label: `白星${units}つ`, remainingToNext }
  if (units <= 10) {
    const filled = units - 5
    const outlined = 5 - filled
    return {
      units,
      filled,
      outlined,
      plus: null,
      label: outlined > 0 ? `黒星${filled}つ・白星${outlined}つ` : `黒星${filled}つ`,
      remainingToNext,
    }
  }
  const plus = units - 5
  return { units, filled: 1, outlined: 0, plus, label: `黒星プラス${plus}`, remainingToNext }
}
