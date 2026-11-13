'use client'

import { useSyncExternalStore } from 'react'
import { mockConfig, testCompositions, testConfig } from './config'
import { createSeedStats, getContent } from './data/questions'
import { createRng, selectQuestionSet, toSetKey, countByDifficulty } from './question-selector'
import { applyRecognition, eligibleTestKind } from './recognition'
import { isPassed, scoreAttempt } from './scoring'
import { applyAnswerToStats, buildAllQuestions, buildQuestion, resolveSnapshot, toSnapshot } from './stats'
import { jstDateKey } from './time'
import type {
  Attempt,
  AttemptStatus,
  Level,
  PracticeSettings,
  Question,
  QuestionSnapshot,
  QuestionStats,
  Report,
  ReportReason,
  SetHistoryEntry,
  SingleAnswerRecord,
  TestKind,
  UserProfile,
} from './types'

/**
 * UI確認用のモック永続化（localStorage）。
 * 本番の実績・全体集計はサーバー側で扱う前提で、ここでは成立させない。
 */
const STORAGE_KEY = 'cosmo-quiz-mock-v3'
export const DEMO_USER_ID = 'demo-user'

export interface DemoFlags {
  saveFailure: boolean
  reportFailure: boolean
  listError: boolean
  emptyHistory: boolean
}

export interface AppState {
  schemaVersion: 3
  sessionUserId: string | null
  users: Record<string, UserProfile>
  stats: Record<string, QuestionStats>
  statsRevision: number
  attempts: Record<string, Attempt>
  singleAnswers: Record<string, Record<string, SingleAnswerRecord>>
  setHistory: SetHistoryEntry[]
  reports: Report[]
  demo: DemoFlags
}

let current: AppState | null = null
const listeners = new Set<() => void>()

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function ownerKeyOf(state: AppState) {
  return state.sessionUserId ?? 'guest'
}

export function currentUser(state: AppState): UserProfile | null {
  return state.sessionUserId ? state.users[state.sessionUserId] ?? null : null
}

/* ---------- 終了・採点・統計・認定（同じ attemptId に一度だけ） ---------- */

function finalizeInto(state: AppState, attempt: Attempt, status: AttemptStatus, finishedAt: string) {
  if (attempt.finalized) return
  attempt.status = status
  attempt.finishedAt = finishedAt
  attempt.analytics = scoreAttempt(attempt, status, finishedAt)
  for (const snap of attempt.questionSnapshots) {
    const answer = attempt.answers[snap.questionId]
    if (answer === null || answer === undefined) continue
    const version = resolveSnapshot(snap)
    applyAnswerToStats(state.stats, snap.questionId, snap.versionId, version?.correctChoiceId === answer, attempt.statsBucket)
  }
  state.statsRevision += 1
  if (attempt.mode === 'test') {
    const user = attempt.userId ? state.users[attempt.userId] : undefined
    attempt.recognition = user ? applyRecognition(user, attempt, isPassed(attempt)) : { applied: false, reason: 'guest' }
  }
  attempt.finalized = true
}

function sweepExpired(state: AppState) {
  const now = Date.now()
  for (const attempt of Object.values(state.attempts)) {
    if (attempt.status === 'inProgress' && attempt.deadlineAt && new Date(attempt.deadlineAt).getTime() <= now) {
      finalizeInto(state, attempt, 'timedOut', attempt.deadlineAt)
    }
  }
}

/* ---------- シード ---------- */

function makeAnswers(snaps: QuestionSnapshot[], correct: number, wrong: number) {
  const answers: Record<string, string | null> = {}
  snaps.forEach((snap, i) => {
    const v = resolveSnapshot(snap)!
    if (i < correct) answers[snap.questionId] = v.correctChoiceId
    else if (i < correct + wrong) answers[snap.questionId] = v.choices.find((c) => c.id !== v.correctChoiceId)!.id
    else answers[snap.questionId] = null
  })
  return answers
}

function seedAttempt(
  partial: Omit<Attempt, 'answers' | 'finalized' | 'currentIndex' | 'statsBucket' | 'recognitionEligible'> & {
    recognitionEligible?: boolean
  },
  correct: number,
  wrong: number,
): Attempt {
  return {
    ...partial,
    recognitionEligible: partial.recognitionEligible ?? false,
    statsBucket: partial.mode === 'review' ? 'review' : 'basic',
    answers: makeAnswers(partial.questionSnapshots, correct, wrong),
    currentIndex: 0,
    finalized: false,
  }
}

function createSeedState(): AppState {
  const stats = createSeedStats()
  const all = buildAllQuestions(stats)
  const rng = createRng(20261107)
  const now = Date.now()
  const day = 86400000
  const iso = (t: number) => new Date(t).toISOString()

  const user: UserProfile = {
    id: DEMO_USER_ID,
    displayName: 'デモユーザー',
    level: 'beginner',
    passesAtCurrentLevel: 0,
    expertPasses: 0,
    recognizedAttemptIds: [],
  }

  const testSet = () => {
    const r = selectQuestionSet({ pool: all, count: 40, composition: testCompositions.toIntermediate, avoidSetKeys: [], rng })
    if (!r.ok) throw new Error('seed failed')
    return r
  }
  const practiceSet = (count: number) => {
    const r = selectQuestionSet({ pool: all, count, avoidSetKeys: [], rng })
    if (!r.ok) throw new Error('seed failed')
    return r
  }

  // 訂正前の版（Q-021 v1）を含むテスト
  const failedSet = testSet()
  let failedSnaps = failedSet.questions.map(toSnapshot)
  if (!failedSnaps.some((s) => s.questionId === 'Q-021')) {
    const idx = failedSnaps.findIndex((s) => s.fieldId === 'stars')
    failedSnaps[idx] = { questionId: 'Q-021', versionId: 'Q-021-v1', fieldId: 'stars', difficulty: 'intermediate', displayAccuracy: 0.41 }
  } else {
    failedSnaps = failedSnaps.map((s) => (s.questionId === 'Q-021' ? { ...s, versionId: 'Q-021-v1' } : s))
  }
  // 訂正版の問題を正誤対象に含めるため先頭へ
  failedSnaps = [
    ...failedSnaps.filter((s) => s.questionId === 'Q-021'),
    ...failedSnaps.filter((s) => s.questionId !== 'Q-021'),
  ]

  const p1Set = practiceSet(10)
  const practiceDone = seedAttempt(
    {
      id: 'att-seed-practice',
      mode: 'practice',
      userId: DEMO_USER_ID,
      userLevelAtStart: 'beginner',
      questionSnapshots: p1Set.questions.map(toSnapshot),
      startedAt: iso(now - 5 * day),
      status: 'inProgress',
      practiceSettings: { count: 10, fieldIds: [], difficulties: [], timeLimitMinutes: null },
      setKey: p1Set.setKey,
    },
    7,
    1,
  )

  const testFailed = seedAttempt(
    {
      id: 'att-seed-test-failed',
      mode: 'test',
      testKind: 'toIntermediate',
      userId: DEMO_USER_ID,
      userLevelAtStart: 'beginner',
      recognitionEligible: true,
      questionSnapshots: failedSnaps,
      startedAt: iso(now - 4 * day),
      deadlineAt: iso(now - 4 * day + 60 * 60000),
      status: 'inProgress',
      baseComposition: testCompositions.toIntermediate,
      actualComposition: countByDifficulty(failedSnaps),
      compositionAdjusted: failedSet.adjusted,
      setKey: toSetKey(failedSnaps.map((s) => s.questionId)),
    },
    28,
    9,
  )

  const review = seedAttempt(
    {
      id: 'att-seed-review',
      mode: 'review',
      userId: DEMO_USER_ID,
      userLevelAtStart: 'beginner',
      questionSnapshots: failedSnaps.map((s) => {
        const q = buildQuestion(s.questionId, stats)!
        return toSnapshot(q)
      }),
      startedAt: iso(now - 3 * day),
      status: 'inProgress',
      sourceAttemptId: 'att-seed-test-failed',
      setKey: testFailed.setKey,
    },
    34,
    6,
  )

  const timedSet = testSet()
  const testTimedPass = seedAttempt(
    {
      id: 'att-seed-test-timeout-pass',
      mode: 'test',
      testKind: 'toIntermediate',
      userId: DEMO_USER_ID,
      userLevelAtStart: 'beginner',
      recognitionEligible: true,
      questionSnapshots: timedSet.questions.map(toSnapshot),
      startedAt: iso(now - 2 * day),
      deadlineAt: iso(now - 2 * day + 60 * 60000),
      status: 'inProgress',
      baseComposition: testCompositions.toIntermediate,
      actualComposition: timedSet.actualComposition,
      compositionAdjusted: timedSet.adjusted,
      setKey: timedSet.setKey,
    },
    32,
    0,
  )

  const passSet = testSet()
  const testPass = seedAttempt(
    {
      id: 'att-seed-test-pass',
      mode: 'test',
      testKind: 'toIntermediate',
      userId: DEMO_USER_ID,
      userLevelAtStart: 'beginner',
      recognitionEligible: true,
      questionSnapshots: passSet.questions.map(toSnapshot),
      startedAt: iso(now - 1 * day),
      deadlineAt: iso(now - 1 * day + 60 * 60000),
      status: 'inProgress',
      baseComposition: testCompositions.toIntermediate,
      actualComposition: passSet.actualComposition,
      compositionAdjusted: passSet.adjusted,
      setKey: passSet.setKey,
    },
    35,
    4,
  )

  const resumeSet = practiceSet(5)
  const inProgress = seedAttempt(
    {
      id: 'att-seed-in-progress',
      mode: 'practice',
      userId: DEMO_USER_ID,
      userLevelAtStart: 'beginner',
      questionSnapshots: resumeSet.questions.map(toSnapshot),
      startedAt: iso(now - 50 * 60000),
      status: 'inProgress',
      practiceSettings: { count: 5, fieldIds: [], difficulties: [], timeLimitMinutes: null },
      setKey: resumeSet.setKey,
    },
    2,
    0,
  )
  inProgress.currentIndex = 2

  const state: AppState = {
    schemaVersion: 3,
    sessionUserId: null,
    users: { [DEMO_USER_ID]: user },
    stats,
    statsRevision: 0,
    attempts: {},
    singleAnswers: {},
    setHistory: [],
    reports: [],
    demo: { saveFailure: false, reportFailure: false, listError: false, emptyHistory: false },
  }

  // シードは表示用の過去データ。全体統計は既存値に含まれている扱いで二重加算しない
  const finalizeSeed = (a: Attempt, status: AttemptStatus, durationMin: number) => {
    const finishedAt = status === 'timedOut' && a.deadlineAt ? a.deadlineAt : iso(new Date(a.startedAt).getTime() + durationMin * 60000)
    const statsBackup = state.stats
    state.stats = structuredClone(statsBackup)
    finalizeInto(state, a, status, finishedAt)
    state.stats = statsBackup
    state.attempts[a.id] = a
    a.resultViewed = true
  }
  finalizeSeed(practiceDone, 'completed', 14)
  finalizeSeed(testFailed, 'completed', 48)
  finalizeSeed(review, 'completed', 22)
  finalizeSeed(testTimedPass, 'timedOut', 60)
  finalizeSeed(testPass, 'completed', 41)
  state.attempts[inProgress.id] = inProgress
  state.statsRevision = 0
  return state
}

/* ---------- ストア基盤 ---------- */

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.schemaVersion === 3) return parsed
    }
  } catch {
    // 破損時は初期データで作り直す
  }
  return createSeedState()
}

function persist(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

function emit() {
  for (const l of listeners) l()
}

export function getState(): AppState {
  if (!current) {
    const loaded = load()
    sweepExpired(loaded)
    current = loaded
    persist(loaded)
  }
  return current
}

function update<T>(mutator: (draft: AppState) => T, requirePersistence = false): T {
  const draft = structuredClone(getState())
  const result = mutator(draft)
  const saved = persist(draft)
  if (requirePersistence && !saved) throw new Error('回答を保存できませんでした')
  current = draft
  emit()
  return result
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    current = null
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** サーバー描画時は null（読み込み中表示）。クライアントでモックDBを読む */
export function useAppState(): AppState | null {
  return useSyncExternalStore(
    subscribe,
    () => getState(),
    () => null,
  )
}

/* ---------- 問題 ---------- */

export function getAllQuestions(state: AppState): Question[] {
  return buildAllQuestions(state.stats)
}

function recentSetKeys(state: AppState) {
  const owner = ownerKeyOf(state)
  const today = jstDateKey()
  // 日付が変わったら重複防止用の履歴だけリセット（個人成績は消さない）
  return state.setHistory
    .filter((e) => e.ownerKey === owner && e.jstDate === today)
    .slice(-mockConfig.setAvoidance.recentSets)
    .map((e) => e.setKey)
}

/** セット履歴は開始時に記録する仮仕様（本番では記録タイミング未確定） */
function recordSet(state: AppState, setKey: string) {
  const today = jstDateKey()
  state.setHistory = state.setHistory.filter((e) => e.jstDate === today)
  state.setHistory.push({ ownerKey: ownerKeyOf(state), setKey, jstDate: today, createdAt: new Date().toISOString() })
}

export function filterPracticePool(questions: Question[], settings: Pick<PracticeSettings, 'fieldIds' | 'difficulties' | 'keyword'>) {
  const kw = settings.keyword?.trim()
  return questions.filter(
    (q) =>
      (settings.fieldIds.length === 0 || settings.fieldIds.includes(q.fieldId)) &&
      (settings.difficulties.length === 0 || settings.difficulties.includes(q.difficulty)) &&
      (!kw || q.text.includes(kw)),
  )
}

/* ---------- アクション ---------- */

export type StartResult = { ok: true; attemptId: string } | { ok: false; message: string }

export const actions = {
  login() {
    update((s) => {
      s.sessionUserId = DEMO_USER_ID
    })
  },
  logout() {
    update((s) => {
      s.sessionUserId = null
    })
  },

  startPractice(settings: PracticeSettings): StartResult {
    return update<StartResult>((s) => {
      const pool = filterPracticePool(getAllQuestions(s), settings)
      const result = selectQuestionSet({ pool, count: settings.count, avoidSetKeys: recentSetKeys(s), rng: createRng(Date.now()) })
      if (!result.ok) return { ok: false, message: result.message }
      const user = currentUser(s)
      const now = new Date()
      const attempt: Attempt = {
        id: uid('att'),
        mode: 'practice',
        userId: user?.id,
        userLevelAtStart: user?.level,
        recognitionEligible: false,
        questionSnapshots: result.questions.map(toSnapshot),
        answers: Object.fromEntries(result.questions.map((q) => [q.id, null])),
        startedAt: now.toISOString(),
        deadlineAt: settings.timeLimitMinutes ? new Date(now.getTime() + settings.timeLimitMinutes * 60000).toISOString() : undefined,
        status: 'inProgress',
        currentIndex: 0,
        finalized: false,
        statsBucket: 'basic',
        practiceSettings: settings,
        setKey: result.setKey,
      }
      s.attempts[attempt.id] = attempt
      recordSet(s, result.setKey)
      return { ok: true, attemptId: attempt.id }
    })
  },

  /** テストの問題セットを用意（開始前サマリー用）。時間はまだ計測しない */
  prepareTest(kind: TestKind) {
    const s = getState()
    const result = selectQuestionSet({
      pool: getAllQuestions(s),
      count: testConfig.questionCount,
      composition: testCompositions[kind],
      avoidSetKeys: recentSetKeys(s),
      rng: createRng(Date.now() ^ Math.floor(Math.random() * 1e9)),
    })
    return result
  },

  startTest(kind: TestKind, questions: Question[], meta: { adjusted: boolean }): StartResult {
    return update<StartResult>((s) => {
      const user = currentUser(s)
      // 実開始時に資格を再確認
      if (user && eligibleTestKind(user.level) !== kind) {
        return { ok: false, message: '現在のレベルでは、このテストは開始できません。' }
      }
      const setKey = toSetKey(questions.map((q) => q.id))
      const now = new Date()
      const attempt: Attempt = {
        id: uid('att'),
        mode: 'test',
        testKind: kind,
        userId: user?.id,
        userLevelAtStart: user?.level,
        recognitionEligible: Boolean(user),
        questionSnapshots: questions.map(toSnapshot),
        answers: Object.fromEntries(questions.map((q) => [q.id, null])),
        startedAt: now.toISOString(),
        deadlineAt: new Date(now.getTime() + testConfig.durationMinutes * 60000).toISOString(),
        status: 'inProgress',
        currentIndex: 0,
        finalized: false,
        statsBucket: 'basic',
        baseComposition: testCompositions[kind],
        actualComposition: countByDifficulty(questions),
        compositionAdjusted: meta.adjusted,
        setKey,
      }
      s.attempts[attempt.id] = attempt
      recordSet(s, setKey)
      return { ok: true, attemptId: attempt.id }
    })
  },

  /** 履歴の同じセットを練習し直す（復習）。重複は許可、認定なし */
  startReview(sourceAttemptId: string): StartResult {
    return update<StartResult>((s) => {
      const source = s.attempts[sourceAttemptId]
      if (!source) return { ok: false, message: '元の回が見つかりません。' }
      const questions = source.questionSnapshots.map((snap) => buildQuestion(snap.questionId, s.stats)).filter(Boolean) as Question[]
      const user = currentUser(s)
      const attempt: Attempt = {
        id: uid('att'),
        mode: 'review',
        userId: user?.id,
        userLevelAtStart: user?.level,
        recognitionEligible: false,
        questionSnapshots: questions.map(toSnapshot),
        answers: Object.fromEntries(questions.map((q) => [q.id, null])),
        startedAt: new Date().toISOString(),
        status: 'inProgress',
        currentIndex: 0,
        finalized: false,
        statsBucket: 'review',
        sourceAttemptId,
        setKey: source.setKey,
      }
      s.attempts[attempt.id] = attempt
      return { ok: true, attemptId: attempt.id }
    })
  },

  /** 回答の保存。デモ設定で失敗させられる */
  saveAnswers(attemptId: string, answers: Record<string, string | null>) {
    if (getState().demo.saveFailure) throw new Error('save failed')
    update((s) => {
      const a = s.attempts[attemptId]
      if (!a || a.status !== 'inProgress') return
      Object.assign(a.answers, answers)
    }, true)
  },

  setCurrentIndex(attemptId: string, index: number) {
    update((s) => {
      const a = s.attempts[attemptId]
      if (a && a.status === 'inProgress') a.currentIndex = index
    })
  },

  finalizeAttempt(attemptId: string, status: AttemptStatus, finalAnswers?: Record<string, string | null>) {
    update((s) => {
      const a = s.attempts[attemptId]
      if (!a || a.finalized) return
      if (finalAnswers) Object.assign(a.answers, finalAnswers)
      if (a.deadlineAt && new Date(a.deadlineAt).getTime() <= Date.now()) status = 'timedOut'
      const finishedAt = status === 'timedOut' && a.deadlineAt ? a.deadlineAt : new Date().toISOString()
      finalizeInto(s, a, status, finishedAt)
    })
  },

  markResultViewed(attemptId: string) {
    const a = getState().attempts[attemptId]
    if (!a || a.resultViewed || !a.finalized) return
    update((s) => {
      s.attempts[attemptId].resultViewed = true
    })
  },

  /** 一覧の単問回答（解説前）。基本統計の対象 */
  answerSingle(questionId: string, choiceId: string) {
    update((s) => {
      const owner = ownerKeyOf(s)
      if (s.singleAnswers[owner]?.[questionId]) return
      const q = buildQuestion(questionId, s.stats)
      if (!q) return
      const correct = q.correctChoiceId === choiceId
      applyAnswerToStats(s.stats, q.id, q.versionId, correct, 'basic')
      s.statsRevision += 1
      s.singleAnswers[owner] = {
        ...(s.singleAnswers[owner] ?? {}),
        [questionId]: { questionId, versionId: q.versionId, choiceId, explanationOnly: false, correct, at: new Date().toISOString() },
      }
    })
  },

  /** 解説だけを見る（仮仕様）。統計は増やさず、後から選んでも基本統計対象にしない */
  viewExplanationOnly(questionId: string) {
    update((s) => {
      const owner = ownerKeyOf(s)
      if (s.singleAnswers[owner]?.[questionId]) return
      const content = getContent(questionId)
      if (!content) return
      s.singleAnswers[owner] = {
        ...(s.singleAnswers[owner] ?? {}),
        [questionId]: { questionId, versionId: content.current.versionId, choiceId: null, explanationOnly: true, correct: null, at: new Date().toISOString() },
      }
    })
  },

  addReport(input: { questionId: string; versionId: string; reason: ReportReason; detail: string }) {
    update((s) => {
      s.reports.push({ ...input, id: uid('rep'), createdAt: new Date().toISOString(), ownerKey: ownerKeyOf(s) })
    })
  },

  /* ---------- デモ設定 ---------- */

  setDemoFlag(flag: keyof DemoFlags, value: boolean) {
    update((s) => {
      s.demo[flag] = value
      if (flag === 'listError') s.statsRevision += 1
    })
  },

  applyUserPreset(level: Level, passesAtCurrentLevel: number, expertPasses = 0) {
    update((s) => {
      const u = s.users[DEMO_USER_ID]
      u.level = level
      u.passesAtCurrentLevel = level === 'expert' ? 0 : passesAtCurrentLevel
      u.expertPasses = level === 'expert' ? expertPasses : 0
    })
  },

  setDeadlineFromNow(attemptId: string, seconds: number) {
    update((s) => {
      const a = s.attempts[attemptId]
      if (!a || a.status !== 'inProgress') return
      a.deadlineAt = new Date(Date.now() + seconds * 1000).toISOString()
    })
  },

  /** 結果シナリオ。通常と同じ終了処理（認定・統計）を通す */
  runScenario(scenario: 'fail31' | 'pass32' | 'timeout32' | 'timeout0'): StartResult {
    return update<StartResult>((s) => {
      const user = currentUser(s)
      const kind: TestKind = user ? eligibleTestKind(user.level) : 'toIntermediate'
      const result = selectQuestionSet({
        pool: getAllQuestions(s),
        count: testConfig.questionCount,
        composition: testCompositions[kind],
        avoidSetKeys: [],
        rng: createRng(Date.now()),
      })
      if (!result.ok) return { ok: false, message: result.message }
      const snaps = result.questions.map(toSnapshot)
      const [correct, wrong] = { fail31: [31, 9], pass32: [32, 8], timeout32: [32, 0], timeout0: [0, 0] }[scenario]
      const timed = scenario.startsWith('timeout')
      const startedAt = Date.now() - (timed ? 60 : 38) * 60000
      const attempt: Attempt = {
        id: uid('att'),
        mode: 'test',
        testKind: kind,
        userId: user?.id,
        userLevelAtStart: user?.level,
        recognitionEligible: Boolean(user),
        questionSnapshots: snaps,
        answers: makeAnswers(snaps, correct, wrong),
        startedAt: new Date(startedAt).toISOString(),
        deadlineAt: new Date(startedAt + 60 * 60000).toISOString(),
        status: 'inProgress',
        currentIndex: 0,
        finalized: false,
        statsBucket: 'basic',
        baseComposition: testCompositions[kind],
        actualComposition: result.actualComposition,
        compositionAdjusted: result.adjusted,
        setKey: result.setKey,
      }
      s.attempts[attempt.id] = attempt
      finalizeInto(s, attempt, timed ? 'timedOut' : 'completed', timed ? attempt.deadlineAt! : new Date().toISOString())
      return { ok: true, attemptId: attempt.id }
    })
  },

  resetMock() {
    const fresh = createSeedState()
    current = fresh
    persist(fresh)
    emit()
  },
}
