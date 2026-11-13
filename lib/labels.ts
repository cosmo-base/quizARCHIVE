import type { AttemptStatus, Level, Mode, ReportReason, TestKind } from './types'

export const levels: Level[] = ['beginner', 'intermediate', 'advanced', 'expert']

export const levelLabel: Record<Level, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
  expert: '専門家',
}

export const levelRank: Record<Level, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
}

export const testKindLabel: Record<TestKind, string> = {
  toIntermediate: '中級昇格テスト',
  toAdvanced: '上級昇格テスト',
  toExpert: '専門家昇格テスト',
  expertStars: '専門家テスト',
}

export const testKindTarget: Record<TestKind, string> = {
  toIntermediate: '初級 → 中級',
  toAdvanced: '中級 → 上級',
  toExpert: '上級 → 専門家',
  expertStars: '専門家 → 星',
}

export const modeLabel: Record<Mode, string> = {
  practice: '練習',
  test: 'テスト',
  review: '復習',
}

export const statusLabel: Record<AttemptStatus, string> = {
  inProgress: '回答中',
  completed: '終了',
  timedOut: '時間切れで終了',
}

export const reportReasonLabel: Record<ReportReason, string> = {
  answer: '正解が誤っている',
  text: '問題文・選択肢に誤りがある',
  explanation: '解説・参考文献に誤りがある',
  other: 'その他',
}

export function attemptTitle(mode: Mode, testKind?: TestKind) {
  if (mode === 'test' && testKind) return testKindLabel[testKind]
  return modeLabel[mode]
}
