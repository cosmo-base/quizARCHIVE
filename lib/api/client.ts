'use client'

import { forgetAttemptToken, getAttemptToken, getGuestId, getSession, pinAttemptToken, setSession, updateSessionExpiry } from './session'
import {
  ApiError,
  type ApiErrorCode,
  type AttemptDetail,
  type AttemptSummary,
  type ExplanationInfo,
  type Me,
  type NoticeItem,
  type PublicQuestion,
  type QuestionDetail,
  type ReportParams,
  type SessionInfo,
  type SingleAnswerResult,
  type SolvedRow,
  type StartAttemptParams,
} from './types'

/**
 * GAS（Web アプリ）の URL。ビルド時に環境変数で渡す（コードには書かない）。
 * 未設定のときはブラウザ内のモック（lib/api/mock.ts）で動く。
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
export const isMockApi = API_URL === ''

export interface ApiRequest {
  action: string
  token?: string
  guestId?: string
  params: Record<string, unknown>
}

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: { code: ApiErrorCode; message: string } }

const RETRY_WAIT_MS = [800, 2000]

async function send<T>(req: ApiRequest): Promise<ApiResponse<T>> {
  if (isMockApi) {
    const { handleMockRequest } = await import('./mock')
    return (await handleMockRequest(req)) as ApiResponse<T>
  }
  // 事前確認の通信を起こさないよう text/plain で送る（docs/api.md）
  const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(req) })
  if (!res.ok) return { ok: false, error: { code: 'INTERNAL', message: '通信に失敗しました。' } }
  return (await res.json()) as ApiResponse<T>
}

/**
 * attemptId を渡すと、その回を始めたときのログイン用トークンで送る（覚えていれば）。
 * ログインの期限切れ・別のタブでのログアウトのあとも、始めた回を最後まで続けられるようにするため。
 */
async function call<T>(action: string, params: Record<string, unknown> = {}, opts: { attemptId?: string } = {}): Promise<T> {
  const session = getSession()
  // モックはログイン状態をブラウザ内で持つため、覚えたトークンは使わない
  const pinned = opts.attemptId && !isMockApi ? getAttemptToken(opts.attemptId) : null
  const token = pinned ?? session?.token ?? null
  const req: ApiRequest = { action, params, ...(token ? { token } : { guestId: getGuestId() }) }
  for (let attempt = 0; ; attempt++) {
    let res: ApiResponse<T>
    try {
      res = await send<T>(req)
    } catch {
      res = { ok: false, error: { code: 'BUSY', message: '通信に失敗しました。' } }
    }
    if (res.ok) {
      // 回の操作が通ったら、その回を始めた（今の）ログインを覚えておく
      if (opts.attemptId && !isMockApi && !pinned && session && token === session.token) pinAttemptToken(opts.attemptId, session.token)
      return res.data
    }
    // 混雑・通信失敗は少し待って再送する（保存は seq、終了・報告は ID で重複を防ぐ）
    if (res.error.code === 'BUSY' && attempt < RETRY_WAIT_MS.length) {
      await new Promise((r) => setTimeout(r, RETRY_WAIT_MS[attempt]))
      continue
    }
    if (res.error.code === 'UNAUTHORIZED') {
      if (pinned && opts.attemptId) forgetAttemptToken(opts.attemptId)
      // 今のログインそのものが断られたときだけ、ログアウトの状態にする
      if (session && token === session.token) setSession(null)
    }
    throw new ApiError(res.error.code, res.error.message)
  }
}

export function newRequestId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export const api = {
  questionsIndex: () => call<{ questions: PublicQuestion[] }>('questions.index'),
  questionsGet: (questionId: string) => call<QuestionDetail>('questions.get', { questionId }),
  noticesList: () => call<{ notices: NoticeItem[] }>('notices.list'),

  singleAnswer: (p: { questionId: string; versionId: string; choiceId: string; eventId: string; kind: 'answer' | 'retry' }) =>
    call<SingleAnswerResult>('single.answer', p),
  singleExplanation: (p: { questionId: string; versionId: string }) => call<ExplanationInfo>('single.explanation', p),

  attemptsStart: (p: StartAttemptParams) => call<AttemptDetail>('attempts.start', p),
  attemptsSave: (p: { attemptId: string; answers: Record<string, string | null>; seq: number; currentIndex?: number }) =>
    call<{ savedSeq: number }>('attempts.save', p, { attemptId: p.attemptId }),
  attemptsFinish: (p: { attemptId: string; answers: Record<string, string | null>; seq: number }) =>
    call<AttemptDetail>('attempts.finish', p, { attemptId: p.attemptId }),
  attemptsGet: (attemptId: string) => call<AttemptDetail>('attempts.get', { attemptId }, { attemptId }),
  attemptsInProgress: () => call<{ attempts: AttemptSummary[] }>('attempts.inProgress'),

  meGet: () =>
    call<{ me: Me | null; sessionExpiresAt?: string | null }>('me.get').then((r) => {
      updateSessionExpiry(r.sessionExpiresAt)
      return r
    }),
  historyList: () => call<{ attempts: AttemptSummary[] }>('history.list'),
  historyQuestions: () => call<{ rows: SolvedRow[] }>('history.questions'),

  reportsCreate: (p: ReportParams) => call<{ reportId: string }>('reports.create', { ...p }),

  /** Discord から受け取った code でログインする */
  authDiscord: (p: { code: string; redirectUri: string }) => call<SessionInfo>('auth.discord', p),
  /** モック専用のデモログイン（GAS につないでいるときは使わない） */
  authDemoLogin: () => call<SessionInfo>('auth.demoLogin'),
  authLogout: () => call<{ ok: true }>('auth.logout'),
}

/** ログイン（デモ）。成功したらこの端末にログイン状態を保存する */
export async function loginDemo() {
  const s = await api.authDemoLogin()
  setSession(s)
  return s
}

/** Discord から戻ってきた code でログインし、この端末にログイン状態を保存する */
export async function loginWithDiscordCode(code: string, redirectUri: string) {
  const s = await api.authDiscord({ code, redirectUri })
  setSession(s)
  return s
}

export async function logout() {
  try {
    await api.authLogout()
  } finally {
    setSession(null)
  }
}
