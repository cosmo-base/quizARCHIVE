/**
 * モックの「サーバー処理」。本番ではAPI側で同じ検証・採点・集計を行う（§14）。
 * ブラウザの値だけで得点・合格・難易度を更新しない、という前提をV0でも形だけ守る。
 */
import { currentVersion, generatePractice, generateTest, practiceCandidates, publishedPool, type Picked, type Rng } from './generate'
import { ELIGIBLE_TEST, GUIDE_SEC, PASSES_TO_PROMOTE, PASS_SCORE, COMPOSITION, RECENT_SET_LIMIT, TEST_TIME_SEC, displayDifficulty, displayRate, jstDateKey, rejudge, setKeyOf } from './rules'
import type { AppState, Attempt, AttemptQuestion, IssueReport, Level, PracticeSettings, Recognition, ReportReason, Subject, TestType } from './types'

export type Result = { ok: true; message?: string; id?: string } | { ok: false; message: string; conflict?: boolean }

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export function subjectOf(s: AppState): Subject {
  return s.currentUserId ? { type: 'user', userId: s.currentUserId } : { type: 'guest', guestId: s.guestId }
}
export function subjectKey(subj: Subject) {
  return subj.type === 'user' ? `u:${subj.userId}` : `g:${subj.guestId}`
}
export function sameSubject(a: Subject, b: Subject) {
  return subjectKey(a) === subjectKey(b)
}
export function getUser(s: AppState, id: string | null) {
  return id ? (s.users.find((u) => u.id === id) ?? null) : null
}

/* ---------- 受験資格（FR-08 / AC-04） ---------- */

export function testEligibility(s: AppState, type: TestType): { canStart: boolean; certifying: boolean; reason?: string } {
  const user = getUser(s, s.currentUserId)
  if (!user) return { canStart: true, certifying: false }
  if (ELIGIBLE_TEST[user.level] === type) return { canStart: true, certifying: true }
  return { canStart: false, certifying: false, reason: 'ログイン中は、現在のレベルに対応するテストのみ受験できます。' }
}

/* ---------- セット重複防止（FR-11） ---------- */

function recentKeys(s: AppState, key: string, now: string) {
  const h = s.setHistory[key]
  if (!h || h.date !== jstDateKey(now)) return []
  return h.keys
}
function recordSet(s: AppState, key: string, setKey: string, now: string) {
  const date = jstDateKey(now)
  const h = s.setHistory[key]
  const keys = h && h.date === date ? h.keys : []
  s.setHistory[key] = { date, keys: [...keys, setKey].slice(-RECENT_SET_LIMIT) }
}

function buildAttempt(
  s: AppState,
  picked: Picked[],
  base: Omit<Attempt, 'id' | 'subject' | 'questions' | 'setKey' | 'currentIndex' | 'aggregated' | 'recognition' | 'finishedAt' | 'status' | 'finishReason' | 'levelAtStart'>,
): Attempt {
  const subject = subjectOf(s)
  const user = getUser(s, s.currentUserId)
  const questions: AttemptQuestion[] = picked.map((p, i) => ({
    questionId: p.q.id,
    versionId: p.v.versionId,
    order: i,
    difficultyAtStart: p.diff,
    category: p.v.category,
    choiceOrder: p.v.choices.map((c) => c.id),
    displayRateAtStart: displayRate(s.stats[p.v.statsVersionId], s.rule),
    selectedId: null,
    savedSeq: 0,
    savedAt: null,
    correct: null,
    viewed: i === 0,
  }))
  return {
    ...base,
    id: uid('at'),
    subject,
    levelAtStart: user?.level ?? null,
    questions,
    setKey: setKeyOf(picked.map((p) => p.q.id)),
    currentIndex: 0,
    aggregated: false,
    recognition: null,
    finishedAt: null,
    status: 'in_progress',
    finishReason: null,
  }
}

const MAX_TRIES = 40

export function startPractice(s: AppState, settings: PracticeSettings, now: string, rng: Rng = Math.random): Result {
  const pool = practiceCandidates(s, settings)
  if (pool.length < settings.count) return { ok: false, message: `条件に合う問題が${pool.length}問のため、${settings.count}問の練習は開始できません。` }
  const key = subjectKey(subjectOf(s))
  const recent = recentKeys(s, key, now)
  const onlyOneSet = pool.length === settings.count
  let picked: Picked[] | null = null
  for (let i = 0; i < MAX_TRIES; i++) {
    const p = generatePractice(pool, settings.count, rng)
    if (p && (onlyOneSet || !recent.includes(setKeyOf(p.map((x) => x.q.id))))) {
      picked = p
      break
    }
  }
  if (!picked) return { ok: false, message: '直近5回と異なる問題セットを作れませんでした。条件を広げてお試しください（重複制限は緩和しません）。' }
  const startedAt = now
  const a = buildAttempt(s, picked, {
    mode: 'practice',
    kind: 'normal',
    testType: null,
    certifying: false,
    practice: settings,
    baseComposition: null,
    actualComposition: null,
    sourceAttemptId: null,
    startedAt,
    deadline: settings.timeLimitSec ? new Date(new Date(now).getTime() + settings.timeLimitSec * 1000).toISOString() : null,
  })
  s.attempts.push(a)
  recordSet(s, key, a.setKey, now)
  return { ok: true, id: a.id }
}

export function startTest(s: AppState, type: TestType, now: string, rng: Rng = Math.random): Result {
  const el = testEligibility(s, type)
  if (!el.canStart) return { ok: false, message: el.reason ?? '受験できません。' }
  const pool = publishedPool(s)
  const key = subjectKey(subjectOf(s))
  const recent = recentKeys(s, key, now)
  let last: ReturnType<typeof generateTest> | null = null
  for (let i = 0; i < MAX_TRIES; i++) {
    const g = generateTest(pool, type, rng)
    if (!g.ok) return g
    last = g
    if (!recent.includes(setKeyOf(g.items.map((x) => x.q.id)))) break
    last = null
  }
  if (!last || !last.ok) return { ok: false, message: '直近5回と異なる問題セットを作れませんでした（重複制限は緩和しません）。' }
  const a = buildAttempt(s, last.items, {
    mode: 'test',
    kind: 'normal',
    testType: type,
    certifying: el.certifying,
    practice: null,
    baseComposition: COMPOSITION[type],
    actualComposition: last.actual,
    sourceAttemptId: null,
    startedAt: now,
    deadline: new Date(new Date(now).getTime() + TEST_TIME_SEC * 1000).toISOString(),
  })
  s.attempts.push(a)
  recordSet(s, key, a.setKey, now)
  return { ok: true, id: a.id }
}

/**
 * 履歴セットの練習し直し（FR-05）。重複防止の例外、昇格・基本集計の対象外。
 * 旧版／現行版のどちらを使うかは TBD-02。V0では現行版を使い、画面で明示する。
 */
export function startReview(s: AppState, sourceAttemptId: string | null, questionIds: string[], now: string): Result {
  if (s.currentUserId === null) return { ok: false, message: '復習はログイン利用者の学習履歴から行えます。' }
  const picked: Picked[] = []
  for (const id of questionIds) {
    const q = s.questions.find((x) => x.id === id)
    if (!q) continue
    if (q.status !== 'published') continue
    const v = currentVersion(q)
    const diff = displayDifficulty(s.stats[v.statsVersionId], s.rule)
    picked.push({ q, v, diff, slot: diff })
  }
  if (!picked.length) return { ok: false, message: '復習できる問題がありません（出題停止中の問題は除外されます）。' }
  const a = buildAttempt(s, picked, {
    mode: 'practice',
    kind: 'review',
    testType: null,
    certifying: false,
    practice: { count: picked.length, categories: [], difficulties: [], timeLimitSec: null },
    baseComposition: null,
    actualComposition: null,
    sourceAttemptId,
    startedAt: now,
    deadline: null,
  })
  s.attempts.push(a)
  return { ok: true, id: a.id }
}

/** 「同じ条件で新しく挑戦」＝現在の問題群から新規生成（受験資格は再判定） */
export function startSameConditions(s: AppState, attemptId: string, now: string, rng: Rng = Math.random): Result {
  const a = s.attempts.find((x) => x.id === attemptId)
  if (!a) return { ok: false, message: '元の回が見つかりません。' }
  if (a.mode === 'test' && a.testType) return startTest(s, a.testType, now, rng)
  if (a.practice) return startPractice(s, a.practice, now, rng)
  return { ok: false, message: '条件を復元できませんでした。' }
}

export function guideSeconds(level: Level | null, count: number) {
  return GUIDE_SEC[level ?? 1] * count
}

/* ---------- 回答中 ---------- */

function ownAttempt(s: AppState, attemptId: string): Attempt | Result {
  const a = s.attempts.find((x) => x.id === attemptId)
  if (!a) return { ok: false, message: 'この回は見つかりません。' }
  if (!sameSubject(a.subject, subjectOf(s))) return { ok: false, message: 'この回にはアクセスできません。' }
  return a
}

export function saveAnswer(s: AppState, attemptId: string, index: number, selectedId: string | null, seq: number, now: string): Result {
  const a = ownAttempt(s, attemptId)
  if ('ok' in a) return a
  if (a.status !== 'in_progress') return { ok: false, message: 'この回はすでに終了しています。' }
  if (a.deadline && new Date(now) > new Date(a.deadline)) return { ok: false, message: '制限時間を過ぎているため保存できません。' }
  if (s.demo.failNextSave) {
    s.demo.failNextSave = false
    return { ok: false, message: '通信に失敗しました（デモ）' }
  }
  const aq = a.questions[index]
  if (!aq) return { ok: false, message: '問題が見つかりません。' }
  if (seq <= aq.savedSeq) return { ok: true } // 古い再送は無視
  aq.selectedId = selectedId
  aq.savedSeq = seq
  aq.savedAt = now
  return { ok: true }
}

export function moveTo(s: AppState, attemptId: string, index: number) {
  const a = s.attempts.find((x) => x.id === attemptId)
  if (!a || a.status !== 'in_progress') return
  a.currentIndex = index
  if (a.questions[index]) a.questions[index].viewed = true
}

/* ---------- 終了・採点・集計・認定（FR-15〜20） ---------- */

export function finishAttempt(s: AppState, attemptId: string, trigger: 'manual' | 'timeout', now: string): Result {
  const a = ownAttempt(s, attemptId)
  if ('ok' in a) return a
  // 再送しても結果は一度だけ反映（AC-09）
  if (a.status !== 'in_progress' || a.aggregated) return { ok: true, id: a.id }
  const expired = a.deadline !== null && new Date(now) >= new Date(a.deadline)
  const isTimeout = trigger === 'timeout' || expired
  if (trigger === 'timeout' && !expired) return { ok: false, message: 'まだ制限時間内です。' }

  for (const aq of a.questions) {
    const v = s.questions.find((q) => q.id === aq.questionId)?.versions.find((x) => x.versionId === aq.versionId)
    aq.correct = aq.selectedId && v ? aq.selectedId === v.correctId : null
  }
  const answered = a.questions.filter((q) => q.selectedId).length
  a.status = isTimeout ? 'timed_out' : 'completed'
  a.finishReason = isTimeout ? 'timeout' : answered === a.questions.length ? 'manual_all' : 'manual_unanswered'
  a.finishedAt = isTimeout && a.deadline ? a.deadline : now

  // 集計：選択済みのみ。未選択は分母外
  for (const aq of a.questions) {
    if (!aq.selectedId) continue
    const v = s.questions.find((q) => q.id === aq.questionId)?.versions.find((x) => x.versionId === aq.versionId)
    if (!v) continue
    const st = s.stats[v.statsVersionId]
    if (a.kind === 'review') {
      st.reviewN++
      if (aq.correct) st.reviewCorrect++
    } else {
      st.basicN++
      if (aq.correct) st.basicCorrect++
      rejudge(st, s.rule, now)
    }
  }

  // 認定
  if (a.mode === 'test' && a.kind === 'normal' && a.certifying && a.subject.type === 'user' && a.testType) {
    const userId = a.subject.userId
    const user = s.users.find((u) => u.id === userId)
    if (user && ELIGIBLE_TEST[user.level] === a.testType) {
      const score = a.questions.filter((q) => q.correct).length
      const passed = score >= PASS_SCORE
      const r: Recognition = {
        testType: a.testType,
        passed,
        levelBefore: user.level,
        levelAfter: user.level,
        passesBefore: user.passes,
        passesAfter: user.passes,
        expertPassesBefore: user.expertPasses,
        expertPassesAfter: user.expertPasses,
        promoted: false,
        processedAt: now,
      }
      if (passed) {
        if (a.testType === 'star') user.expertPasses++
        else {
          user.passes++
          if (user.passes >= PASSES_TO_PROMOTE) {
            user.level = (user.level + 1) as Level
            user.passes = 0
            r.promoted = true
          }
        }
      }
      r.levelAfter = user.level
      r.passesAfter = r.promoted ? PASSES_TO_PROMOTE : user.passes
      r.expertPassesAfter = user.expertPasses
      a.recognition = r
    }
  }
  a.aggregated = true
  return { ok: true, id: a.id }
}

/** サーバー側の期限判定の代わり。期限切れの回答中の回を自動確定する */
export function expireOverdue(s: AppState, now: string) {
  let n = 0
  for (const a of s.attempts) {
    if (a.status === 'in_progress' && a.deadline && new Date(now) >= new Date(a.deadline) && sameSubject(a.subject, subjectOf(s))) {
      finishAttempt(s, a.id, 'timeout', now)
      n++
    }
  }
  return n
}

/* ---------- 単問回答（FR-02） ---------- */

function viewedKey(s: AppState) {
  return subjectKey(subjectOf(s))
}
export function hasViewedExplanation(s: AppState, versionId: string) {
  return (s.viewedExplanations[viewedKey(s)] ?? []).includes(versionId)
}
export function viewExplanation(s: AppState, versionId: string) {
  const k = viewedKey(s)
  const list = s.viewedExplanations[k] ?? []
  if (!list.includes(versionId)) s.viewedExplanations[k] = [...list, versionId]
}

export function answerSingle(s: AppState, questionId: string, versionId: string, selectedId: string, eventId: string, now: string): Result {
  if (s.singleAnswers.some((x) => x.id === eventId)) return { ok: true, id: eventId } // 同一イベントの再送
  const q = s.questions.find((x) => x.id === questionId)
  const v = q?.versions.find((x) => x.versionId === versionId)
  if (!q || !v) return { ok: false, message: '問題が見つかりません。' }
  const before = !hasViewedExplanation(s, versionId)
  const correct = selectedId === v.correctId
  s.singleAnswers.push({ id: eventId, versionId, subject: subjectOf(s), selectedId, correct, beforeExplanation: before, counted: before ? 'basic' : 'none', at: now })
  if (before) {
    const st = s.stats[v.statsVersionId]
    st.basicN++
    if (correct) st.basicCorrect++
    rejudge(st, s.rule, now)
  }
  viewExplanation(s, versionId)
  return { ok: true, id: eventId, message: before ? undefined : '解説の閲覧後の回答のため、正答率の集計には含まれません。' }
}

/* ---------- 誤り報告（FR-23） ---------- */

export function submitReport(s: AppState, input: { questionId: string; versionId: string; attemptId: string | null; reason: ReportReason; body: string }, now: string): Result {
  if (s.demo.failNextReport) {
    s.demo.failNextReport = false
    return { ok: false, message: '送信に失敗しました。時間をおいて再度お試しください（デモ）。' }
  }
  const r: IssueReport = { id: uid('rp'), ...input, at: now, status: 'received' }
  s.reports.push(r)
  return { ok: true, id: r.id, message: '報告を受け付けました。ご協力ありがとうございます。' }
}
