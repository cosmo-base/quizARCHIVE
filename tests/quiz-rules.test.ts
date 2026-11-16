import assert from 'node:assert/strict'
import test from 'node:test'
import { createSeedStats, questionContents } from '../lib/data/questions'
import { applyAnswerToStats, buildAllQuestions, deriveDisplay, emptyStats, resolveSnapshot, toSnapshot } from '../lib/stats'
import { createRng, selectQuestionSet, toSetKey } from '../lib/question-selector'
import { testCompositions } from '../lib/config'
import { applyRecognition, starDisplay } from '../lib/recognition'
import { isPassed, scoreAttempt } from '../lib/scoring'
import { jstDateKey } from '../lib/time'
import type { Attempt, QuestionStats, UserProfile } from '../lib/types'

const pool = buildAllQuestions(createSeedStats())
function attempt(correct: number, answered = 40, eligible = true): Attempt {
  const snaps = pool.slice(0, 40).map(toSnapshot)
  const a: Attempt = { id: `test-${correct}-${Math.random()}`, mode: 'test', testKind: 'toIntermediate', userId: eligible ? 'u' : undefined, recognitionEligible: eligible, questionSnapshots: snaps, answers: Object.fromEntries(snaps.map((s, i) => { const q = resolveSnapshot(s)!; return [s.questionId, i >= answered ? null : i < correct ? q.correctChoiceId : q.choices.find(c => c.id !== q.correctChoiceId)!.id] })), startedAt: '2026-11-01T00:00:00Z', deadlineAt: '2026-11-01T01:00:00Z', status: 'timedOut', currentIndex: 0, finalized: false, statsBucket: 'basic', setKey: toSetKey(snaps.map(s => s.questionId)) }
  a.analytics = scoreAttempt(a, a.status, a.deadlineAt!)
  return a
}
test('90 unique questions and balanced unique 40-question sets; recent five avoided', () => {
  assert.equal(questionContents.length, 90)
  assert.equal(new Set(questionContents.map(q => q.current.text)).size, 90)
  const recent: string[] = []
  for (let i = 0; i < 12; i++) {
    const r = selectQuestionSet({ pool, count: 40, composition: testCompositions.toIntermediate, avoidSetKeys: recent.slice(-5), rng: createRng(i) })
    assert.ok(r.ok)
    if (!r.ok) return
    assert.equal(new Set(r.questions.map(q => q.id)).size, 40)
    assert.ok(!recent.slice(-5).includes(r.setKey))
    const counts = Object.values(r.questions.reduce<Record<string, number>>((m,q) => { m[q.fieldId] = (m[q.fieldId] ?? 0) + 1; return m }, {}))
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1)
    recent.push(r.setKey)
  }
})
test('fixed set allowed; exhausted alternative sets rejected; order-independent identity', () => {
  const fixed = pool.slice(0, 5)
  const key = toSetKey(fixed.map(q => q.id))
  const r = selectQuestionSet({ pool: fixed, count: 5, avoidSetKeys: [key], rng: createRng(1) })
  assert.ok(r.ok && r.duplicateAllowed)
  assert.equal(toSetKey(fixed.reverse().map(q => q.id)), key)
  const small = pool.slice(0, 3)
  const allKeys = small.map(q => toSetKey(small.filter(x => x.id !== q.id).map(x => x.id)))
  const exhausted = selectQuestionSet({ pool: small, count: 2, avoidSetKeys: allKeys, rng: createRng(1) })
  assert.ok(!exhausted.ok && exhausted.reason === 'noAlternative')
})
test('under 10 basic answers uses SNS accuracy (unknown without it); reviews do not count; 10th answer reclassifies; boundaries', () => {
  const q = pool[0]
  const stats: Record<string, QuestionStats> = { [q.id]: { ...emptyStats(q.versionId), basicAnswerCount: 9, basicCorrectCount: 5, reviewAnswerCount: 400 } }
  // SNS 正答率なし・基本回答10件未満 → 未集計・不明（0%や初級として補わない）
  assert.deepEqual(deriveDisplay(stats[q.id]), { difficulty: 'unknown', displayAccuracy: null })
  // SNS 正答率あり → SNS 正答率で表示・判定（復習回答は最低件数に数えない）
  assert.deepEqual(deriveDisplay(stats[q.id], 0.6), { difficulty: 'beginner', displayAccuracy: 0.6 })
  assert.equal(deriveDisplay(stats[q.id], 0.2).difficulty, 'advanced')
  applyAnswerToStats(stats, q.id, q.versionId, false, 'basic')
  assert.equal(deriveDisplay(stats[q.id]).difficulty, 'intermediate')
  for (const [correct, level] of [[6, 'beginner'], [5, 'intermediate'], [3, 'advanced'], [1, 'expert']] as const) assert.equal(deriveDisplay({ ...emptyStats(q.versionId), basicAnswerCount: 10, basicCorrectCount: correct }).difficulty, level)
  const before = { ...stats[q.id] }
  applyAnswerToStats(stats, q.id, q.versionId, true, 'review')
  assert.equal(stats[q.id].basicAnswerCount, before.basicAnswerCount)
  assert.equal(stats[q.id].judgedDifficulty, before.judgedDifficulty)
  assert.equal(stats[q.id].reviewAnswerCount, before.reviewAnswerCount + 1)
})
test('31 fails; 32 passes even on timeout; unanswered excluded from accuracy', () => {
  assert.equal(isPassed(attempt(31)), false)
  const a = attempt(32, 32)
  assert.equal(isPassed(a), true)
  assert.equal(a.analytics!.scoreRate, .8)
  assert.equal(a.analytics!.answeredAccuracy, 1)
  assert.equal(a.analytics!.unansweredCount, 8)
  assert.equal(a.analytics!.wrongCount, 0)
  assert.equal(attempt(0, 0).analytics!.answeredAccuracy, null)
})
test('cumulative promotion survives failures and is idempotent; guest never receives credit', () => {
  const u: UserProfile = { id: 'u', displayName: 'demo', level: 'beginner', passesAtCurrentLevel: 0, expertPasses: 0, recognizedAttemptIds: [] }
  applyRecognition(u, attempt(32), true)
  applyRecognition(u, attempt(31), false)
  assert.equal(u.passesAtCurrentLevel, 1)
  applyRecognition(u, attempt(32), true)
  const third = attempt(32)
  assert.equal(applyRecognition(u, third, true).promoted, true)
  assert.equal(u.level, 'intermediate')
  assert.equal(applyRecognition(u, third, true).applied, false)
  assert.equal(applyRecognition(u, attempt(32, 40, false), true).applied, false)
  assert.equal(u.passesAtCurrentLevel, 0)
})
test('expert stars at 15, 18, 30, 33 and JST midnight', () => {
  assert.deepEqual([starDisplay(15).filled, starDisplay(15).outlined], [0,5])
  assert.deepEqual([starDisplay(18).filled, starDisplay(18).outlined], [1,4])
  assert.deepEqual([starDisplay(30).filled, starDisplay(30).outlined], [5,0])
  assert.equal(starDisplay(33).plus, 6)
  assert.equal(jstDateKey(new Date('2026-11-01T14:59:59Z')), '2026-11-01')
  assert.equal(jstDateKey(new Date('2026-11-01T15:00:00Z')), '2026-11-02')
})

test('unknown-difficulty questions are used only in the expert-stars random slots', () => {
  const unknown = pool.slice(0, 12).map((q) => ({ ...q, id: `${q.id}-u`, difficulty: 'unknown' as const }))
  const mixed = [...pool, ...unknown]
  const isUnknown = (id: string) => id.endsWith('-u')
  for (let i = 0; i < 20; i++) {
    for (const kind of ['toIntermediate', 'toAdvanced', 'toExpert'] as const) {
      const r = selectQuestionSet({ pool: mixed, count: 40, composition: testCompositions[kind], avoidSetKeys: [], rng: createRng(i) })
      assert.ok(r.ok)
      if (r.ok) assert.equal(r.questions.filter((q) => isUnknown(q.id)).length, 0, kind)
    }
    const star = selectQuestionSet({ pool: mixed, count: 40, composition: testCompositions.expertStars, avoidSetKeys: [], rng: createRng(i) })
    assert.ok(star.ok)
    if (star.ok) assert.ok(star.questions.filter((q) => isUnknown(q.id)).length <= (testCompositions.expertStars.any ?? 0))
  }
  // 練習（構成なし）では通常どおり出題される
  const practice = selectQuestionSet({ pool: unknown, count: 5, avoidSetKeys: [], rng: createRng(3) })
  assert.ok(practice.ok)
})

test('seven fields are used and each has enough questions for a balanced test', () => {
  const byField = questionContents.reduce<Record<string, number>>((m, q) => { m[q.fieldId] = (m[q.fieldId] ?? 0) + 1; return m }, {})
  assert.deepEqual(Object.keys(byField).sort(), ['astronomy', 'basics', 'business', 'development', 'exploration', 'history', 'policy'])
  for (const n of Object.values(byField)) assert.ok(n >= 6)
})
