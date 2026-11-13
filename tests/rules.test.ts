/**
 * 受入条件（§16）のうち、ドメインロジックで確認できるものの自動チェック。
 * 実行: pnpm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSeed } from '@/lib/mock/seed'
import { answerSingle, finishAttempt, saveAnswer, startReview, startTest, testEligibility, viewExplanation } from '@/lib/domain/actions'
import { findVersion } from '@/lib/domain/selectors'
import { displayDifficulty, displayRate, rejudge, setKeyOf, starInfo } from '@/lib/domain/rules'
import { mulberry32 } from '@/lib/domain/generate'
import type { AppState, QuestionStats } from '@/lib/domain/types'
import type { Result } from '@/lib/domain/actions'

function idOf(r: Result): string {
  if (!r.ok || !r.id) return assert.fail(r.ok ? 'no id' : r.message)
  return r.id
}

const NOW = '2026-11-13T03:00:00.000Z'
const LATER = '2026-11-13T03:30:00.000Z'

function login(s: AppState, id: string | null) {
  s.currentUserId = id
}
function answerN(s: AppState, attemptId: string, correctN: number, answeredN: number) {
  const a = s.attempts.find((x) => x.id === attemptId)!
  a.questions.forEach((aq, i) => {
    if (i >= answeredN) return
    const v = findVersion(s, aq.questionId, aq.versionId)!
    const sel = i < correctN ? v.correctId : v.choices.find((c) => c.id !== v.correctId)!.id
    assert.ok(saveAnswer(s, attemptId, i, sel, 1, NOW).ok)
  })
  return a
}
function statsOf(s: AppState, attemptId: string) {
  const a = s.attempts.find((x) => x.id === attemptId)!
  return a.questions.map((aq) => {
    const v = findVersion(s, aq.questionId, aq.versionId)!
    return s.stats[v.statsVersionId]
  })
}

test('AC-04 初級ログイン利用者は上級昇格テストを開始できない', () => {
  const s = createSeed()
  login(s, 'u-1')
  assert.equal(testEligibility(s, 'to3').canStart, false)
  assert.equal(startTest(s, 'to3', NOW).ok, false)
  assert.equal(testEligibility(s, 'to2').certifying, true)
})

test('AC-06 31点は不合格、32点は合格', () => {
  for (const [score, pass] of [[31, false], [32, true]] as const) {
    const s = createSeed()
    login(s, 'u-1')
    const r = startTest(s, 'to2', NOW, mulberry32(score))
    assert.ok(r.ok && idOf(r))
    answerN(s, idOf(r), score, 40)
    finishAttempt(s, idOf(r), 'manual', LATER)
    const a = s.attempts.find((x) => x.id === idOf(r))!
    assert.equal(a.recognition?.passed, pass)
    assert.equal(s.users.find((u) => u.id === 'u-1')!.passes, pass ? 1 : 0)
  }
})

test('AC-07 32回答すべて正解・8未回答で時間切れ → 合格、基本回答32・正解32', () => {
  const s = createSeed()
  login(s, 'u-1')
  const r = startTest(s, 'to2', NOW, mulberry32(1))
  const before = structuredClone(statsOf(s, idOf(r)))
  answerN(s, idOf(r), 32, 32)
  const a = s.attempts.find((x) => x.id === idOf(r))!
  assert.equal(finishAttempt(s, idOf(r), 'timeout', LATER).ok, false, '期限前の時間切れ要求は拒否')
  assert.ok(finishAttempt(s, idOf(r), 'timeout', a.deadline!).ok)
  assert.equal(a.status, 'timed_out')
  assert.equal(a.recognition?.passed, true)
  const after = statsOf(s, idOf(r))
  const dN = after.reduce((n, st, i) => n + st.basicN - before[i].basicN, 0)
  const dC = after.reduce((n, st, i) => n + st.basicCorrect - before[i].basicCorrect, 0)
  assert.equal(dN, 32)
  assert.equal(dC, 32)
})

test('AC-08 0回答で時間切れ → 0点不合格、問題別回答数は増えない', () => {
  const s = createSeed()
  login(s, 'u-1')
  const r = startTest(s, 'to2', NOW, mulberry32(2))
  const before = structuredClone(statsOf(s, idOf(r)))
  const a = s.attempts.find((x) => x.id === idOf(r))!
  finishAttempt(s, idOf(r), 'timeout', a.deadline!)
  assert.equal(a.questions.filter((q) => q.correct).length, 0)
  assert.equal(a.recognition?.passed, false)
  assert.deepEqual(statsOf(s, idOf(r)).map((x) => x.basicN), before.map((x) => x.basicN))
})

test('AC-09 同じ終了要求の再送で二重加算しない', () => {
  const s = createSeed()
  login(s, 'u-1')
  const r = startTest(s, 'to2', NOW, mulberry32(3))
  answerN(s, idOf(r), 35, 40)
  finishAttempt(s, idOf(r), 'manual', LATER)
  const snap = structuredClone(statsOf(s, idOf(r)))
  finishAttempt(s, idOf(r), 'manual', LATER)
  finishAttempt(s, idOf(r), 'timeout', '2026-11-13T09:00:00.000Z')
  assert.deepEqual(statsOf(s, idOf(r)), snap)
  assert.equal(s.users.find((u) => u.id === 'u-1')!.passes, 1)
})

test('AC-10 合格2回・不合格・合格で累計3回 → 自動昇格', () => {
  const s = createSeed()
  login(s, 'u-1')
  ;[35, 33, 10, 32].forEach((score, i) => {
    const r = startTest(s, 'to2', NOW, mulberry32(100 + i))
    assert.ok(r.ok, `start ${i}`)
    answerN(s, idOf(r), score, 40)
    finishAttempt(s, idOf(r), 'manual', LATER)
  })
  const u = s.users.find((x) => x.id === 'u-1')!
  assert.equal(u.level, 2)
  assert.equal(u.passes, 0)
})

test('AC-03 ゲストの合格は認定に加算されない', () => {
  const s = createSeed()
  const r = startTest(s, 'star', NOW, mulberry32(5))
  assert.ok(r.ok)
  answerN(s, idOf(r), 40, 40)
  finishAttempt(s, idOf(r), 'manual', LATER)
  const a = s.attempts.find((x) => x.id === idOf(r))!
  assert.equal(a.certifying, false)
  assert.equal(a.recognition, null)
  login(s, 'u-4')
  assert.equal(s.users.find((u) => u.id === 'u-4')!.expertPasses, 17)
})

test('AC-11 星の表示', () => {
  assert.equal(starInfo(15).text, '☆☆☆☆☆')
  assert.equal(starInfo(18).text, '★☆☆☆☆')
  assert.equal(starInfo(30).text, '★★★★★')
  assert.equal(starInfo(33).text, '★＋6')
  assert.equal(starInfo(36).text, '★＋7')
  assert.equal(starInfo(2).text, '星なし')
  assert.equal(starInfo(17).toNext, 1)
})

test('AC-12 履歴の復習は復習統計だけ増え、基本・昇格に影響しない', () => {
  const s = createSeed()
  login(s, 'u-1')
  const r = startTest(s, 'to2', NOW, mulberry32(6))
  answerN(s, idOf(r), 30, 40)
  finishAttempt(s, idOf(r), 'manual', LATER)
  const src = s.attempts.find((x) => x.id === idOf(r))!
  const before = structuredClone(statsOf(s, idOf(r)))
  const rv = startReview(s, src.id, src.questions.map((q) => q.questionId), LATER)
  assert.ok(rv.ok)
  answerN(s, idOf(rv), 40, 40)
  finishAttempt(s, idOf(rv), 'manual', LATER)
  const after = statsOf(s, idOf(r))
  assert.deepEqual(after.map((x) => x.basicN), before.map((x) => x.basicN))
  assert.deepEqual(after.map((x) => x.difficulty), before.map((x) => x.difficulty))
  assert.equal(after.reduce((n, x, i) => n + x.reviewN - before[i].reviewN, 0), 40)
  assert.equal(s.users.find((u) => u.id === 'u-1')!.passes, 0)
})

const blank = (): QuestionStats => ({ statsVersionId: 'x', basicN: 0, basicCorrect: 0, reviewN: 0, reviewCorrect: 0, snsRate: 0.8, difficulty: 1, lastJudgedN: 0, judgedAt: null, inherit: null })

test('AC-14 基本9回答・復習100回答 → 初級（復習は最低件数に数えない）', () => {
  const st = { ...blank(), basicN: 9, basicCorrect: 0, reviewN: 100 }
  rejudge(st, { minN: 10, interval: 10 }, NOW)
  assert.equal(displayDifficulty(st, { minN: 10, interval: 10 }), 1)
  assert.equal(displayRate(st, { minN: 10, interval: 10 }), 0.8)
})

test('AC-15 基本10件到達・正答率50/30/10% → 中級/上級/専門家', () => {
  for (const [c, d] of [[5, 2], [3, 3], [1, 4], [6, 1]] as const) {
    const st = { ...blank(), basicN: 10, basicCorrect: c }
    assert.ok(rejudge(st, { minN: 10, interval: 10 }, NOW))
    assert.equal(st.difficulty, d)
  }
})

test('AC-16 判定間隔100件へ変更後も最低10件は維持し、新境界で再判定', () => {
  const rule = { minN: 10, interval: 100 }
  const st = { ...blank(), basicN: 10, basicCorrect: 9 }
  assert.ok(rejudge(st, rule, NOW))
  st.basicN = 50
  st.basicCorrect = 9
  assert.equal(rejudge(st, rule, NOW), false)
  st.basicN = 110
  assert.ok(rejudge(st, rule, NOW))
  assert.equal(st.difficulty, 4)
})

test('AC-18 新版は9件まで旧版の値、10件で新版へ', () => {
  const rule = { minN: 10, interval: 10 }
  const st = { ...blank(), basicN: 9, basicCorrect: 0, inherit: { fromStatsVersionId: 'old', rate: 0.42, difficulty: 2 as const } }
  assert.equal(displayRate(st, rule), 0.42)
  assert.equal(displayDifficulty(st, rule), 2)
  st.basicN = 10
  rejudge(st, rule, NOW)
  assert.equal(displayRate(st, rule), 0)
  assert.equal(displayDifficulty(st, rule), 4)
})

test('AC-20 順序違いの同じ集合は同一セット。直近5回と同じセットは生成しない', () => {
  assert.equal(setKeyOf(['q3', 'q1', 'q2']), setKeyOf(['q1', 'q2', 'q3']))
  const s = createSeed()
  login(s, 'u-1')
  const keys = new Set<string>()
  for (let i = 0; i < 6; i++) {
    const r = startTest(s, 'to2', NOW, mulberry32(i))
    const a = s.attempts.find((x) => x.id === idOf(r))!
    keys.add(a.setKey)
  }
  assert.equal(keys.size, 6)
  assert.equal(s.setHistory['u:u-1'].keys.length, 5)
})

test('AC-22 テストは分野の均等配分を優先し、同一問題を重複させない', () => {
  const s = createSeed()
  for (const t of ['to2', 'to3', 'to4', 'star'] as const) {
    const r = startTest(s, t, NOW, mulberry32(9))
    assert.ok(r.ok, t)
    const a = s.attempts.find((x) => x.id === idOf(r))!
    assert.equal(a.questions.length, 40)
    assert.equal(new Set(a.questions.map((q) => q.questionId)).size, 40)
    const per = new Map<string, number>()
    for (const q of a.questions) per.set(q.category, (per.get(q.category) ?? 0) + 1)
    for (const n of per.values()) assert.equal(n, 8, `${t} 分野配分`)
    const ac = a.actualComposition!
    assert.equal(ac[1] + ac[2] + ac[3] + ac[4] + ac.any, 40)
  }
})

test('AC-25 単問：解説前の回答のみ基本集計', () => {
  const s = createSeed()
  const q = s.questions[0]
  const v = q.versions[0]
  const st = s.stats[v.statsVersionId]
  const n0 = st.basicN
  answerSingle(s, q.id, v.versionId, v.correctId, 'e1', NOW)
  answerSingle(s, q.id, v.versionId, v.correctId, 'e1', NOW) // 同一イベントの再送
  assert.equal(s.stats[v.statsVersionId].basicN, n0 + 1)
  answerSingle(s, q.id, v.versionId, v.correctId, 'e2', NOW) // 解説閲覧後の再回答
  assert.equal(s.stats[v.statsVersionId].basicN, n0 + 1)
  const q2 = s.questions[1]
  const v2 = q2.versions[0]
  const m0 = s.stats[v2.statsVersionId].basicN
  viewExplanation(s, v2.versionId)
  answerSingle(s, q2.id, v2.versionId, v2.correctId, 'e3', NOW)
  assert.equal(s.stats[v2.statsVersionId].basicN, m0)
})

test('AC-28 他の利用者の回は保存・終了できない', () => {
  const s = createSeed()
  login(s, 'u-1')
  const r = startTest(s, 'to2', NOW, mulberry32(11))
  login(s, 'u-2')
  assert.equal(saveAnswer(s, idOf(r), 0, null, 5, NOW).ok, false)
  assert.equal(finishAttempt(s, idOf(r), 'manual', LATER).ok, false)
})

test('AC-05 古い再送で新しい選択を上書きしない', () => {
  const s = createSeed()
  const r = startTest(s, 'to2', NOW, mulberry32(12))
  const a = s.attempts.find((x) => x.id === idOf(r))!
  const v = findVersion(s, a.questions[0].questionId, a.questions[0].versionId)!
  saveAnswer(s, idOf(r), 0, v.choices[1].id, 2, NOW)
  saveAnswer(s, idOf(r), 0, v.choices[0].id, 1, NOW)
  assert.equal(a.questions[0].selectedId, v.choices[1].id)
  assert.equal(a.questions[0].correct, null)
})
