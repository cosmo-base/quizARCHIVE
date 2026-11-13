import { mockConfig } from './config'
import { levels } from './labels'
import type { Composition, CompositionKey, Level, Question } from './types'

export type Rng = () => number

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], rng: Rng) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 問題IDの集合が同じなら順序が違っても同じセット */
export function toSetKey(ids: string[]) {
  return [...ids].sort().join('|')
}

export function countByDifficulty(questions: Pick<Question, 'difficulty'>[]) {
  const result: Record<Level, number> = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 }
  for (const q of questions) result[q.difficulty] += 1
  return result
}

/** 分野ごとの枠。分野の均等を難易度構成より優先する */
function fieldQuotas(pool: Question[], count: number, rng: Rng) {
  const available = new Map<string, number>()
  for (const q of pool) available.set(q.fieldId, (available.get(q.fieldId) ?? 0) + 1)
  const fieldIds = shuffle([...available.keys()], rng)
  const quotas = new Map<string, number>(fieldIds.map((f) => [f, 0]))
  let remaining = count
  while (remaining > 0) {
    const open = fieldIds.filter((f) => quotas.get(f)! < available.get(f)!)
    if (open.length === 0) break
    open.sort((a, b) => quotas.get(a)! - quotas.get(b)!)
    const min = quotas.get(open[0])!
    for (const f of open.filter((f) => quotas.get(f) === min)) {
      if (remaining === 0) break
      quotas.set(f, quotas.get(f)! + 1)
      remaining -= 1
    }
  }
  return quotas
}

/** 不足時は1段階下、その次に上位を試す */
function fallbackOrder(level: CompositionKey, rng: Rng): Level[] {
  if (level === 'any') return shuffle(levels, rng)
  const idx = levels.indexOf(level)
  const lower = levels.slice(0, idx).reverse()
  const higher = levels.slice(idx + 1)
  return [level, ...lower, ...higher]
}

const demandOrder: CompositionKey[] = ['expert', 'advanced', 'intermediate', 'beginner', 'any']

function pickOnce(pool: Question[], count: number, composition: Composition | undefined, rng: Rng) {
  const quotas = fieldQuotas(pool, count, rng)
  const used = new Set<string>()
  const picked: Question[] = []
  let adjusted = false

  const take = (q: Question) => {
    used.add(q.id)
    picked.push(q)
    quotas.set(q.fieldId, quotas.get(q.fieldId)! - 1)
  }

  if (composition) {
    for (const key of demandOrder) {
      const demand = composition[key] ?? 0
      for (let n = 0; n < demand; n++) {
        let done = false
        for (const level of fallbackOrder(key, rng)) {
          const candidates = shuffle(
            pool.filter((q) => !used.has(q.id) && q.difficulty === level && (quotas.get(q.fieldId) ?? 0) > 0),
            rng,
          )
          if (candidates.length === 0) continue
          // 残り枠が最も多い分野を優先
          candidates.sort((a, b) => quotas.get(b.fieldId)! - quotas.get(a.fieldId)!)
          take(candidates[0])
          if (key !== 'any' && level !== key) adjusted = true
          done = true
          break
        }
        if (!done) adjusted = true
      }
    }
  }

  // 残った分野枠を埋める（練習、または構成で埋まらなかった枠）
  for (const [fieldId, quota] of quotas) {
    if (quota <= 0) continue
    const candidates = shuffle(pool.filter((q) => !used.has(q.id) && q.fieldId === fieldId), rng)
    for (const q of candidates.slice(0, quota)) {
      take(q)
      if (composition) adjusted = true
    }
  }

  return { picked: shuffle(picked, rng), adjusted }
}

export type SelectionResult =
  | {
      ok: true
      questions: Question[]
      setKey: string
      actualComposition: Record<Level, number>
      adjusted: boolean
      duplicateAllowed: boolean
    }
  | { ok: false; reason: 'insufficient' | 'noAlternative'; message: string }

export function selectQuestionSet(params: {
  pool: Question[]
  count: number
  composition?: Composition
  avoidSetKeys: string[]
  rng: Rng
}): SelectionResult {
  const { pool, count, composition, avoidSetKeys, rng } = params
  if (pool.length < count) {
    return { ok: false, reason: 'insufficient', message: `条件に合う問題が${pool.length}問のため、${count}問の出題ができません。` }
  }
  // 固定の1セットしか作れない設定は重複を許可
  const onlyOneSet = pool.length === count
  const avoid = new Set(avoidSetKeys)
  const tries = onlyOneSet ? 1 : mockConfig.setAvoidance.maxRetries
  for (let i = 0; i < tries; i++) {
    const { picked, adjusted } = pickOnce(pool, count, composition, rng)
    if (picked.length < count) continue
    const setKey = toSetKey(picked.map((q) => q.id))
    if (!onlyOneSet && avoid.has(setKey)) continue
    return {
      ok: true,
      questions: picked,
      setKey,
      actualComposition: countByDifficulty(picked),
      adjusted,
      duplicateAllowed: onlyOneSet && avoid.has(setKey),
    }
  }
  // 本番未決：候補セットがすべて直近と重複する場合は勝手に重複を許さない
  return { ok: false, reason: 'noAlternative', message: '別の問題セットを用意できません。条件を変更してください。' }
}
