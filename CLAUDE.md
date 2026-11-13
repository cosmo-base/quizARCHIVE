# CLAUDE.md

## 作業ルール（必ず守る）

- 返答はすべて日本語で行う。
- コードを勝手に変更しない。変更する前に、何をどう変えるかを示して利用者の確認を取る。
- 確認が取れた範囲だけを変更し、範囲外の改善点は提案にとどめる。
- Google Apps Script（GAS）のコードはリポジトリに含めない（`.gitignore` で `*.gs`・`appsscript.json`・`.clasp.json` などを除外済み）。
- 機密情報（認証情報・個人情報・内部のURLなど）をコード・ドキュメント・コミットに書かない。

## プロジェクト概要

Cosmo Base 毎日宇宙クイズの過去問練習サイト（参加者向けUIのプロトタイプ）。
要件は `docs/requirements.md` を参照。v0 で作成したコードを元にしている。

- モックデータ＋ブラウザの localStorage のみで動作する。
- DB・本番認証・管理画面・ランキングは追加しない。

## 技術構成

- Next.js 16（App Router）/ React 19 / TypeScript
- Tailwind CSS v4（トークンは `app/globals.css` の `@theme`。`tailwind.config` はない）
- shadcn/ui（Base UI 版）：カスタムトリガーは `asChild` ではなく `render` prop を使う。メニュー項目のコールバックは `onClick`
- lucide-react、SWR
- パッケージ管理は pnpm

## コマンド

```bash
pnpm install
pnpm dev            # 開発サーバー（デモ設定ボタンは開発時のみ表示）
pnpm build          # 静的書き出し（out/）。GitHub Pages 用は PAGES_BASE_PATH=/quizARCHIVE を付ける
npx tsc --noEmit    # 型チェック
pnpm test           # ロジックの単体テスト
```

## 構成

- `lib/`：型・仮設定（`config.ts`）・モック問題・出題・採点・認定・統計・ストア
- `components/`：画面ごとのビュー、共通部品（`quiz/`・`shell/`・`ui/`）、開発用デモ設定（`demo/`）
- `app/`：ルーティング（`(main)` 配下が通常画面、`attempts` が回答中画面）
- 公開は GitHub Pages（`.github/workflows/pages.yml`、main ブランチへの push で公開）。静的書き出しのため、ID を含む画面はクエリパラメータで ID を渡す（`lib/routes.ts` の関数でURLを作る）

## 実装上の注意

- 色はトークン（`bg-background`・`text-primary` など）を使い、`bg-white` などを直書きしない。
- 回答中は正解をHTMLに出さない。
- 終了・認定・統計の更新は `finalized` フラグで回ごとに一度だけ行う。
- 他の利用者の回は表示・操作しない（`isOwnAttempt` で確認する）。
- 構成・データ・ログインの決定事項は `docs/decisions.md` を参照する。
- 個人レベルと問題難易度は別の値として扱う。
- 参加者に見せる正答率は1つだけで、由来（SNS／サイト）は表示しない。
- 仮の設定値は `lib/config.ts` にまとめ、本番の確定値として扱わない。
