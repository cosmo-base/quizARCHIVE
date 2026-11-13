import { CATEGORIES } from './labels'
import { COMPOSITION, TEST_COUNT, displayDifficulty } from './rules'
import type { AppState, CategoryId, Composition, Difficulty, PracticeSettings, Question, QuestionVersion, TestType } from './types'

export type Rng = () => number

/** 再現可能な乱数（シード用） */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface PoolItem {
  q: Question
  v: QuestionVersion
  diff: Difficulty
}

export interface Picked extends PoolItem {
  /** 基準構成上の枠（any = 全難易度ランダム） */
  slot: Difficulty | 'any'
}

export function currentVersion(q: Question) {
  return q.versions.find((v) => v.versionId === q.currentVersionId)!
}

/** 公開中で有効な問題版（FR-10-1） */
export function publishedPool(s: AppState): PoolItem[] {
  return s.questions
    .filter((q) => q.status === 'published')
    .map((q) => {
      const v = currentVersion(q)
      return { q, v, diff: displayDifficulty(s.stats[v.statsVersionId], s.rule) }
    })
}

export function practiceCandidates(s: AppState, settings: Pick<PracticeSettings, 'categories' | 'difficulties'>) {
  return publishedPool(s).filter(
    (p) =>
      (settings.categories.length === 0 || settings.categories.includes(p.v.category)) &&
      (settings.difficulties.length === 0 || settings.difficulties.includes(p.diff)),
  )
}

export function generatePractice(pool: PoolItem[], count: number, rng: Rng): Picked[] | null {
  if (pool.length < count) return null
  return shuffle(pool, rng)
    .slice(0, count)
    .map((p) => ({ ...p, slot: p.diff }))
}

/** 下位 → 上位の順で代替難易度を探す（FR-10-3/4。詳細アルゴリズムは TBD-03 の仮実装） */
function fallbackOrder(d: Difficulty): Difficulty[] {
  const down = ([1, 2, 3, 4] as Difficulty[]).filter((x) => x < d).reverse()
  const up = ([1, 2, 3, 4] as Difficulty[]).filter((x) => x > d)
  return [d, ...down, ...up]
}

export type GenerateResult = { ok: true; items: Picked[]; actual: Composition; categoryShortage: boolean } | { ok: false; message: string }

export function generateTest(pool: PoolItem[], type: TestType, rng: Rng): GenerateResult {
  if (pool.length < TEST_COUNT) return { ok: false, message: `公開中の問題が${TEST_COUNT}問に満たないため、テストを開始できません。` }
  const comp = COMPOSITION[type]
  const cats = CATEGORIES.map((c) => c.id)
  const G = cats.length
  // ① 分野の均等配分を優先（各 floor(40/G) 問、余りを先頭の分野から）
  const quota = new Map<CategoryId, number>(cats.map((c, i) => [c, Math.floor(TEST_COUNT / G) + (i < TEST_COUNT % G ? 1 : 0)]))
  const slots: (Difficulty | 'any')[] = []
  for (const d of [1, 2, 3, 4] as Difficulty[]) for (let i = 0; i < comp[d]; i++) slots.push(d)
  for (let i = 0; i < comp.any; i++) slots.push('any')

  // ② 難易度枠を分野へ順番に割り当て
  const order = shuffle(cats, rng)
  const assigned: { cat: CategoryId; slot: Difficulty | 'any' }[] = []
  let ptr = 0
  for (const slot of slots) {
    while ((quota.get(order[ptr % G]) ?? 0) <= 0) ptr++
    const cat = order[ptr % G]
    quota.set(cat, quota.get(cat)! - 1)
    assigned.push({ cat, slot })
    ptr++
  }

  const used = new Set<string>()
  const shuffled = shuffle(pool, rng)
  const take = (filter: (p: PoolItem) => boolean) => {
    const hit = shuffled.find((p) => !used.has(p.q.id) && filter(p))
    if (hit) used.add(hit.q.id)
    return hit
  }

  const items: Picked[] = []
  const pending: { cat: CategoryId; slot: Difficulty | 'any' }[] = []
  // 固定枠を先に埋め、全難易度ランダム枠は後から（固定枠と重複させない）
  const sorted = [...assigned.filter((a) => a.slot !== 'any'), ...assigned.filter((a) => a.slot === 'any')]
  for (const a of sorted) {
    let hit: PoolItem | undefined
    if (a.slot === 'any') hit = take((p) => p.v.category === a.cat)
    else for (const d of fallbackOrder(a.slot)) if ((hit = take((p) => p.v.category === a.cat && p.diff === d))) break
    if (hit) items.push({ ...hit, slot: a.slot })
    else pending.push(a)
  }
  // ③ 分野の候補不足は他分野で補う（実構成として記録）
  for (const a of pending) {
    let hit: PoolItem | undefined
    if (a.slot === 'any') hit = take(() => true)
    else for (const d of fallbackOrder(a.slot)) if ((hit = take((p) => p.diff === d))) break
    if (!hit) return { ok: false, message: '条件を満たす問題が不足しているため、テストを開始できません（問題数を減らして開始することはしません）。' }
    items.push({ ...hit, slot: a.slot })
  }
  const actual: Composition = { 1: 0, 2: 0, 3: 0, 4: 0, any: 0 }
  for (const it of items) {
    if (it.slot === 'any') actual.any++
    else actual[it.diff]++
  }
  return { ok: true, items: shuffle(items, rng), actual, categoryShortage: pending.length > 0 }
}
