'use client'

/**
 * ブラウザ内で GAS の代わりをするモック（サーバー役）。
 * 採点・認定・統計は lib/store.ts（モックのデータ）の処理をそのまま使い、
 * 返す内容は docs/api.md の形にそろえる。問題を返すときは正解・解説を含めない。
 */
import { mockConfig } from '../config'
import { notices } from '../data/notices'
import { inProgressAttempts, ownedAttempts, solvedQuestions } from '../selectors'
import { buildQuestion, resolveSnapshot } from '../stats'
import { actions, currentUser, DEMO_USER_ID, getAllQuestions, getState, isOwnAttempt, ownerKeyOf, type AppState } from '../store'
import type { Attempt, PracticeSettings, Question, QuestionSnapshot, ReportReason, TestKind } from '../types'
import type { ApiRequest } from './client'
import type {
  ApiErrorCode,
  AttemptDetail,
  AttemptQuestion,
  AttemptReviewItem,
  AttemptSummary,
  ExplanationInfo,
  PublicQuestion,
  QuestionDetail,
  SessionInfo,
  SingleAnswerResult,
  StartAttemptParams,
} from './types'

const MOCK_TOKEN = `mock:${DEMO_USER_ID}`
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

class MockError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message)
  }
}

/* ---------- 変換（正解・解説を外す） ---------- */

/** モックの時事問題（表示の確認用）：問題ID → 出題日 */
const MOCK_TIME_SENSITIVE: Record<string, string> = { 'Q-076': '2026-11-20' }
const timeInfo = (id: string) => (MOCK_TIME_SENSITIVE[id] ? { postedOn: MOCK_TIME_SENSITIVE[id], timeSensitive: true } : {})

function toPublic(q: Question): PublicQuestion {
  return { id: q.id, versionId: q.versionId, fieldId: q.fieldId, text: q.text, choices: q.choices, difficulty: q.difficulty, displayAccuracy: q.displayAccuracy, ...timeInfo(q.id) }
}

function snapToPublic(s: QuestionSnapshot): AttemptQuestion | null {
  const v = resolveSnapshot(s)
  if (!v) return null
  return { id: s.questionId, versionId: s.versionId, fieldId: s.fieldId, text: v.text, choices: v.choices, difficulty: s.difficulty, displayAccuracy: s.displayAccuracy, ...timeInfo(s.questionId) }
}

function explanationOf(q: { correctChoiceId: string; explanation: string; references: ExplanationInfo['references'] }): ExplanationInfo {
  return { correctChoiceId: q.correctChoiceId, explanation: q.explanation, references: q.references }
}

function toSummary(a: Attempt): AttemptSummary {
  return {
    id: a.id,
    mode: a.mode,
    testKind: a.testKind,
    status: a.status,
    finalized: a.finalized,
    recognitionEligible: a.recognitionEligible,
    startedAt: a.startedAt,
    deadlineAt: a.deadlineAt,
    finishedAt: a.finishedAt,
    questionCount: a.questionSnapshots.length,
    answeredCount: Object.values(a.answers).filter((v) => v !== null && v !== undefined).length,
    practiceSettings: a.practiceSettings,
    sourceAttemptId: a.sourceAttemptId,
    analytics: a.analytics,
    recognition: a.recognition,
  }
}

const savedSeqs = new Map<string, number>()

function toDetail(a: Attempt): AttemptDetail {
  const questions = a.questionSnapshots.map(snapToPublic).filter(Boolean) as AttemptQuestion[]
  const detail: AttemptDetail = {
    ...toSummary(a),
    currentIndex: a.currentIndex,
    questions,
    answers: { ...a.answers },
    savedSeq: savedSeqs.get(a.id) ?? 0,
    baseComposition: a.baseComposition,
    actualComposition: a.actualComposition,
    adjusted: a.compositionAdjusted,
  }
  // 正解・解説は終了後にだけ返す
  if (a.finalized) {
    detail.items = a.questionSnapshots.flatMap((s) => {
      const v = resolveSnapshot(s)
      const pub = snapToPublic(s)
      if (!v || !pub) return []
      const selected = a.answers[s.questionId] ?? null
      const item: AttemptReviewItem = { ...pub, ...explanationOf(v), selected, correct: selected === null ? null : selected === v.correctChoiceId }
      return [item]
    })
  }
  return detail
}

/* ---------- 共通の確認 ---------- */

/** トークン（ログイン）とモックのログイン状態をそろえる */
function syncSession(req: ApiRequest) {
  const want = req.token === MOCK_TOKEN ? DEMO_USER_ID : null
  if (req.token && req.token !== MOCK_TOKEN) throw new MockError('UNAUTHORIZED', 'ログインの有効期限が切れました。もう一度ログインしてください。')
  if (getState().sessionUserId !== want) {
    if (want) actions.login()
    else actions.logout()
  }
}

function ownAttempt(id: unknown): Attempt {
  const s = getState()
  const a = typeof id === 'string' ? s.attempts[id] : undefined
  if (!a) throw new MockError('NOT_FOUND', 'この回が見つかりません。')
  if (!isOwnAttempt(s, a)) throw new MockError('FORBIDDEN', 'この回は表示できません。')
  return a
}

function requireUser(s: AppState) {
  const u = currentUser(s)
  if (!u) throw new MockError('UNAUTHORIZED', 'ログインが必要です。')
  return u
}

function startErrorCode(message: string): ApiErrorCode {
  if (message.includes('レベル')) return 'NOT_ELIGIBLE'
  if (message.includes('別の問題セット')) return 'SET_EXHAUSTED'
  if (message.includes('出題ができません')) return 'SHORTAGE'
  return 'INVALID'
}

const reportRequests = new Set<string>()
const singleEvents = new Set<string>()

/* ---------- 処理 ---------- */

type P = Record<string, unknown>

const handlers: Record<string, (p: P) => unknown> = {
  'questions.index': () => {
    const s = getState()
    if (s.demo.listError) throw new MockError('INTERNAL', '問題を読み込めませんでした。')
    return { questions: getAllQuestions(s).map(toPublic) }
  },

  'questions.get': (p) => {
    const s = getState()
    if (s.demo.listError) throw new MockError('INTERNAL', '問題を読み込めませんでした。')
    const q = buildQuestion(String(p.questionId), s.stats)
    if (!q) throw new MockError('NOT_FOUND', '問題が見つかりません。')
    const r = s.singleAnswers[ownerKeyOf(s)]?.[q.id]
    const detail: QuestionDetail = {
      question: toPublic(q),
      mine: r ? { choiceId: r.choiceId, correct: r.correct, explanationOnly: r.explanationOnly, retries: r.retries ?? [] } : null,
      explanation: r ? explanationOf(q) : null,
    }
    return detail
  },

  'notices.list': () => ({ notices }),

  'single.answer': (p) => {
    const questionId = String(p.questionId)
    const choiceId = String(p.choiceId)
    const eventId = String(p.eventId)
    const before = getState()
    const q = buildQuestion(questionId, before.stats)
    if (!q) throw new MockError('NOT_FOUND', '問題が見つかりません。')
    const existed = Boolean(before.singleAnswers[ownerKeyOf(before)]?.[questionId])
    // 同じ eventId の再送は一度だけ記録する
    if (!singleEvents.has(eventId)) {
      singleEvents.add(eventId)
      if (existed) actions.retrySingle(questionId, choiceId)
      else actions.answerSingle(questionId, choiceId)
    }
    const result: SingleAnswerResult = { ...explanationOf(q), correct: choiceId === q.correctChoiceId, counted: !existed && p.kind === 'answer' }
    return result
  },

  'single.explanation': (p) => {
    const q = buildQuestion(String(p.questionId), getState().stats)
    if (!q) throw new MockError('NOT_FOUND', '問題が見つかりません。')
    actions.viewExplanationOnly(q.id)
    return explanationOf(q)
  },

  'attempts.start': (p) => {
    const params = p as unknown as StartAttemptParams
    let result
    if (params.mode === 'practice') {
      result = actions.startPractice(params.settings as PracticeSettings)
    } else if (params.mode === 'test') {
      const kind = params.testKind as TestKind
      const prepared = actions.prepareTest(kind)
      if (!prepared.ok) throw new MockError(startErrorCode(prepared.message), prepared.message)
      result = actions.startTest(kind, prepared.questions, { adjusted: prepared.adjusted })
    } else if (params.mode === 'review') {
      result = actions.startReview(params.sourceAttemptId ?? null, params.questionIds)
    } else {
      throw new MockError('INVALID', '開始する内容が正しくありません。')
    }
    if (!result.ok) throw new MockError(startErrorCode(result.message), result.message)
    return toDetail(getState().attempts[result.attemptId])
  },

  'attempts.save': (p) => {
    const a = ownAttempt(p.attemptId)
    if (a.finalized) throw new MockError('INVALID', 'この回はすでに終了しています。')
    if (a.deadlineAt && new Date(a.deadlineAt).getTime() <= Date.now()) throw new MockError('DEADLINE_PASSED', '制限時間を過ぎたため保存できません。')
    const seq = Number(p.seq) || 0
    const last = savedSeqs.get(a.id) ?? 0
    // 古い送信で新しい選択を上書きしない
    if (seq <= last) return { savedSeq: last }
    try {
      actions.saveAnswers(a.id, (p.answers ?? {}) as Record<string, string | null>)
    } catch {
      throw new MockError('INTERNAL', '回答を保存できませんでした。')
    }
    if (typeof p.currentIndex === 'number') actions.setCurrentIndex(a.id, p.currentIndex)
    savedSeqs.set(a.id, seq)
    return { savedSeq: seq }
  },

  'attempts.finish': (p) => {
    const a = ownAttempt(p.attemptId)
    if (!a.finalized) {
      const expired = Boolean(a.deadlineAt && new Date(a.deadlineAt).getTime() <= Date.now())
      // 期限後に届いた選択は使わず、期限時点の保存内容で採点する
      if (expired) actions.finalizeAttempt(a.id, 'timedOut')
      else actions.finalizeAttempt(a.id, 'completed', (p.answers ?? {}) as Record<string, string | null>)
    }
    return toDetail(getState().attempts[a.id])
  },

  'attempts.get': (p) => {
    const a = ownAttempt(p.attemptId)
    if (!a.finalized && a.deadlineAt && new Date(a.deadlineAt).getTime() <= Date.now()) {
      actions.finalizeAttempt(a.id, 'timedOut')
      return toDetail(getState().attempts[a.id])
    }
    return toDetail(a)
  },

  'attempts.inProgress': () => ({ attempts: inProgressAttempts(getState()).map(toSummary) }),

  'me.get': () => {
    const u = currentUser(getState())
    return { me: u ? { level: u.level, passesAtCurrentLevel: u.passesAtCurrentLevel, expertPasses: u.expertPasses } : null }
  },

  'history.list': () => {
    const s = getState()
    requireUser(s)
    return { attempts: ownedAttempts(s).map(toSummary) }
  },

  'history.questions': () => {
    const s = getState()
    requireUser(s)
    const all = getAllQuestions(s)
    return {
      rows: solvedQuestions(s).flatMap((r) => {
        const q = all.find((x) => x.id === r.questionId)
        return q ? [{ question: toPublic(q), lastCorrect: r.lastCorrect, lastAt: r.lastAt, count: r.count, lastAttemptId: r.lastAttemptId }] : []
      }),
    }
  },

  'reports.create': (p) => {
    const requestId = String(p.requestId)
    if (getState().demo.reportFailure) throw new MockError('INTERNAL', '送信できませんでした。')
    // 同じ requestId の再送は一度だけ記録する
    if (!reportRequests.has(requestId)) {
      reportRequests.add(requestId)
      actions.addReport({ questionId: String(p.questionId), versionId: String(p.versionId), reason: p.reason as ReportReason, detail: String(p.detail ?? '') })
    }
    return { reportId: requestId }
  },

  'auth.demoLogin': () => {
    actions.login()
    const session: SessionInfo = { token: MOCK_TOKEN, displayName: 'デモユーザー', expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() }
    return session
  },

  'auth.logout': () => {
    actions.logout()
    return { ok: true }
  },
}

export async function handleMockRequest(req: ApiRequest) {
  await wait(mockConfig.repository.latencyMs)
  const handler = handlers[req.action]
  if (!handler) return { ok: false, error: { code: 'INVALID', message: `不明な処理です：${req.action}` } }
  try {
    if (req.action !== 'auth.demoLogin') syncSession(req)
    return { ok: true, data: handler(req.params ?? {}) }
  } catch (e) {
    if (e instanceof MockError) return { ok: false, error: { code: e.code, message: e.message } }
    return { ok: false, error: { code: 'INTERNAL', message: '処理中にエラーが起きました。' } }
  }
}
