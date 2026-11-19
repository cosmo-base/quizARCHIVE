# GAS API 仕様（案）

参加者向けサイト（GitHub Pages）と GAS（Web アプリ）の間のやり取りを定める。
保存先の形は `docs/sheets.md`、決定事項は `docs/decisions.md` を参照。
機密情報（GAS の URL・Discord の秘密の鍵・サーバーIDなど）はこのファイルに書かない。

## 0. 共通

### 呼び出し方
- GAS の Web アプリに、1つの URL へ `POST` で送る。
- 本文は JSON 文字列。`Content-Type: text/plain` で送る（ブラウザの事前確認の通信を起こさないため）。
- GAS はヘッダーを自由に扱えないため、ログイン用トークンやゲストIDも本文に入れる。

```json
{ "action": "attempts.start", "token": "…", "guestId": "…", "params": { … } }
```

- `token`：ログイン中のみ。ログイン用トークン。
- `guestId`：ゲストのみ。ブラウザで作ったランダムな値（localStorage に保存）。
- どちらもない呼び出しは、公開情報の取得（問題一覧など）だけ受け付ける。

### 応答
```json
{ "ok": true, "data": { … } }
{ "ok": false, "error": { "code": "NOT_ELIGIBLE", "message": "現在のレベルでは、このテストは開始できません。" } }
```

| code | 意味 |
|---|---|
| `INVALID` | 送った内容の形が正しくない |
| `UNAUTHORIZED` | ログインが必要、またはログイン用トークンの期限切れ |
| `NOT_MEMBER` | Cosmo Base の Discord サーバーに参加していない |
| `FORBIDDEN` | 本人以外の回・記録を扱おうとした |
| `NOT_FOUND` | 問題・回などが見つからない |
| `NOT_ELIGIBLE` | 受験資格がない |
| `SET_EXHAUSTED` | 直近5回と違う問題セットを作れない（重複制限は緩めない） |
| `SHORTAGE` | 条件に合う問題が足りない |
| `DEADLINE_PASSED` | 期限を過ぎている（回答の保存はできない。終了処理は受け付ける） |
| `BUSY` | 混み合っている。少し待って再送する |
| `INTERNAL` | その他のエラー |

### 守ること
- **正解・解説は、回の終了時（単問は回答時）より前に返さない。** 問題を返すときは、正解と解説を含めない。
- **採点・合否・認定・統計の更新は GAS で行う。** ブラウザから送られた得点や正誤は使わない。
- 期限は開始時に GAS が決め、期限の判定も GAS の時計で行う。
- 終了処理は `LockService` で同時実行を防ぎ、`finalized` を見て回ごとに一度だけ反映する。
- 本人以外の回・記録は返さない（`FORBIDDEN`）。
- ログ出力に表示名・トークンなどを書き出さない。

### 問題の形（正解なし）
```json
{
  "id": "Q-0655", "versionId": "Q-0655-v1",
  "field": "宇宙探査", "postedOn": "2026-11-14", "platforms": ["x"],
  "text": "…", "choices": [{ "id": "A", "text": "…" }, { "id": "B", "text": "…" }, { "id": "C", "text": "…" }],
  "difficulty": "advanced",
  "displayAccuracy": 0.667
}
```
- `difficulty`：`beginner`／`intermediate`／`advanced`／`expert`／`unknown`（SNS 正答率なし・基本回答10件未満）。
- `displayAccuracy`：参加者に見せる正答率（1つだけ）。`null` は未集計。

### 解説の形（終了後・回答後に返す）
```json
{ "correctChoiceId": "C", "explanation": "…", "references": [{ "title": "…", "url": "…", "publisher": "…" }] }
```

## 1. 公開情報（ログイン不要）

### `questions.index`
公開中の全問題（正解・解説なし）を返す。公開日（`publish_from`。出題日の翌日）が来ていない問題は含めない。一覧の検索・絞り込み・並び替えはブラウザ側で行う（約660問なので一括で返し、GAS の呼び出し回数を減らす）。
- 結果は GAS の `CacheService` に保存し、取り込みや修正のときに消す。
- 応答：`{ "questions": [問題の形…], "updatedAt": "…" }`

### `questions.get`
1問を返す。単問の画面で、自分のこれまでの回答状況もあわせて返す。
- 送る：`questionId`
- 返す：`{ "question": 問題の形, "mine": { "choiceId": "B" | null, "correct": true | null, "explanationOnly": false, "retries": [ … ] } | null, "explanation": 解説の形 | null }`
- `explanation` は、本人が回答済み・解説表示済みのときだけ返す。

### `notices.list`
公開中のお知らせ・訂正を返す。

## 2. 単問

### `single.answer`
- 送る：`questionId`、`versionId`、`choiceId`、`eventId`（ブラウザで作る一意な値）、`kind`（`answer`／`retry`）
- 処理：同じ `eventId` の再送は一度だけ記録する。解説を見る前の最初の回答だけ基本統計に数える。解き直し（`retry`）は記録のみ。
- 返す：`{ "correct": true, "counted": true, …解説の形 }`

### `single.explanation`
- 送る：`questionId`、`versionId`
- 処理：「解説だけ表示」として記録する。以後のこの問題の回答は基本統計に数えない。
- 返す：解説の形

## 3. 回（練習・テスト・復習）

### `attempts.start`
- 送る（どれか1つ）
  - 練習：`{ "mode": "practice", "settings": { "count": 10, "fields": [], "difficulties": [], "timeLimitMinutes": null } }`
  - テスト：`{ "mode": "test", "testKind": "toIntermediate" }`
  - 復習：`{ "mode": "review", "sourceAttemptId": "…", "questionIds": ["…"] }`（`questionIds` を省くと元の回の全問）
- 処理：受験資格の確認、出題（分野優先・難易度の補い・直近5回の回避）、開始時の版・難易度・表示正答率・認定資格の固定、期限の決定、セット履歴の記録。
  - テストで難易度「不明」の問題は、専門家の星のテストの「全難易度ランダム」枠だけで使う。
  - 公開日が来ていない問題は出題しない。
- 返す：`{ "attemptId": "…", "questions": [問題の形…], "deadlineAt": "…" | null, "recognitionEligible": true, "baseComposition": {…}, "actualComposition": {…}, "adjusted": false }`

### `attempts.save`
- 送る：`attemptId`、`answers`（`{ "Q-0001": "B", "Q-0002": null }`。変わった分だけでよい）、`seq`（ブラウザで増やす番号）
- 処理：本人の回で回答中のときだけ保存する。`seq` が保存済みより古い送信は無視する。
- 返す：`{ "savedSeq": 12 }`
- 選択のたびには呼ばない。数秒まとめて送る・問題を移動したときに送るなどで回数を減らす。

### `attempts.finish`
- 送る：`attemptId`、`answers`（最終の選択）、`seq`
- 処理：期限内なら手動終了、期限を過ぎていれば時間切れ（期限時点の保存内容で採点）。採点、統計の足し込み、認定（合格・昇格・星）。同じ回の再送は、反映済みの結果をそのまま返す。
- 返す：`attempts.get` の終了後の形

### `attempts.get`
- 送る：`attemptId`
- 返す
  - 回答中：`{ "status": "inProgress", "questions": [問題の形…], "answers": {…}, "savedSeq": 12, "deadlineAt": "…", "currentIndex": 3 }`
  - 終了後：`{ "status": "completed" | "timedOut", "analytics": { "total": 40, "answered": 38, "correct": 33, "score": 33, "scoreRate": 0.825, "answeredAccuracy": 0.868 | null, "durationSec": 3250 }, "recognition": { … } | null, "questions": [ { 問題の形, "selected": "B", "correct": true, …解説の形 } ] }`
- 期限を過ぎた回答中の回は、この呼び出しの中で時間切れとして確定してから返す。

### `attempts.inProgress`
- 返す：本人（ゲストはゲストID）の回答中の回の一覧（要約）。再開の案内に使う。ゲストでも呼べる。

## 4. 本人の記録（ログイン必須）

### `me.get`
- 返す：`{ "level": "intermediate", "passesAtLevel": 2, "expertPasses": 0, "stars": { … } }`

### `history.list`
- 送る：`mode`、`status`、`page`
- 返す：本人の回の一覧（日時・種類・設定・回答数・得点・状態・合否）

### `history.questions`
- 返す：解いた問題の一覧（問題ID・前回の正誤・回答回数・最終日時・該当の回ID）

## 5. 誤り報告

### `reports.create`
- 送る：`questionId`、`versionId`、`attemptId`（任意）、`reason`（`answer`／`text`／`explanation`／`other`）、`detail`、`requestId`（再送の重複防止）
- 返す：`{ "reportId": "…" }`
- ゲストも送れる。同じ `requestId` の再送は一度だけ記録する。報告だけで問題を停止しない。

## 6. ログイン（Discord）

### 流れ
1. サイトが `state`（ランダムな値）を作って sessionStorage に保存し、Discord の認可画面へ移動する。
   - 許可の範囲（scope）：`identify guilds.members.read`。メールアドレス（`email`）は求めない。
   - 戻り先：`https://cbquiz.archive.fsif.jp/auth/callback`
2. Discord から戻り先に `code` と `state` が届く。サイトは `state` が保存した値と一致するか確かめる。
3. サイトが GAS の `auth.discord` に `code` を送る。
4. GAS が Discord とやり取りする。
   - `code` をアクセストークンに交換する（Discord 連携の秘密の鍵はスクリプトプロパティに置く）。
   - 本人のユーザーIDと表示名を取得する。
   - Cosmo Base のサーバーのメンバーか確認する。メンバーでなければ `NOT_MEMBER`。
   - `user_key` を「ユーザーIDと秘密の鍵から作った、元に戻せない値（HMAC-SHA256）」として計算し、利用者を探す。いなければ作る。
   - ログイン用トークン（十分に長いランダムな値）を発行し、ハッシュと有効期限だけを保存する。
   - Discord のアクセストークン、ユーザーID、表示名は保存しない。
5. GAS が `{ "token": "…", "expiresAt": "…", "displayName": "…" }` を返す。サイトはその端末にだけ保存し、表示名を本人の画面に表示する。
6. サイトは元の画面に戻る。

### `auth.discord`
- 送る：`code`、`redirectUri`
- 返す：上記5

### `auth.logout`
- 送る：`token`
- 処理：そのトークンの有効期限を今にして無効にする（行は消さない）。期限切れのトークンでも `ok` を返す。

### 準備（GAS とサイトの設定）
- Discord Developer Portal でアプリを作り、OAuth2 の Redirects に上記の戻り先を登録する。
- GAS のスクリプトプロパティ：`DISCORD_CLIENT_ID`・`DISCORD_CLIENT_SECRET`・`DISCORD_GUILD_ID`・`USER_KEY_SECRET`（長いランダムな値。団体の管理下で控えておく）。
- GitHub の Actions 変数 `DISCORD_CLIENT_ID`（クライアントID。公開されても問題ない値）。ビルド時に `NEXT_PUBLIC_DISCORD_CLIENT_ID` として渡す。
- Discord の回数制限（429）にかかったときは `BUSY` を返し、少し待ってからログインし直してもらう。

### `auth.demoLogin`（V0 のモック専用）
- デモ用の利用者でログインしたことにする。Discord ログインに置き換えたら使わない。

### 補足
- ログイン用トークンの有効期限は30日とする。
- 回答中にトークンの期限が切れた場合も、その回の保存・終了は受け付ける（開始時の利用者・認定資格で処理する）。
- サーバーを抜けた人：次のログイン時に `NOT_MEMBER` で拒否し、`left_server_at` を記録して、その人の記録を匿名の値に置き換える（`docs/decisions.md` 5章）。
- 表示名が Discord で変わった場合、サイトの表示は次のログイン時に更新される。

## 7. 公開のしかた（GAS）

- 実装は Archive 用スプシに紐づく GAS の `archive-api.gs`（リポジトリには含めない）。毎朝の取り込み（`archive-setup.gs`）と同じプロジェクトに置く。
- デプロイ → 新しいデプロイ → 種類「ウェブアプリ」。次のユーザーとして実行：自分（団体のアカウント）、アクセスできるユーザー：全員。
- 発行された URL をサイトのビルド時の `NEXT_PUBLIC_API_URL` に設定する（コードやリポジトリには書かない）。
- コードを直したら「デプロイを管理 → 編集 → 新バージョン」で、同じ URL のまま更新する。
- 版の管理：2つの GAS ファイルの先頭に同じ版番号と変更の記録を書き、`archive-api.gs` の `ARCHIVE_VERSION` も合わせる。デプロイの説明欄にも同じ番号を書く。URL を開くと公開中の版が分かる（`{"status":"ok","version":"1.0.0"}`）。
  - 番号の上げ方：不具合の修正は 1.0.1、機能の追加は 1.1.0、スプシの列の変更など前の版と合わない変更は 2.0.0。
- 問題一覧は GAS のキャッシュ（6時間）から返す。毎朝の取り込みの後と、問題を直した後はキャッシュを消す（`clearCatalogCache_`）。

## 8. 混雑への備え

- GAS は同時に動かせる数に上限がある。`BUSY` を返したときや通信に失敗したときは、ブラウザが少し待って再送する（保存は `seq`、終了と報告は回ID・`requestId` で重複を防ぐ）。
- 問題一覧はキャッシュから返す。統計は足し込み式にし、全件の数え直しをしない。
