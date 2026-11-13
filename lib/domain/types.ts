/**
 * 論理モデル（要件定義書 §13）をV0モック用に簡略化した型。
 * 実装テーブル名を強制するものではない。
 */

/** 1=初級 2=中級 3=上級 4=専門家 */
export type Difficulty = 1 | 2 | 3 | 4
/** 個人レベル。値の意味は Difficulty と同じだが別概念（§2） */
export type Level = 1 | 2 | 3 | 4

export type CategoryId = 'solar' | 'stellar' | 'physics' | 'history' | 'tech'

export interface Choice {
  id: string
  text: string
}

export interface Reference {
  title: string
  publisher?: string
  url?: string
}

export interface QuestionVersion {
  versionId: string
  questionId: string
  text: string
  choices: Choice[]
  correctId: string
  category: CategoryId
  explanation: string
  references: Reference[]
  createdAt: string
  changeNote?: string
  prevVersionId?: string
  /** モック上は版ごとに統計版を持つ（どの変更で統計版を更新するかは TBD-02） */
  statsVersionId: string
}

export interface QuestionStats {
  statsVersionId: string
  basicN: number
  basicCorrect: number
  reviewN: number
  reviewCorrect: number
  /** SNS正答率（0〜1）。欠損は null。0%として補完しない */
  snsRate: number | null
  difficulty: Difficulty
  /** 最後に難易度を判定した時点の基本回答数（0 = 未判定） */
  lastJudgedN: number
  judgedAt: string | null
  /** 新版が10件に達するまで継承する旧版の表示値（FR-22） */
  inherit: { fromStatsVersionId: string; rate: number | null; difficulty: Difficulty } | null
}

export interface Question {
  id: string
  /** 表示用の通し番号 */
  no: number
  /** 元データ行の識別子（再取り込み時の重複防止用・仮） */
  sourceRow: string
  status: 'published' | 'stopped'
  currentVersionId: string
  versions: QuestionVersion[]
}

export type Mode = 'practice' | 'test'
export type AttemptKind = 'normal' | 'review'
/** to2=中級昇格 to3=上級昇格 to4=専門家昇格 star=専門家の星 */
export type TestType = 'to2' | 'to3' | 'to4' | 'star'
export type AttemptStatus = 'in_progress' | 'completed' | 'timed_out' | 'invalidated'
export type FinishReason = 'manual_all' | 'manual_unanswered' | 'timeout'

export type Subject = { type: 'user'; userId: string } | { type: 'guest'; guestId: string }

export interface PracticeSettings {
  count: number
  categories: CategoryId[]
  difficulties: Difficulty[]
  /** 秒。null は無制限 */
  timeLimitSec: number | null
}

export interface AttemptQuestion {
  questionId: string
  versionId: string
  order: number
  difficultyAtStart: Difficulty
  category: CategoryId
  choiceOrder: string[]
  displayRateAtStart: number | null
  selectedId: string | null
  /** 古い再送で新しい選択を上書きしないための更新順序 */
  savedSeq: number
  savedAt: string | null
  correct: boolean | null
  viewed: boolean
}

export interface Recognition {
  testType: TestType
  passed: boolean
  levelBefore: Level
  levelAfter: Level
  passesBefore: number
  passesAfter: number
  expertPassesBefore: number
  expertPassesAfter: number
  promoted: boolean
  processedAt: string
}

export interface Composition {
  1: number
  2: number
  3: number
  4: number
  any: number
}

export interface Attempt {
  id: string
  subject: Subject
  mode: Mode
  kind: AttemptKind
  testType: TestType | null
  /** 開始時に固定した認定資格 */
  certifying: boolean
  /** 回答時の個人レベル（ゲストは null） */
  levelAtStart: Level | null
  practice: PracticeSettings | null
  baseComposition: Composition | null
  actualComposition: Composition | null
  sourceAttemptId: string | null
  setKey: string
  startedAt: string
  deadline: string | null
  finishedAt: string | null
  status: AttemptStatus
  finishReason: FinishReason | null
  questions: AttemptQuestion[]
  currentIndex: number
  /** 終了処理で一度だけ反映したかどうか（再送対策） */
  aggregated: boolean
  recognition: Recognition | null
}

export interface User {
  id: string
  name: string
  level: Level
  /** 現在の段階の累計合格数（昇格で0に戻る） */
  passes: number
  /** 専門家到達後の専門家テスト累計合格（星の計算用） */
  expertPasses: number
  createdAt: string
}

export interface SingleAnswer {
  id: string
  versionId: string
  subject: Subject
  selectedId: string
  correct: boolean
  beforeExplanation: boolean
  counted: 'basic' | 'none'
  at: string
}

export interface Notice {
  id: string
  title: string
  body: string
  kind: 'correction' | 'info'
  questionId: string | null
  versionId: string | null
  publishedAt: string
}

export type ReportReason = 'answer' | 'question' | 'explanation' | 'other'

export interface IssueReport {
  id: string
  questionId: string
  versionId: string
  attemptId: string | null
  reason: ReportReason
  body: string
  at: string
  status: 'received'
}

export interface RuleSet {
  minN: number
  interval: number
}

export interface AppState {
  schema: number
  guestId: string
  currentUserId: string | null
  users: User[]
  questions: Question[]
  stats: Record<string, QuestionStats>
  attempts: Attempt[]
  singleAnswers: SingleAnswer[]
  /** 主体キー → 解説を閲覧済みの版ID */
  viewedExplanations: Record<string, string[]>
  /** 主体キー → 重複防止用の一時履歴（日本時間の日付ごと） */
  setHistory: Record<string, { date: string; keys: string[] }>
  notices: Notice[]
  reports: IssueReport[]
  rule: RuleSet
  demo: {
    failNextSave: boolean
    failNextReport: boolean
    failNextLoad: boolean
  }
}
