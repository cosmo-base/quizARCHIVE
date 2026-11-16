/**
 * 参加者向けサイトと GAS（またはモック）の間でやり取りするデータの形。
 * 仕様は docs/api.md。問題の形には正解・解説を含めない。
 */
import { testConfig } from '../config'
import type {
  AttemptAnalytics,
  AttemptStatus,
  Choice,
  Composition,
  Level,
  Mode,
  Notice,
  PracticeSettings,
  QuestionDifficulty,
  RecognitionOutcome,
  Reference,
  ReportReason,
  TestKind,
} from '../types'

export type ApiErrorCode =
  | 'INVALID'
  | 'UNAUTHORIZED'
  | 'NOT_MEMBER'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'NOT_ELIGIBLE'
  | 'SET_EXHAUSTED'
  | 'SHORTAGE'
  | 'DEADLINE_PASSED'
  | 'BUSY'
  | 'INTERNAL'

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** 問題（正解・解説なし） */
export interface PublicQuestion {
  id: string
  versionId: string
  fieldId: string
  text: string
  choices: Choice[]
  difficulty: QuestionDifficulty
  /** 参加者に見せる正答率（1つだけ）。null は未集計 */
  displayAccuracy: number | null
}

/** 正解・解説（回の終了後・単問の回答後にだけ返す） */
export interface ExplanationInfo {
  correctChoiceId: string
  explanation: string
  references: Reference[]
}

/** 単問に対する本人の記録 */
export interface MySingleRecord {
  choiceId: string | null
  correct: boolean | null
  explanationOnly: boolean
  retries: { choiceId: string; correct: boolean; at: string }[]
}

export interface QuestionDetail {
  question: PublicQuestion
  mine: MySingleRecord | null
  /** 回答済み・解説表示済みのときだけ入る */
  explanation: ExplanationInfo | null
}

export interface SingleAnswerResult extends ExplanationInfo {
  correct: boolean
  /** 基本統計に数えたか（解説前の最初の回答だけ true） */
  counted: boolean
}

/** 回の各問題（出題時に固定した版・難易度・正答率） */
export type AttemptQuestion = PublicQuestion

/** 終了後の各問題（自分の回答・正誤・正解・解説つき） */
export interface AttemptReviewItem extends AttemptQuestion, ExplanationInfo {
  selected: string | null
  correct: boolean | null
}

/** 回の一覧用の要約 */
export interface AttemptSummary {
  id: string
  mode: Mode
  testKind?: TestKind
  status: AttemptStatus
  finalized: boolean
  recognitionEligible: boolean
  startedAt: string
  deadlineAt?: string
  finishedAt?: string
  questionCount: number
  answeredCount: number
  practiceSettings?: PracticeSettings
  sourceAttemptId?: string
  analytics?: AttemptAnalytics
  recognition?: RecognitionOutcome
}

/** 回の詳細。回答中は正解なし、終了後は items に正解・解説が入る */
export interface AttemptDetail extends AttemptSummary {
  currentIndex: number
  questions: AttemptQuestion[]
  answers: Record<string, string | null>
  savedSeq: number
  baseComposition?: Composition
  actualComposition?: Record<QuestionDifficulty, number>
  adjusted?: boolean
  items?: AttemptReviewItem[]
}

export interface Me {
  level: Level
  passesAtCurrentLevel: number
  expertPasses: number
}

export interface SolvedRow {
  question: PublicQuestion
  lastCorrect: boolean | null
  lastAt: string
  count: number
  lastAttemptId?: string
}

export interface SessionInfo {
  token: string
  displayName: string
  expiresAt: string
}

export type StartAttemptParams =
  | { mode: 'practice'; settings: PracticeSettings }
  | { mode: 'test'; testKind: TestKind }
  | { mode: 'review'; sourceAttemptId?: string | null; questionIds?: string[] }

export interface ReportParams {
  questionId: string
  versionId: string
  attemptId?: string
  reason: ReportReason
  detail: string
  requestId: string
}

export type NoticeItem = Notice

/** 合否（テストのみ）。時間切れでも基準点以上なら合格 */
export function isPassedSummary(a: Pick<AttemptSummary, 'mode' | 'analytics'>) {
  return a.mode === 'test' && !!a.analytics && a.analytics.score >= testConfig.passScore
}
