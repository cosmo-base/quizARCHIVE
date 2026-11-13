import type { Composition, Difficulty, Level, QuestionStats, RuleSet, TestType } from './types'

/** FR-06 */
export const TEST_COUNT = 40
export const TEST_TIME_SEC = 3600
export const PASS_SCORE = 32
/** FR-08 */
export const PASSES_TO_PROMOTE = 3
/** FR-11 */
export const RECENT_SET_LIMIT = 5

/** FR-07 基準構成 */
export const COMPOSITION: Record<TestType, Composition> = {
  to2: { 1: 25, 2: 10, 3: 5, 4: 0, any: 0 },
  to3: { 1: 0, 2: 25, 3: 10, 4: 5, any: 0 },
  to4: { 1: 0, 2: 0, 3: 25, 4: 15, any: 0 },
  star: { 1: 0, 2: 0, 3: 0, 4: 30, any: 10 },
}

/** 個人レベルごとに認定受験できるテスト（FR-08） */
export const ELIGIBLE_TEST: Record<Level, TestType> = { 1: 'to2', 2: 'to3', 3: 'to4', 4: 'star' }

/** FR-04 練習目安（1問あたり秒） */
export const GUIDE_SEC: Record<Level, number> = { 1: 120, 2: 90, 3: 60, 4: 40 }

/** 練習の時間制限の選択肢（TBD-01 の仮値） */
export const PRACTICE_COUNTS = [5, 10, 20, 40]
export const PRACTICE_TIME_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: '制限なし' },
  { value: 'guide', label: '個人レベルの目安時間' },
  { value: '600', label: '10分' },
  { value: '1200', label: '20分' },
  { value: '1800', label: '30分' },
  { value: '3600', label: '60分' },
]

/** FR-20 難易度判定。丸める前の比率を使う */
export function difficultyFromRate(rate: number): Difficulty {
  if (rate > 0.5) return 1
  if (rate > 0.3) return 2
  if (rate > 0.1) return 3
  return 4
}

/**
 * 基本回答の増加後に呼ぶ。境界をまたいだら一度だけ再判定する。
 * 次の境界 = 未判定なら minN、判定済みなら lastJudgedN + interval（間隔変更時の扱いは TBD-07 の仮置き）。
 */
export function rejudge(st: QuestionStats, rule: RuleSet, now: string) {
  if (st.basicN < rule.minN) return false
  const next = st.lastJudgedN < rule.minN ? rule.minN : st.lastJudgedN + rule.interval
  if (st.basicN < next) return false
  st.difficulty = difficultyFromRate(st.basicCorrect / st.basicN)
  st.lastJudgedN = st.basicN
  st.judgedAt = now
  st.inherit = null
  return true
}

/** FR-21/22 参加者に見せる正答率（1つだけ） */
export function displayRate(st: QuestionStats, rule: RuleSet): number | null {
  if (st.basicN >= rule.minN) return st.basicCorrect / st.basicN
  if (st.inherit) return st.inherit.rate
  return st.snsRate
}

export function displayDifficulty(st: QuestionStats, rule: RuleSet): Difficulty {
  if (st.basicN >= rule.minN) return st.difficulty
  if (st.inherit) return st.inherit.difficulty
  return 1
}

/** FR-09 星の表示 */
export function starInfo(expertPasses: number) {
  const k = Math.floor(expertPasses / 3)
  const toNext = (k + 1) * 3 - expertPasses
  if (k === 0) return { k, white: 0, black: 0, plus: null as number | null, text: '星なし', toNext }
  if (k <= 5) return { k, white: k, black: 0, plus: null, text: '☆'.repeat(k), toNext }
  if (k <= 10) return { k, white: 10 - k, black: k - 5, plus: null, text: '★'.repeat(k - 5) + '☆'.repeat(10 - k), toNext }
  return { k, white: 0, black: 1, plus: k - 5, text: `★＋${k - 5}`, toNext }
}

export function formatRate(r: number | null, digits = 0) {
  if (r === null || Number.isNaN(r)) return '未集計'
  return `${(r * 100).toFixed(digits)}%`
}

export function formatDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`
}

export function formatGuide(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s}秒`
  return s ? `${m}分${s}秒` : `${m}分`
}

/** 日本時間の日付キー（重複防止履歴の日界） */
export function jstDateKey(iso: string) {
  return new Date(new Date(iso).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10)
}

export function formatDateTime(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

/** 問題IDの順序を無視した正規化キー（FR-11） */
export function setKeyOf(questionIds: string[]) {
  return [...questionIds].sort().join(',')
}
