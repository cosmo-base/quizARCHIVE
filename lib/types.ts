/** 4段階の名前は共通だが、個人レベル(userLevel)と問題難易度(questionDifficulty)は別の値として扱う */
export type Level = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type UserLevel = Level
export type QuestionDifficulty = Level

export type Mode = 'practice' | 'test' | 'review'
export type TestKind = 'toIntermediate' | 'toAdvanced' | 'toExpert' | 'expertStars'
export type AttemptStatus = 'inProgress' | 'completed' | 'timedOut'
export type StatsBucket = 'basic' | 'review'

export interface Choice {
  id: string
  text: string
}

export interface Reference {
  title: string
  url?: string
  publisher?: string
}

export interface Field {
  id: string
  name: string
}

/** 問題の版ごとの内容（問題文・選択肢・正解・解説） */
export interface QuestionVersion {
  versionId: string
  text: string
  choices: Choice[]
  correctChoiceId: string
  explanation: string
  references: Reference[]
}

/** 問題のマスター（現在版と過去版） */
export interface QuestionContent {
  id: string
  fieldId: string
  current: QuestionVersion
  previousVersions?: QuestionVersion[]
  snsAccuracy?: number
}

/** 現在版の統計。旧版の分母は新版へ足さない */
export interface QuestionStats {
  versionId: string
  basicAnswerCount: number
  basicCorrectCount: number
  reviewAnswerCount: number
  reviewCorrectCount: number
  /** 自動判定済みの難易度と、その判定時点の基本回答数 */
  judgedDifficulty?: QuestionDifficulty
  judgedAtCount?: number
  /** 版修正時、新版が最低件数に達するまで旧版の値を継承 */
  inherited?: { accuracy: number; difficulty: QuestionDifficulty }
}

/** 表示・出題で使う統合済みの問題 */
export interface Question {
  id: string
  versionId: string
  fieldId: string
  text: string
  choices: Choice[]
  correctChoiceId: string
  explanation: string
  references: Reference[]
  difficulty: QuestionDifficulty
  /** 参加者に見せる正答率は1つだけ。null は未集計 */
  displayAccuracy: number | null
  basicAnswerCount: number
  basicCorrectCount: number
  reviewAnswerCount: number
  reviewCorrectCount: number
  snsAccuracy?: number
  inheritedAccuracy?: number
}

/** 開始時に固定する問題の参照。内容は versionId から引く */
export interface QuestionSnapshot {
  questionId: string
  versionId: string
  fieldId: string
  difficulty: QuestionDifficulty
  displayAccuracy: number | null
}

export type CompositionKey = Level | 'any'
export type Composition = Partial<Record<CompositionKey, number>>

export interface PracticeSettings {
  count: number
  fieldIds: string[]
  difficulties: QuestionDifficulty[]
  timeLimitMinutes: number | null
  keyword?: string
}

export interface AttemptAnalytics {
  answeredCount: number
  unansweredCount: number
  correctCount: number
  wrongCount: number
  score: number
  totalCount: number
  scoreRate: number
  answeredAccuracy: number | null
  durationSec: number
  status: AttemptStatus
  userLevelAtStart?: UserLevel
  bucket: StatsBucket
}

export interface RecognitionOutcome {
  applied: boolean
  reason?: 'guest' | 'notPassed' | 'levelChanged' | 'notEligible'
  levelBefore?: UserLevel
  levelAfter?: UserLevel
  progressAfter?: number
  promoted?: boolean
  expertPassesAfter?: number
}

export interface Attempt {
  id: string
  mode: Mode
  testKind?: TestKind
  userId?: string
  userLevelAtStart?: UserLevel
  recognitionEligible: boolean
  questionSnapshots: QuestionSnapshot[]
  answers: Record<string, string | null>
  startedAt: string
  deadlineAt?: string
  finishedAt?: string
  status: AttemptStatus
  currentIndex: number
  sourceAttemptId?: string
  finalized: boolean
  statsBucket: StatsBucket
  practiceSettings?: PracticeSettings
  baseComposition?: Composition
  actualComposition?: Record<Level, number>
  compositionAdjusted?: boolean
  setKey: string
  analytics?: AttemptAnalytics
  recognition?: RecognitionOutcome
  resultViewed?: boolean
}

export interface UserProfile {
  id: string
  displayName: string
  level: UserLevel
  /** 現在レベルでの累計合格数（3で昇格。不合格でリセットしない） */
  passesAtCurrentLevel: number
  /** 専門家になってからの合格数。星はこの値から計算 */
  expertPasses: number
  recognizedAttemptIds: string[]
}

export interface SingleAnswerRecord {
  questionId: string
  versionId: string
  choiceId: string | null
  explanationOnly: boolean
  correct: boolean | null
  at: string
}

export type ReportReason = 'answer' | 'text' | 'explanation' | 'other'

export interface Report {
  id: string
  questionId: string
  versionId: string
  reason: ReportReason
  detail: string
  createdAt: string
  ownerKey: string
}

export interface SetHistoryEntry {
  ownerKey: string
  setKey: string
  jstDate: string
  createdAt: string
}

export interface Notice {
  id: string
  kind: 'correction' | 'info'
  title: string
  summary: string
  publishedAt: string
  body: string[]
  correction?: {
    questionId: string
    before: string
    after: string
  }
}
