import { CATEGORIES } from '@/lib/domain/labels'
import { difficultyFromRate } from '@/lib/domain/rules'
import { mulberry32, shuffle } from '@/lib/domain/generate'
import type { AppState, Attempt, CategoryId, Difficulty, Question, QuestionStats, QuestionVersion } from '@/lib/domain/types'
import { RAW_QUESTIONS, type RawQuestion } from './questions'

export const SCHEMA = 3
const CREATED = '2026-10-01T00:00:00.000Z'
const PER_CATEGORY = 52
/** 1分野あたりの難易度の目標分布（仮） */
const TARGET: Record<Difficulty, number> = { 1: 20, 2: 14, 3: 10, 4: 8 }
const RANGE: Record<Difficulty, [number, number]> = { 1: [0.52, 0.95], 2: [0.31, 0.5], 3: [0.11, 0.3], 4: [0.02, 0.1] }

function placeholder(category: CategoryId, n: number): RawQuestion {
  const label = CATEGORIES.find((c) => c.id === category)!.label
  return {
    category,
    text: `【仮データ】${label}の問題 ${n}：ここに問題文が入ります`,
    choices: ['選択肢（仮）', '選択肢（仮）', '選択肢（仮）', '選択肢（仮）'],
    explanation: '解説テキスト（仮）。実データ連携後に元シートの解説、またはサイト向けに編集した解説を表示します。',
    references: [{ title: '参考文献（仮）', publisher: '発行元（仮）' }],
    sns: null,
  }
}

export function createSeed(): AppState {
  const rng = mulberry32(20261107)
  const between = (a: number, b: number) => a + (b - a) * rng()
  const int = (a: number, b: number) => Math.floor(between(a, b + 1))

  const questions: Question[] = []
  const stats: Record<string, QuestionStats> = {}
  let no = 0

  const makeVersion = (qid: string, vno: number, raw: RawQuestion, order: number[], correctIdx = 0, extra: Partial<QuestionVersion> = {}): QuestionVersion => {
    const versionId = `${qid}-v${vno}`
    const choices = order.map((i) => ({ id: `${versionId}-c${i + 1}`, text: raw.choices[i] }))
    return {
      versionId,
      questionId: qid,
      text: raw.text,
      choices,
      correctId: `${versionId}-c${correctIdx + 1}`,
      category: raw.category,
      explanation: raw.explanation,
      references: raw.references ?? [],
      createdAt: CREATED,
      statsVersionId: `${versionId}-s`,
      ...extra,
    }
  }

  const makeStats = (statsVersionId: string, target: Difficulty | null, sns: number | null, unjudged: boolean): QuestionStats => {
    if (unjudged) {
      const n = int(0, 9)
      const r = sns ?? between(0.3, 0.9)
      return { statsVersionId, basicN: n, basicCorrect: Math.round(n * r), reviewN: int(0, 3), reviewCorrect: 0, snsRate: sns, difficulty: 1, lastJudgedN: 0, judgedAt: null, inherit: null }
    }
    const rate = target ? between(...RANGE[target]) : Math.min(0.97, Math.max(0.03, (sns ?? 0.5) + between(-0.06, 0.06)))
    const n = int(10, 96)
    const c = Math.round(n * rate)
    const judged = Math.floor(n / 10) * 10
    const reviewN = int(0, 12)
    return {
      statsVersionId,
      basicN: n,
      basicCorrect: c,
      reviewN,
      reviewCorrect: Math.round(reviewN * Math.min(1, rate + 0.15)),
      snsRate: sns,
      difficulty: difficultyFromRate(c / n),
      lastJudgedN: judged,
      judgedAt: CREATED,
      inherit: null,
    }
  }

  for (const cat of CATEGORIES) {
    const reals = RAW_QUESTIONS.filter((r) => r.category === cat.id)
    const counts: Record<Difficulty, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
    const entries: { raw: RawQuestion; target: Difficulty | null; unjudged: boolean }[] = []
    for (const raw of reals) {
      entries.push({ raw, target: null, unjudged: false })
      counts[difficultyFromRate(raw.sns ?? 0.6)]++
    }
    let p = 1
    for (const d of [1, 2, 3, 4] as Difficulty[]) {
      for (let i = counts[d]; i < TARGET[d]; i++) {
        const raw = placeholder(cat.id, p++)
        if (rng() < 0.12) raw.sns = Number(between(...RANGE[d]).toFixed(3))
        entries.push({ raw, target: d, unjudged: false })
      }
    }
    // 基本回答10件未満の問題（SNS正答率表示・初級扱い）
    for (let i = entries.length; i < PER_CATEGORY; i++) {
      const raw = placeholder(cat.id, p++)
      raw.sns = i % 3 === 0 ? null : Number(between(0.15, 0.9).toFixed(3))
      entries.push({ raw, target: null, unjudged: true })
    }
    for (const e of entries) {
      no++
      const qid = `q${String(no).padStart(3, '0')}`
      const order = shuffle([0, 1, 2, 3], rng)
      const v = makeVersion(qid, 1, e.raw, order)
      questions.push({ id: qid, no, sourceRow: `sheet!A${no + 1}`, status: 'published', currentVersionId: v.versionId, versions: [v] })
      stats[v.statsVersionId] = makeStats(v.statsVersionId, e.target, e.raw.sns, e.unjudged)
    }
  }

  // 版変更の例（FR-22）：解説の追記で新版。新版の基本回答は10件未満なので旧版の値を継承
  const auQ = questions.find((q) => q.versions[0].text.startsWith('1天文単位'))!
  {
    const v1 = auQ.versions[0]
    const raw = RAW_QUESTIONS.find((r) => r.text === v1.text)!
    const v2 = makeVersion(auQ.id, 2, { ...raw, explanation: raw.explanation + '2012年のIAU総会で、天文単位はこの値に固定されました。' }, v1.choices.map((c) => Number(c.id.slice(-1)) - 1), 0, {
      createdAt: '2026-11-03T03:00:00.000Z',
      changeNote: '解説を追記',
      prevVersionId: v1.versionId,
    })
    auQ.versions.push(v2)
    auQ.currentVersionId = v2.versionId
    const old = stats[v1.statsVersionId]
    stats[v2.statsVersionId] = { ...makeStats(v2.statsVersionId, null, old.snsRate, true), basicN: 4, basicCorrect: 2, inherit: { fromStatsVersionId: v1.statsVersionId, rate: old.basicCorrect / old.basicN, difficulty: old.difficulty } }
  }

  // 正解設定の訂正の例（FR-24）：旧版は正解を誤って「中性子星」にしていた
  const wdQ = questions.find((q) => q.versions[0].text.startsWith('太陽程度の質量'))!
  {
    const v1 = wdQ.versions[0]
    const raw = RAW_QUESTIONS.find((r) => r.text === v1.text)!
    const order = v1.choices.map((c) => Number(c.id.slice(-1)) - 1)
    v1.correctId = `${v1.versionId}-c2` // 誤った正解設定（中性子星）
    const v2 = makeVersion(wdQ.id, 2, raw, order, 0, { createdAt: '2026-11-06T01:00:00.000Z', changeNote: '正解設定の誤りを訂正（中性子星 → 白色矮星）', prevVersionId: v1.versionId })
    wdQ.versions.push(v2)
    wdQ.currentVersionId = v2.versionId
    const old = stats[v1.statsVersionId]
    stats[v2.statsVersionId] = { ...makeStats(v2.statsVersionId, null, old.snsRate, true), basicN: 2, basicCorrect: 2, inherit: { fromStatsVersionId: v1.statsVersionId, rate: old.basicCorrect / old.basicN, difficulty: old.difficulty } }
  }

  // 出題停止中の例
  questions[questions.length - 1].status = 'stopped'

  const users = [
    { id: 'u-1', name: 'ほしの（初級）', level: 1 as const, passes: 0, expertPasses: 0, createdAt: CREATED },
    { id: 'u-2', name: 'すばる（中級・合格2回）', level: 2 as const, passes: 2, expertPasses: 0, createdAt: CREATED },
    { id: 'u-3', name: 'かぐや（上級）', level: 3 as const, passes: 1, expertPasses: 0, createdAt: CREATED },
    { id: 'u-4', name: 'あまの（専門家・合格17回）', level: 4 as const, passes: 0, expertPasses: 17, createdAt: CREATED },
  ]

  // 学習履歴の例（すばる）
  const attempts: Attempt[] = []
  const mk = (id: string, qs: Question[], opts: Partial<Attempt>, correctRate: number, answerRate: number): Attempt => {
    const qrng = mulberry32(id.length * 997)
    return {
      id,
      subject: { type: 'user', userId: 'u-2' },
      mode: 'practice',
      kind: 'normal',
      testType: null,
      certifying: false,
      levelAtStart: 2,
      practice: null,
      baseComposition: null,
      actualComposition: null,
      sourceAttemptId: null,
      setKey: qs.map((q) => q.id).sort().join(','),
      startedAt: CREATED,
      deadline: null,
      finishedAt: CREATED,
      status: 'completed',
      finishReason: 'manual_all',
      currentIndex: 0,
      aggregated: true,
      recognition: null,
      ...opts,
      questions: qs.map((q, i) => {
        const v = q.versions.find((x) => x.versionId === q.currentVersionId)!
        const answered = qrng() < answerRate
        const ok = answered && qrng() < correctRate
        const wrong = v.choices.find((c) => c.id !== v.correctId)!.id
        return {
          questionId: q.id,
          versionId: v.versionId,
          order: i,
          difficultyAtStart: stats[v.statsVersionId].difficulty,
          category: v.category,
          choiceOrder: v.choices.map((c) => c.id),
          displayRateAtStart: stats[v.statsVersionId].basicCorrect / Math.max(1, stats[v.statsVersionId].basicN),
          selectedId: answered ? (ok ? v.correctId : wrong) : null,
          savedSeq: 1,
          savedAt: CREATED,
          correct: answered ? ok : null,
          viewed: true,
        }
      }),
    }
  }
  const realQs = questions.filter((q) => !q.versions[0].text.startsWith('【仮データ】'))
  attempts.push(
    mk('at-seed-1', realQs.slice(0, 10), { mode: 'practice', practice: { count: 10, categories: ['solar', 'stellar'], difficulties: [], timeLimitSec: null }, startedAt: '2026-11-04T11:00:00.000Z', finishedAt: '2026-11-04T11:14:30.000Z' }, 0.7, 1),
  )
  const testQs = shuffle(questions.filter((q) => q.status === 'published'), mulberry32(7)).slice(0, 40)
  const t = mk(
    'at-seed-2',
    testQs,
    {
      mode: 'test',
      testType: 'to3',
      certifying: true,
      baseComposition: { 1: 0, 2: 25, 3: 10, 4: 5, any: 0 },
      actualComposition: { 1: 0, 2: 25, 3: 10, 4: 5, any: 0 },
      startedAt: '2026-11-05T12:00:00.000Z',
      deadline: '2026-11-05T13:00:00.000Z',
      finishedAt: '2026-11-05T12:54:10.000Z',
      finishReason: 'manual_unanswered',
    },
    0.9,
    0.95,
  )
  const score = t.questions.filter((q) => q.correct).length
  t.recognition = { testType: 'to3', passed: score >= 32, levelBefore: 2, levelAfter: 2, passesBefore: 1, passesAfter: score >= 32 ? 2 : 1, expertPassesBefore: 0, expertPassesAfter: 0, promoted: false, processedAt: t.finishedAt! }
  attempts.push(t)

  return {
    schema: SCHEMA,
    guestId: 'guest-this-browser',
    currentUserId: null,
    users,
    questions,
    stats,
    attempts,
    singleAnswers: [],
    viewedExplanations: {},
    setHistory: {},
    notices: [
      {
        id: 'n-1',
        kind: 'correction',
        title: `問題 No.${wdQ.no} の正解を訂正しました`,
        body: '「太陽程度の質量の恒星が最終的に残す天体は？」の正解設定に誤りがありました。正解を「中性子星」から「白色矮星」に訂正しました。過去の合格・レベル・星の追加認定や取り消しは行いません。',
        questionId: wdQ.id,
        versionId: wdQ.currentVersionId,
        publishedAt: '2026-11-06T01:00:00.000Z',
      },
      {
        id: 'n-2',
        kind: 'info',
        title: '過去問練習サイト（V0モック）を公開しました',
        body: 'このページは画面と操作を確認するためのモックです。問題・正答率・利用者はすべて仮データです。',
        questionId: null,
        versionId: null,
        publishedAt: '2026-11-07T00:00:00.000Z',
      },
    ],
    reports: [],
    rule: { minN: 10, interval: 10 },
    demo: { failNextSave: false, failNextReport: false, failNextLoad: false },
  }
}
