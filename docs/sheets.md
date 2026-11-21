# スプレッドシートの構成と列定義（案）

決定事項は `docs/decisions.md` を参照。ここでは保存先（スプシ）の形と、元のクイズスプシからの移行・日次の取り込みを定める。
機密情報（スプシのID・URL・アカウント名など）はこのファイルに書かない。

## 0. 前提

- 保存先は**1つのスプレッドシート**とし、① 問題 ② 統計 ③ 個人データ ④ 運営 の各タブを作る。個人データも同じファイルに入るため、共有は管理者に絞る。
- タブと見出しは、Archive 用スプシに紐づく GAS の「シートを準備」で作る（GAS のコードはリポジトリに含めない）。セルはすべて書式なしテキストにする。
- 読み書きは GAS（Web アプリ）だけが行う。参加者のブラウザはスプシに直接アクセスしない。
- 日時は ISO 8601（UTC）で保存し、画面や日付の区切りは日本時間で扱う。
- 1つのスプレッドシートに入るセルは1,000万個まで。行が増え続けるシート（③の回答など）は、列を必要最小限にする。

## 1. 元のクイズスプシ（読み取り元）

| 列 | 内容 | 移行での扱い |
|---|---|---|
| 番号 | 通し番号 | 問題IDの元にする（`Q-0001` 形式）。元の番号も控えとして保存 |
| 出題日 | SNSで出題した日 | 保存し、画面に小さく表示 |
| 問題 | 問題文 | 問題文（版1）。先頭の接続詞を取り除く（下記） |
| 選択肢 ×3 | 3択の選択肢 | 選択肢 A〜C |
| 回答 | 正解 | 正解の選択肢を特定して保存（下記） |
| 解説 | 解説 | 解説（版1）。参考文献は空で始め、管理画面から追加できる |
| クイズの分類 | 分野 | 分野（7分野） |
| 回答数・正答数（Discord／X／Instagram／マイコミュ） | 媒体ごとの SNS の回答数・正答数 | 媒体ごとの数のまま保存。SNS 正答率は「正答数の合計 ÷ 回答数の合計」で計算 |
| 正答率・回答数・総回答数 | 計算値・累計 | 移さない（上の数から計算できる） |
| 管理ID（自動） | 例：`2026-11-14:x` | 控えとして保存。最近の行にしかないため、問題IDには使わない |

### 分野（7分野）
天文／宇宙開発／宇宙ビジネス／宇宙探査／歴史／宇宙基礎／宇宙政策

- テストの分野均等配分は 40 ÷ 7 で、6・6・6・6・6・5・5 問。
- 移行後に「分野 × 難易度」の問題数を数え、テストの基準構成を満たせるか確認する。

### 読み飛ばす行
- 問題文が空の行は読み飛ばす（先の番号と数式だけが入った、まだ出題していない行など）。確認が必要な行としても記録しない。

### 正解の特定
1. 「正解は N　〜 です。」の形なら、番号 N の選択肢を正解とする。
2. それ以外は、回答の文字と選択肢を照らし合わせる。全角・半角、空白の違いはそろえてから比べる（例：「環(リング)」と「環（リング）」）。
3. それでも1つに決まらない行は、移行結果の一覧に出し、人が確認する。

### 問題文の先頭の接続詞
- SNS 投稿文の前置きを受けた「では、」などで始まる問題がある（例：657番）。
- 移行時に、問題文の先頭の「では、」「それでは、」「さて、」などを取り除く。取り除いた行は移行結果の一覧に出す。

### SNS 正答率と回答数0の扱い
- SNS の回答数の合計が0の問題は、SNS 正答率を「なし（未集計）」とする。0% として扱わない。
- 複数の媒体に同じ問題を出しているのは超初期のみ。媒体ごとの数は合計して使う。

### 媒体の表示
- 回答数の列に値がある媒体を「出題した媒体」として保存し、出題日と一緒に小さく表示する（例：「2026/11/14 出題・X」）。

## 2. 日次の取り込み

- 元スプシには毎朝6時に「当日の問題」と「前日の SNS 回答数」が反映される。
- 取り込み用の GAS を毎朝6時より後（6時15分ごろ）に自動実行する。シート全体は読まず、**問題文が入っている最後の行から上の数行だけ**を読む（最後の行は問題文の列だけを読んで探す）（初期値30行。スクリプト プロパティ `SYNC_TAIL_ROWS` で変更できる）。前々日以前の行は変わらないため、それより前は読まない。
  - まだ登録していない番号の行：問題と版1を作る（正解の特定・接続詞の除去は移行と同じ規則）。サイトへの公開は出題日の翌日からとし、`publish_from` に出題日の翌日を入れる。取り込みが何日か止まっていても、末尾の範囲にある行は追加される。
  - 出題日が前日・当日の行：SNS の回答数・正答数と出題した媒体だけを更新する。問題文などは上書きしない（修正は管理画面から版を追加して行う）。
- 実行結果（追加・更新した件数、正解を特定できなかった行など）は ④ 運営の取り込み記録に残す。
- 初回の移行だけは、全行を読む。

## 3. ① 問題

### questions（問題）
| 列 | 内容 |
|---|---|
| question_id | `Q-0001` 形式。変更しない |
| source_no | 元スプシの番号 |
| source_admin_id | 元スプシの管理ID（あれば） |
| posted_on | 出題日（日本時間の日付） |
| publish_from | サイトに公開する日（出題日の翌日）。この日より前は一覧・出題に出さない |
| platforms | 出題した媒体（例：`x`、`discord,x`） |
| field | 分野 |
| status | `published`（公開）／`stopped`（出題停止） |
| current_version_id | 現在の版 |
| sns_answers_discord ／ sns_correct_discord | Discord の回答数・正答数 |
| sns_answers_x ／ sns_correct_x | X の回答数・正答数 |
| sns_answers_instagram ／ sns_correct_instagram | Instagram の回答数・正答数 |
| sns_answers_mycommu ／ sns_correct_mycommu | マイコミュの回答数・正答数 |
| imported_at ／ sns_updated_at | 取り込み日時・SNS の数の最終更新日時 |
| difficulty_prior | 運営が付けた難易度の見積もり（`beginner`〜`expert`）。問題文と選択肢から付け、難易度の推定の出発点に使う（`docs/decisions.md` 4章） |
| difficulty_override | 運営が手で固定した難易度（`beginner`〜`expert`。空なら自動）。固定するとサイトの表示と出題はこの難易度を使い、正答率の表示と統計はそのまま。Quiz Manager から直すと、列がなければ GAS が足す |

### question_versions（問題の版）
| 列 | 内容 |
|---|---|
| version_id | 版ID（例：`Q-0001-v1`） |
| question_id | 問題ID |
| version_no | 版番号 |
| text | 問題文 |
| choice_a ／ choice_b ／ choice_c | 選択肢 |
| correct | 正解（`A`／`B`／`C`） |
| explanation | 解説 |
| references | 参考文献（JSON：文献名・URL・発行元） |
| stats_version_id | 統計を数える単位。統計を引き継がない修正では新しい値にする（どの修正で新しくするかは要件 TBD-02） |
| prev_version_id | 前の版 |
| created_at ／ created_by ／ change_reason | 作成日時・作成者（運営内の担当名）・変更理由 |

## 4. ② 統計

### question_stats（問題・統計版ごと）
| 列 | 内容 |
|---|---|
| stats_version_id ／ question_id | 対象 |
| basic_answers ／ basic_correct | 基本回答数・正解数（ログイン利用者とゲストの合計） |
| basic_answers_guest ／ basic_correct_guest | うちゲスト分 |
| review_answers ／ review_correct | 復習回答数・正解数 |
| judged_difficulty ／ judged_at_count ／ judged_at | 自動判定した難易度・判定時点の基本回答数・判定日時 |
| inherited_accuracy ／ inherited_difficulty ／ inherited_from | 新しい統計版が10件に達するまで引き継ぐ旧版の値と、その元 |

- 回答のたびに全件を数え直さず、終了処理の中で数を足し込む。
- 表示する正答率・難易度：基本回答10件未満は SNS 正答率（なければ「未集計」・難易度「不明」）、10件以上はサイトの基本正答率。

## 5. ③ 個人データ（見られる人を最小限にする）

### users（利用者）
| 列 | 内容 |
|---|---|
| user_key | Discord のユーザーIDと秘密の鍵から作った、元に戻せない値。Discord のユーザーIDと表示名は保存しない |
| level | 個人レベル |
| passes_at_level | 現在の段階の累計合格数 |
| expert_passes | 専門家到達後の合格数（星の計算用） |
| created_at ／ last_login_at | 登録日時・最終ログイン日時 |
| left_server_at | Discord サーバーを抜けたと分かった日時。このとき user_key を匿名の値（`anon-…`）に置き換える（本人の依頼で匿名化したときは空のまま） |

### sessions（ログイン状態）
| 列 | 内容 |
|---|---|
| token_hash | ログイン用トークンのハッシュ（トークンそのものは保存しない） |
| user_key | 利用者 |
| created_at ／ expires_at | 発行日時・有効期限 |

### attempts（回）
| 列 | 内容 |
|---|---|
| attempt_id | 回ID |
| owner | `user:<user_key>` または `guest:<ゲストID>` |
| mode ／ test_kind | 練習・テスト・復習／テストの種類 |
| stats_bucket | `basic` または `review` |
| recognition_eligible ／ level_at_start | 開始時に固定した認定資格・個人レベル |
| settings ／ base_composition ／ actual_composition ／ adjusted | 設定・基準構成・実際の構成（JSON）・調整したか |
| set_key ／ source_attempt_id | 問題セットの識別子・復習元の回 |
| started_at ／ deadline_at ／ finished_at | 開始・期限・終了の日時 |
| status ／ finish_reason | 状態（回答中・終了・時間切れ・無効）・終了理由 |
| total ／ answered ／ correct ／ duration_sec | 出題数・回答数・正解数・所要時間 |
| finalized | 終了処理を反映済みか（二重反映の防止） |
| is_test_data | 動作確認用の回か（本番の統計から除外するため） |
| current_index | 表示中の問題の位置（再開用） |
| saved_seq | 最後に保存した送信の番号（古い送信で新しい選択を上書きしないため） |

保存する値（API の値と同じ）
- mode：`practice`／`test`／`review`、test_kind：`toIntermediate`／`toAdvanced`／`toExpert`／`expertStars`
- stats_bucket：`basic`／`review`、status：`inProgress`／`completed`／`timedOut`
- finish_reason：`manual_all`（全問回答して終了）／`manual_unanswered`（未回答ありで終了）／`timeout`
- level・level_at_start：`beginner`／`intermediate`／`advanced`／`expert`
- 真偽値は文字の `true`／`false`。日時は ISO 8601（UTC）

### attempt_questions（回の各問題）
| 列 | 内容 |
|---|---|
| attempt_id ／ order | 回ID・出題順 |
| question_id ／ version_id | 出題時に固定した問題と版 |
| difficulty_at_start ／ accuracy_at_start | 出題時の難易度・表示正答率 |
| selected ／ saved_seq ／ saved_at | 最終選択・更新順序・保存日時 |
| correct | 正誤（終了後） |
| viewed | 表示したか |

- 1回のテストで40行増える。1,000万セルの上限に近づいたら、古い年度の分を別ファイルへ移す。

### single_answers（単問の回答）
| 列 | 内容 |
|---|---|
| event_id | 回答の識別子（再送の重複防止） |
| owner ／ question_id ／ version_id | 回答者・問題・版 |
| kind | `answer`（解説前の回答）／`retry`（解き直し）／`explanation_only`（解説だけ表示） |
| choice ／ correct | 選択・正誤 |
| counted | 基本統計に数えたか |
| at | 日時 |

### recognitions（認定）
| 列 | 内容 |
|---|---|
| attempt_id ／ user_key ／ test_kind | 対象 |
| passed ／ promoted | 合格したか・昇格したか |
| level_before ／ level_after ／ passes_after ／ expert_passes_after | 処理前後の状態 |
| processed_at | 処理日時 |

### set_history（重複防止用の一時履歴）
| 列 | 内容 |
|---|---|
| owner ／ jst_date ／ set_key ／ created_at | 主体・日本時間の日付・問題セット・記録日時 |

- 日付が変わった分は消してよい（成績・履歴は消えない）。

## 6. ④ 運営

| シート | 主な列 |
|---|---|
| notices（お知らせ） | notice_id、kind（訂正／お知らせ）、title、summary、body、question_id、before、after、published_at、ends_at |
| reports（誤り報告） | report_id、question_id、version_id、attempt_id、reason、detail、owner、created_at、status（`received` 未対応・`resolved` 対応済み・`dismissed` 対応しない） |
| settings（設定値） | key、value、updated_at（合格点、判定の最低件数・間隔など） |
| sync_log（取り込み記録） | run_at、kind（setup／migration／daily）、read_rows、added、updated、unresolved（正解を特定できなかった行の数）、message |
| import_issues（確認が必要な行） | run_at、source_row（元スプシの行番号）、source_no（番号）、kind（correct_unresolved・conjunction_removed・unknown_field・duplicate_no・invalid_date など）、detail |
| api_log（GAS のエラー・混雑） | at、action（操作の名前）、code（`INTERNAL`／`BUSY`）、message（300文字まで）。利用者・ゲストの識別子やトークンは書かない。最初の記録のときに GAS が作り、90日より古い行は毎朝消す |
| kpi_*（集計） | KPI ダッシュボード用の集計。個人が分かる値は入れない。普段は別のスプシ（`STATS_SHEET_ID`）に書く（`docs/kpi-archive.md`） |
