import type { Notice } from '../types'

export const notices: Notice[] = [
  {
    id: 'n-correction-021',
    kind: 'correction',
    title: 'Q-021「最も近い恒星系」の正解を訂正しました',
    summary: '正解を「シリウス」から「ケンタウルス座アルファ星系」に訂正し、解説を更新しました。',
    publishedAt: '2026-11-05T10:00:00+09:00',
    body: [
      '問題 Q-021 の正解が誤って設定されていました。ご迷惑をおかけし申し訳ありません。',
      '訂正後の問題で、これから回答する分の正答率を集計します。',
      'これまでに受けたテストの合否、レベル、星は変更されません。追加の認定や取り消しも行いません。',
    ],
    correction: {
      questionId: 'Q-021',
      before: '正解：シリウス',
      after: '正解：ケンタウルス座アルファ星系（解説・参考文献も更新）',
    },
  },
  {
    id: 'n-info-fields',
    kind: 'info',
    title: '分野で絞り込んで練習できるようになりました',
    summary: '練習の設定で、分野と難易度を複数選んで出題できます。',
    publishedAt: '2026-11-01T12:00:00+09:00',
    body: [
      '練習の設定画面で、分野と難易度をそれぞれ複数選べるようになりました。',
      '過去問一覧で絞り込んだ条件のまま「この条件で練習する」から始めることもできます。',
    ],
  },
]

export function getNotice(id: string) {
  return notices.find((n) => n.id === id)
}
