import type { AttemptStatus, CategoryId, Difficulty, FinishReason, Level, ReportReason, TestType } from './types'

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted'

export const DIFF_LABEL: Record<Difficulty, string> = { 1: '初級', 2: '中級', 3: '上級', 4: '専門家' }
export const LEVEL_LABEL: Record<Level, string> = DIFF_LABEL
export const DIFFS: Difficulty[] = [1, 2, 3, 4]

/** 分野定義は TBD-03。V0では仮の5分野 */
export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'solar', label: '太陽系' },
  { id: 'stellar', label: '恒星・銀河' },
  { id: 'physics', label: '宇宙物理' },
  { id: 'history', label: '宇宙開発史' },
  { id: 'tech', label: 'ロケット・技術' },
]
export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<CategoryId, string>

export const TEST_LABEL: Record<TestType, string> = {
  to2: '中級昇格テスト',
  to3: '上級昇格テスト',
  to4: '専門家昇格テスト',
  star: '専門家テスト（星）',
}
export const TEST_SHORT: Record<TestType, string> = {
  to2: '初級→中級',
  to3: '中級→上級',
  to4: '上級→専門家',
  star: '専門家の星',
}
export const TEST_TYPES: TestType[] = ['to2', 'to3', 'to4', 'star']

export const STATUS_META: Record<AttemptStatus, { label: string; tone: Tone }> = {
  in_progress: { label: '回答中', tone: 'info' },
  completed: { label: '終了', tone: 'neutral' },
  timed_out: { label: '時間切れ', tone: 'warning' },
  invalidated: { label: '無効', tone: 'danger' },
}

export const FINISH_LABEL: Record<FinishReason, string> = {
  manual_all: '通常終了（全問回答）',
  manual_unanswered: '途中終了（未回答あり）',
  timeout: '時間切れ',
}

export const REPORT_REASON: { value: ReportReason; label: string }[] = [
  { value: 'answer', label: '正解の誤り' },
  { value: 'question', label: '問題文／選択肢の不備' },
  { value: 'explanation', label: '解説／参考文献の誤り' },
  { value: 'other', label: 'その他' },
]

export const CHOICE_MARK = ['A', 'B', 'C', 'D', 'E', 'F']
