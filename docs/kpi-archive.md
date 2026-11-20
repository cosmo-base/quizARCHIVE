# 過去問サイトの KPI（KPI ダッシュボードに追加する分の仕様）

過去問サイト（毎日宇宙クイズの過去問、https://cbquiz.archive.fsif.jp/ ）の利用状況を、Cosmo Base の KPI ダッシュボード（cosmo-base/kpi-dashboard）に表示するための仕様。
集計は Archive の GAS（`archive-stats.gs`、版 1.6.1）が作り、ダッシュボードは CSV として読む。機密情報（URL・ID・キー）はこのファイルに書かない。

## 1. しくみ

```
Archive のスプシ（個人データあり）
  └ Archive の GAS（archive-stats.gs）… 毎朝の取り込み（6:15 ごろ）のあとに集計
        └ 集計用のスプシ（kpi_* のタブだけ。個人が分かる値は入れない）
              └ KPI の GAS（所有者の権限でシートを読む）── ログインした人にだけ CSV を返す ──> KPI ダッシュボードの画面
```

- 集計は1日1回、全部を数え直してタブを書き直す（`kpi_levels`・`kpi_ops` だけは毎日1行ずつ足していく記録）。
- 書き出し先は、Archive の GAS のスクリプトプロパティ `STATS_SHEET_ID` で指定した別のスプシ（おすすめ）。未設定なら Archive のスプシ自身に書く。
- KPI ダッシュボードは、これまでの CSV と同じく `kpiFetch(kpiSource("ARCHIVE_◯◯"))` で読む。ログインと権限は KPI ダッシュボードの仕組みのまま。

## 2. 準備

1. **集計用のスプシを作る**：KPI の GAS の所有者が読めるようにする。Archive のスプシ（個人データあり）は KPI の GAS に読ませない。
2. **Archive の GAS**
   - `archive-stats.gs` を追加し、`archive-api.gs`・`archive-setup.gs` を版 1.4.0 にする。
   - スクリプトプロパティ `STATS_SHEET_ID` に、集計用のスプシの ID を入れる。
   - メニュー「Archive → KPI の集計を今すぐ作る」を一度実行し、`kpi_*` のタブができることを確かめる。
   - 以後は毎朝の取り込みのあとに自動で作り直す（失敗しても取り込みは止まらない）。
3. **KPI ダッシュボード**：タブごとに GitHub の Secrets に CSV の URL を足す。
   - URL は集計用のスプシの編集 URL（`https://docs.google.com/spreadsheets/d/<ID>/edit?gid=<タブの gid>`）。KPI の GAS が所有者の権限で直接読む（「ウェブに公開」は不要）。
   - 名前と、`.github/workflows/nextjs.yml` の「Send CSV sources to GAS」の `env` への追加は次のとおり。

| タブ | Secrets の名前 | `kpiSource(...)` |
|---|---|---|
| kpi_daily | `NEXT_PUBLIC_KPI_ARCHIVE_DAILY_CSV_URL` | `ARCHIVE_DAILY` |
| kpi_tests | `NEXT_PUBLIC_KPI_ARCHIVE_TESTS_CSV_URL` | `ARCHIVE_TESTS` |
| kpi_score_dist | `NEXT_PUBLIC_KPI_ARCHIVE_SCORE_DIST_CSV_URL` | `ARCHIVE_SCORE_DIST` |
| kpi_practice | `NEXT_PUBLIC_KPI_ARCHIVE_PRACTICE_CSV_URL` | `ARCHIVE_PRACTICE` |
| kpi_segments | `NEXT_PUBLIC_KPI_ARCHIVE_SEGMENTS_CSV_URL` | `ARCHIVE_SEGMENTS` |
| kpi_questions | `NEXT_PUBLIC_KPI_ARCHIVE_QUESTIONS_CSV_URL` | `ARCHIVE_QUESTIONS` |
| kpi_promotion | `NEXT_PUBLIC_KPI_ARCHIVE_PROMOTION_CSV_URL` | `ARCHIVE_PROMOTION` |
| kpi_retention | `NEXT_PUBLIC_KPI_ARCHIVE_RETENTION_CSV_URL` | `ARCHIVE_RETENTION` |
| kpi_heatmap | `NEXT_PUBLIC_KPI_ARCHIVE_HEATMAP_CSV_URL` | `ARCHIVE_HEATMAP` |
| kpi_reports | `NEXT_PUBLIC_KPI_ARCHIVE_REPORTS_CSV_URL` | `ARCHIVE_REPORTS` |
| kpi_errors | `NEXT_PUBLIC_KPI_ARCHIVE_ERRORS_CSV_URL` | `ARCHIVE_ERRORS` |
| kpi_levels | `NEXT_PUBLIC_KPI_ARCHIVE_LEVELS_CSV_URL` | `ARCHIVE_LEVELS` |
| kpi_ops | `NEXT_PUBLIC_KPI_ARCHIVE_OPS_CSV_URL` | `ARCHIVE_OPS` |
| kpi_meta | `NEXT_PUBLIC_KPI_ARCHIVE_META_CSV_URL` | `ARCHIVE_META` |

## 3. 共通のきまり

- 日付はすべて日本時間。`date` は `yyyy-MM-dd`、`month` は `yyyy-MM`、`cohort_week` は週の月曜の日付。
- **率はタブに入れず、分子と分母を入れている。** 画面で割る。分母が 0 のときは「算出不可」と出す（0% と出さない）。
- 平均正答率は「合算の正解数 ÷ 合算の回答数」。回ごとの率の平均ではない（画面に「合算」と書く）。
- 「回答数」は選んだ問題の数。未回答は分母に入れない（無回答率は別の指標）。
- 動作確認の回（`is_test_data`）は入っていない。
- 個人が分かる値（利用者・ゲストの識別子、Discord の値、報告の本文）は入っていない。画面でも、利用者ごとの一覧は作らない。
- 練習・テスト・復習の「終わり方」（outcome）：
  - `completed_all` 全問回答して終了 ／ `completed_partial` 未回答ありで終了 ／ `timeout` 時間切れ
  - `abandoned` 放置（時間制限なしの練習・復習で、開始から7日たっても終えていなかった回。毎朝、保存されていた回答で採点して確定する。選んだ回答は問題の正答率に数える）。期限のある回を放置したときは、期限の時点で `timeout` として確定する
  - `in_progress` 回答中
- `user_type`：`user`（ログイン）／`guest`（ゲスト）。
- 分野：`astronomy` 天文、`development` 宇宙開発、`business` 宇宙ビジネス、`exploration` 宇宙探査、`history` 歴史、`basics` 宇宙基礎、`policy` 宇宙政策。
- 難易度：`beginner` 初級、`intermediate` 中級、`advanced` 上級、`expert` 専門家、`unknown` 不明。
- テストの種類：`toIntermediate` 中級への昇格、`toAdvanced` 上級への昇格、`toExpert` 専門家への昇格、`expertStars` 専門家の星。合格は 40 問中 32 点以上。

## 4. タブの列

### kpi_daily（日ごと。1日1行）
| 列 | 意味 |
|---|---|
| active_users ／ active_guests | その日に回を始めたか単問に答えた、ログイン利用者／ゲストの数（重複なし） |
| new_users ／ logins | 初めてログインした人の数 ／ ログインの回数 |
| practice_started ／ practice_finished ／ practice_timeout | 練習を始めた数 ／ 終えた数（終えた日で数える） ／ そのうち時間切れ |
| test_started ／ test_finished ／ test_timeout ／ test_passed | テストの同じもの ＋ 合格の数 |
| review_started ／ review_finished | 復習（履歴からの解き直し）の数 |
| basic_questions ／ basic_answers ／ basic_correct | 終えた回（練習・テスト）の出題数 ／ 回答数 ／ 正解数 |
| review_questions ／ review_answers ／ review_correct | 復習の同じもの |
| single_answers ／ single_answers_correct ／ single_answers_counted | 単問の回答 ／ 正解 ／ 基本統計に数えたもの（最初の回答） |
| single_retries ／ single_retries_correct | 単問の解き直し ／ その正解 |
| single_explanation_only | 単問で「解説だけ表示」 |
| promotions ／ expert_passes | 昇格の数 ／ 専門家の星のテストの合格（星の加算）の数 |
| reports | 誤り報告の数 |
| errors_internal ／ errors_busy | GAS の想定外のエラー ／ 混雑（Discord の回数制限を含む）の件数。記録は90日分だけ残るので、それより前は 0 |

### kpi_tests（日 × テストの種類 × user_type）
`started`・`finished`・`passed`・`completed_all`・`completed_partial`・`timeout`・`abandoned`（テストではほぼ 0。期限を過ぎた回は毎朝 timeout として確定するため）・`in_progress`・`eligible`（開始時に認定対象だった）・`adjusted`（分野をそろえるため難易度の構成を調整した）・`score_sum`・`answered_sum`・`questions_sum`・`duration_sec_sum`。日付は開始日。

### kpi_score_dist（月 × テストの種類 × user_type × 得点）
`score`（0〜40）ごとの `tests`（受験数）。得点の分布のグラフに使う。月は終えた月。

### kpi_practice（月 × 切り口 × 値）
練習・復習の回を、次の切り口で数える。1つの回が複数の値に入る切り口（分野・難易度）は、合計すると回の数より多くなる。
| dimension | value |
|---|---|
| mode | `practice` ／ `review` |
| user_type | `user` ／ `guest` |
| outcome | 終わり方（3章） |
| count | 選んだ問題数（練習のみ） |
| time_limit | 時間制限（分）、なしは `none`（練習のみ） |
| keyword | 文字で絞り込んだか `yes` ／ `no`（練習のみ） |
| field | 選んだ分野。指定なしは `all`（練習のみ） |
| difficulty | 選んだ難易度。指定なしは `all`（練習のみ） |

列：`attempts`・`finished`・`questions`・`answered`・`correct`・`duration_sec`（finished 以降は終えた回の合計）。

### kpi_segments（月 × bucket × 切り口 × 値）
終えた回の出題1問ずつを数える。`bucket` は `basic`（練習・テスト）／`review`（復習）。
| segment_type | segment |
|---|---|
| field | 問題の分野 |
| difficulty_at_start | 出題したときの難易度 |
| mode | `practice` ／ `review` ／ `test:<種類>` |
| user_type | `user` ／ `guest` |
| level_at_start | 回を始めたときの個人レベル（ログインのみ） |

列：`served`（出題数）・`viewed`（表示した数）・`answers`・`correct`。

### kpi_questions（問題ごと。全期間）
| 列 | 意味 |
|---|---|
| question_id ／ field ／ status ／ posted_on ／ platforms | 問題ID・分野・公開状態（`published`／`stopped`）・出題日・出題した媒体 |
| versions ／ correct_choice ／ choices | 版の数・今の正解（A〜C）・選択肢の数 |
| sns_answers ／ sns_correct | SNS の回答数・正解数（全媒体の合計） |
| site_basic_answers ／ site_basic_correct ／ site_basic_answers_guest | サイトの基本回答数・正解数・うちゲスト（今の統計版） |
| site_review_answers ／ site_review_correct | 復習の回答数・正解数（今の統計版） |
| judged_difficulty ／ inherited_difficulty | サイトの回答で判定した難易度 ／ 修正前から引き継いだ難易度 |
| difficulty_override | 運営が手で固定した難易度（空なら自動）。固定すると、サイトの表示と出題はこの難易度を使う |
| display_difficulty | **サイトに出している難易度**（表で難易度を出すときはこれを使う）。決まり：固定 → サイトの基本回答10件以上なら判定値 → 修正前からの引き継ぎ → SNS の正答率から → `unknown` |
| display_accuracy ／ display_source | サイトに出している正答率（0〜1 の率。見やすさのため率で入れている例外。空は未集計）／その出どころ（`site` サイト・`inherited` 引き継ぎ・`sns` SNS・`none` なし） |
| basic_served ／ review_served ／ test_served | 練習・テスト ／ 復習 ／ テストで出題した回数 |
| unanswered ／ viewed_unanswered | 出題したが答えなかった数 ／ そのうち表示はした数 |
| selected_A ／ selected_B ／ selected_C | 各選択肢が選ばれた数（回・単問の合計、全版） |
| single_answers ／ single_retries ／ single_explanation_only | 単問の回答・解き直し・解説だけ表示 |
| reports_total ／ reports_open | 誤り報告の数 ／ うち未対応 |

### kpi_promotion（テストの種類 × 状態 × 受けた回数）
認定対象のテストを、昇格するまでに何回受けたか。`state` は `promoted`（昇格済み）／`not_yet`（まだ）。`tests_taken` は 20 以上をまとめて 20。`users` は人数、`days_sum` は最初の受験から昇格までの日数の合計（平均 = days_sum ÷ users）。

### kpi_retention（初回の週 × 何週後）
ログイン利用者が初めて使った週（`cohort_week`）ごとに、`week_offset` 週後にも使った人数（`users`）。0 週後がその週の人数。12 週後まで。

### kpi_heatmap（曜日 × 時間帯。直近90日）
`weekday`（1=月〜7=日）・`hour`（0〜23、日本時間）ごとの `attempts_started`（回の開始）と `single_events`（単問の回答・解き直し・解説表示）。`days` は集計した日数（90）。

### kpi_reports（月 × 理由 × 状態）
`reason`：`answer` 正解 ／ `text` 問題文・選択肢 ／ `explanation` 解説 ／ `other`。`status`：`received` 未対応 ／ `resolved` 対応済み ／ `dismissed` 対応しない。`reports` は件数。

### kpi_errors（日 × 操作 × コード）
GAS が返した想定外のエラー（`INTERNAL`）と混雑（`BUSY`）の件数（`count`）。`action` は操作の名前（例：`attempts.finish`、`auth.discord`）。直近90日分。実行時間の上限（6分）で止まったものは数えられない。

### kpi_levels（日ごとの記録。毎日1行足す）
その日の個人レベルの分布（`level_*`）と、専門家の星の分布（`stars_0`〜`stars_5plus`、専門家だけ）。`users` は今いる利用者、`users_left` は Discord サーバーを抜けて匿名化した人。

### kpi_ops（日ごとの記録。毎日1行足す）
問題の数（全体・公開・停止）、回の数（全体・回答中・まだ確定していない放置）、利用者の数（全体・匿名化）、有効なログインの数、未対応の報告、取り込みで確認が必要な行の数、最後の取り込みの日時と結果（追加・更新・正解が決まらない数・エラーだったか）、スプシのセル数とその上限（1,000万）。

### kpi_meta
`generated_at`（集計した日時）・`version`（GAS の版）・`timezone`・`attempts`（数えた回の数）・`seconds`（かかった秒数）。画面の「最終更新」に使う。

## 5. 画面の案（KPI ダッシュボードに「過去問サイト」のタブを足す）

期間（7日／30日／90日／全期間／指定）を選べるようにし、日・月のタブはその期間で絞る。前の同じ長さの期間との比較も出す。各数値に分子・分母を添える。

| 区分 | 出すもの | 元のタブ |
|---|---|---|
| 概要 | 利用者数（ログイン／ゲスト）、新規ログイン、練習・テスト・単問の回数、平均正答率、テストの合格率、昇格数、未対応の報告、最終更新 | daily・meta・ops |
| 利用の推移 | 日ごとの利用者数・回数の折れ線、曜日×時間帯のヒートマップ、継続率の表（コホート） | daily・heatmap・retention |
| 練習 | 問題数・時間制限・分野・難易度の選ばれ方、終わり方の割合、平均正答率・1問あたりの時間 | practice・segments |
| テスト | 種類ごとの受験数・合格率・平均点・時間切れの割合、得点の分布、構成を調整した割合、ゲストの割合 | tests・score_dist |
| 認定・レベル | レベル・星の分布の推移、昇格までの回数・日数 | levels・promotion |
| 問題 | サイトと SNS の正答率の差が大きい問題、正答率の低い／高い問題、よく選ばれる誤答、無回答の多い問題、報告の多い問題（各表で並び替え・分野で絞り込み） | questions |
| 分野・難易度・レベル | 切り口ごとの正答率と出題数、復習で正答率がどれだけ上がったか（basic と review の比較） | segments |
| 単問 | 回答・解き直し・解説だけ表示の推移、解き直しの正解率 | daily・questions |
| 誤り報告 | 理由・状態ごとの件数の推移 | reports |
| 運用 | 取り込みの結果、放置された回の数、スプシの使用量（上限に対する割合）、GAS のエラー・混雑の件数の推移（操作ごとの内訳） | ops・daily・errors |

- 問題の表から、Quiz Manager の過去問サイトの画面（問題の修正）へのリンクを付けてもよい（`/archive?tab=questions&id=<問題ID>`）。
- 数が少ない区分（例：1〜2件）の率は、ぶれが大きいことが分かるよう件数を必ず並べて出す。

## 6. まだ取れないもの（必要になったら足す）

- ページの閲覧数・画面の移り方・検索や絞り込みの条件・端末の種類（サイトに記録の仕組みが要る。プライバシーのページにも書く）
- 誤り報告の対応にかかった時間（reports に「対応した日時」の列が要る）
- お知らせの既読
