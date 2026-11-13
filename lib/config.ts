import type { Composition, Level, TestKind } from './types'

/**
 * モック用仮設定。
 * ここにある値は UI 確認のための仮値で、本番仕様としては確定していない。
 */
export const mockConfig = {
  questionList: {
    pageSize: 12,
  },
  practice: {
    countOptions: [5, 10, 20, 40],
    defaultCount: 10,
    timeLimitOptions: [10, 20, 30, 60],
    /** 個人レベル別の目安時間（秒/問）。強制終了とは別 */
    paceSecondsPerQuestion: {
      beginner: 120,
      intermediate: 90,
      advanced: 60,
      expert: 40,
    } satisfies Record<Level, number>,
  },
  singleQuestion: {
    /** 「解説だけを見る」の補助導線（仮仕様）。統計は増やさない */
    allowExplanationOnly: true,
  },
  difficulty: {
    /** 有効な基本回答がこの件数未満の間は初級扱い */
    minBasicAnswers: 10,
    /** 初期の再判定間隔（例: 100 に変更可能） */
    rejudgeInterval: 10,
    /** 正答率がこの値を「超える」と、その難易度 */
    thresholds: {
      beginner: 0.5,
      intermediate: 0.3,
      advanced: 0.1,
    },
  },
  setAvoidance: {
    /** 同一利用者の直近 N 回と同じセットを避ける */
    recentSets: 5,
    maxRetries: 60,
    /** 重複防止履歴のリセット基準（日本時間0時の仮実装） */
    timeZone: 'Asia/Tokyo',
  },
  attempt: {
    warningMinutes: [5, 1],
    saveDelayMs: 350,
  },
  repository: {
    latencyMs: 350,
  },
}

export const testConfig = {
  questionCount: 40,
  durationMinutes: 60,
  passScore: 32,
  passesToPromote: 3,
  passesPerStar: 3,
}

export const testKinds: TestKind[] = ['toIntermediate', 'toAdvanced', 'toExpert', 'expertStars']

export const testCompositions: Record<TestKind, Composition> = {
  toIntermediate: { beginner: 25, intermediate: 10, advanced: 5, expert: 0, any: 0 },
  toAdvanced: { beginner: 0, intermediate: 25, advanced: 10, expert: 5, any: 0 },
  toExpert: { beginner: 0, intermediate: 0, advanced: 25, expert: 15, any: 0 },
  expertStars: { beginner: 0, intermediate: 0, advanced: 0, expert: 30, any: 10 },
}

/** 個人レベル → 受験資格のあるテスト */
export const eligibleTestByLevel: Record<Level, TestKind> = {
  beginner: 'toIntermediate',
  intermediate: 'toAdvanced',
  advanced: 'toExpert',
  expert: 'expertStars',
}

/** デモ設定の表示可否。本番ナビには出さない */
export const showDemoTools = process.env.NODE_ENV !== 'production'
