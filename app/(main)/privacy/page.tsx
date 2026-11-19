import type { Metadata } from 'next'
import { PageContainer, PageHeading, SurfaceCard } from '@/components/shell/page'

export const metadata: Metadata = { title: 'プライバシーについて' }

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <SurfaceCard aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      <div className="flex flex-col gap-3 leading-relaxed">{children}</div>
    </SurfaceCard>
  )
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

/** 保存する情報と使い道の案内。方針は docs/decisions.md に合わせる */
export default function PrivacyPage() {
  return (
    <PageContainer narrow>
      <PageHeading title="プライバシーについて" description="このサイトで扱う情報と、その使い道をお知らせします。" />

      <Section id="login" title="ログインについて">
        <p>ログインには Discord を使います。ログインできるのは、Cosmo Base の Discord サーバーに参加している方です。ログインしなくても、過去問・練習・テストは利用できます。</p>
        <p>ログインのときに Discord から受け取るのは、サーバーに参加しているかの確認と、画面への表示に必要な情報だけです。メールアドレスは受け取りません。</p>
      </Section>

      <Section id="stored" title="保存する情報">
        <List
          items={[
            '利用者を見分けるための値（Discord のユーザーIDから作った、元に戻せない値）',
            '個人レベル・合格回数・星',
            '練習・テストの回答と結果、学習履歴',
            'ログイン状態（ログインから30日間）',
            '問題の誤り報告の内容',
          ]}
        />
        <p>ログインしていない方（ゲスト）の回答も、問題の正答率の集計と運営の分析のために記録します。ゲストはブラウザごとの識別子で区別し、その識別子はお使いの端末に保存します。</p>
      </Section>

      <Section id="not-stored" title="保存しない情報">
        <List
          items={[
            'Discord のユーザーID・表示名',
            'メールアドレス・パスワード',
          ]}
        />
        <p>Discord の表示名は、ログインしたときにお使いの端末の中にだけ保存し、ご本人の画面に表示します。サイトの記録には残しません。</p>
      </Section>

      <Section id="purpose" title="情報の使い道">
        <List
          items={[
            '採点、合格・昇格・星の認定、学習履歴の表示',
            '問題ごとの正答率と難易度の自動判定',
            '運営による利用状況の分析（個人が特定できる形では公開しません）',
            '誤り報告の確認と、問題の修正',
          ]}
        />
      </Section>

      <Section id="visibility" title="公開する範囲">
        <p>成績・学習履歴は、ご本人にだけ表示します。ほかの参加者に公開することはなく、ランキングもありません。運営は、集計と分析のために必要な範囲で記録を確認します。</p>
      </Section>

      <Section id="retention" title="保存期間と削除">
        <p>記録は、問題の正答率の集計と学習履歴の表示のために、期間を決めずに保存します。</p>
        <p>Discord サーバーを抜けた方は、次にログインしようとしたときに抜けたことを確認し、その方の記録を、どの Discord アカウントとも結び付かない形（本人と分からない形）に置き換えます。置き換えた記録は統計としてだけ使い、元に戻すことはできません。もう一度サーバーに参加してログインした場合は、新しい利用者として始まります。</p>
        <p>ご自身の記録を本人と分からない形にしてほしい場合は、Cosmo Base の Discord サーバーで運営にご連絡ください。上と同じ方法で置き換えます。正答率の集計に使うため、記録そのものは消さずに統計として残します。</p>
      </Section>
    </PageContainer>
  )
}
