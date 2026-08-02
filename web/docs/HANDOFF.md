# 引き継ぎメモ（後続の実装エージェント向け）

このディレクトリは、Claude Design のプロトタイプ
`project/Album Detail - Barrio Fino.dc.html` を React + TypeScript + Vite で
実装したものです。デザインはこの実装を採用する方針で確定しています。

**このファイルを最初に読んでください。**
以下には「一見バグや手抜きに見えるが、意図的な判断」が含まれます。
知らずに「修正」すると、仕様違反になるものがあります。

---

## 0. 仕様の優先順位

```
CONTENTS.md  →  DESIGN.md  →  参考モックアップ
```

矛盾したときは必ずこの順で判断します。モックアップは最下位です。
（`project/uploads/` に両ファイルがあります）

---

## 1. 触ってはいけない設計判断

### 1.1 ポッドキャスト音声はサイト内で再生しない

ポッドキャスト本編の聴取は Spotify / Apple Podcasts / Amazon Music で行います。
したがって、ポッドキャスト用として次は**意図的に存在しません**。

- プレーヤー、再生／停止ボタン、三角形の再生アイコン
- シークバー、音量、前後送り
- NOW PLAYING 表示、画面下部の固定プレーヤー

「ポッドキャストの再生ボタンがない」のは実装漏れではありません。追加しないでください。
一方、2026-08-02 の仕様変更により、**原曲試聴専用**の Apple Music iframe は
例外として実装済みです。アルバムページでは現在トラックと同期して切り替わり、
エピソード詳細ではその曲に固定されます。スクロールだけで自動再生はしません。
トラックごとの導線は次の2つだけです。

| CTA | 遷移先 |
| --- | --- |
| 解説を見る → | サイト内の EPISODE DETAIL |
| 配信アプリで聴く ↗ | その曲のポッドキャスト回への配信プラットフォーム選択シート |

主要 CTA には再生アイコンを使わず、右向き矢印か外部リンクアイコンを使います。

### 1.2 公開状態は `docs/episodes.json` と同期する

初期納品時は5話公開でしたが、統合時に `tools/sync_website_data.py` を追加しました。
現在は『LUX』の18話と『good kid, m.A.A.d city』の12話をすべて公開済み、
『Barrio Fino』はトラック01〜20を公開済み、21を公開予定として表示します。
公開話数、日付、音声パス、見出し、要約はすべて
`docs/episodes.json` から生成し、Web側で事実を追加しません。

> ⚠️ **`key_points` や `album_role` を推測で埋めないでください。**
> 実際の原稿に基づく編集作業を行うまでは `null` / 空配列のままが正解です。

エピソードを公開するときの手順は `DATA-HANDOFF.md` §3 にあります。

### 1.3 `null` は「未設定」であって「埋めるべき空欄」ではない

次は意図的に `null` です。

- `original_artwork` … RSS フィードの実アートワーク待ち。画像を生成しない
- `platforms[].url` … 配信先 URL。**架空の URL を作らない**（§42）
- `duration` / `published` / `audio_file` … 運営側の実データ待ち

UI は CONTENTS.md §38 に従い、欠損項目を**非表示**にします。
`不明` `未設定` `TBD` などの代替文字列を画面に出してはいけません。
`ListenPlatformSheet` は URL が1件もない場合、空状態の文言を表示します（正しい挙動）。

### 1.4 事実と解釈を混ぜない

編集上の解釈には「このシリーズでは〜と捉えます」の形を使います（CONTENTS.md §15）。
`listening_points[].kind` が `"reading"` の項目は、画面上でも
「このシリーズの読み」というラベルが付きます。この区別を消さないでください。

---

## 2. 修正済みの不具合（再発させないこと）

検証中に見つけて直したものです。素朴に書き直すと**元に戻りやすい**箇所です。

| # | 不具合 | 対処 | 該当 |
| --- | --- | --- | --- |
| 1 | 320px で 16px の横スクロール。ロゴ全長＋操作2つがコンテンツ幅を超過 | 480px 未満は短縮ロゴ「全曲解説」。アクセシブルネームは正式名称のまま（DESIGN.md §10 の規定） | `SiteHeader.module.css` |
| 2 | 現在トラックの判定が同着時に必ず最小番号を選んでいた。複数行が同じ面積で見えるため頻発 | 面積が同じときはビューポート中央に近い行を採用 | `useCurrentTrack.ts` |
| 3 | 高さ0のセンチネルを監視していたため、**瞬間的な深いジャンプで sticky バーが反応しない**。IntersectionObserver は「非交差→非交差」では発火しない（ディープリンク・スクロール復元で顕在化） | HERO 自体を監視し、`bottom <= 0` で判定 | `useScrolledPast.ts` |
| 4 | トラック一覧より上に戻っても sticky バーが `TRACK 21 / 21` のまま | `inJourney` を返し、一覧が画面外なら位置表示を出さない | `useCurrentTrack.ts` / `StickyAlbumBar.tsx` |
| 5 | スクロール表示要素が JS 前提で `opacity: 0`。JS が動かないと本文が消える | `html.has-js` が付いたときだけ隠す。IO 非対応なら即表示 | `system.css` / `Reveal.tsx` / `main.tsx` |
| 6 | ロゴのタップ領域が 35px（44px 未満） | `min-height: 44px` | `SiteHeader.module.css` |
| 7 | 1024px で見出しが「曲順にたど／る。」と**単語の途中で改行**（日本語の不自然な改行は禁止事項） | 見出し列を 5→6 カラムに拡張 | `TrackJourney.module.css` |
| 8 | 配信先が UTF-8 を宣言しないと日本語が文字化け | プレビュー生成物を ASCII のみで構成 | `scripts/build-preview.mjs` |

---

## 3. 構成

```
src/
  AppRouter.tsx … React Router のルート定義を集約。basename は Vite の BASE_URL
  data/        albums.json / episodes.json / site.json / episode-media.json
               types.ts  … CONTENTS.md §38 のフィールド名をそのまま使用
               index.ts  … アクセサ。欠損時の扱いはここに集約
               progress.ts … 端末内の聴取位置（localStorage のみ、§14）
  styles/      tokens.css  … DESIGN.md §30 の値を転記。ここが唯一の真実
               base.css / system.css
  components/  各セクション + CSS Modules（AppleMusicPreview を含む）
  hooks/       useCurrentTrack / useScrolledPast / useDialog
  pages/       AlbumDetailPage / EpisodeDetailPage ほか
```

ルートの `tools/sync_website_data.py` が、ポッドキャストの配信データを
`src/data/` へ同期します。`main.py` の配信完了時にも自動実行されます。

**トークン規約**: コンポーネント側で色・余白・書体・時間・角丸を直接書かないこと
（DESIGN.md §31-3）。すべて `tokens.css` の変数を参照します。
アルバム固有色はページルートに `--album-accent` として適用し、
`albums.json` 由来の値は `safeAccent()` で HEX 検証してから使います。

`isPublished()` は `status === "published"` かつ `web_summary` があることを要求します。
片方だけ設定された行が画面に漏れないための防波堤です（§38）。

---

## 4. 未実装 / 既知の制約

- HOME、ALBUMS、ALBUM DETAIL、EPISODE DETAIL、ABOUT、REQUEST、CONTACT、PRIVACY、共通404は実装済みです。
  『LUX』『good kid, m.A.A.d city』『Barrio Fino』はアルバム／エピソード詳細まで公開済みです。
  PRIVACYは2026-08-02時点の実装（Web3Forms、Apple Music埋め込み、Google Fonts、GitHub Pages、localStorage）に
  合わせて作成済みです。外部サービスや解析機能を変更した場合は同時に更新してください
- 画面内遷移は React Router でSPA遷移します。Vite ビルド後に
  `scripts/generate-routes.mjs` が GitHub Pages の直リンク用HTMLも生成します。
  片方だけを削除すると直リンクか画面内遷移のどちらかが壊れるため、両方を維持してください
- 曲単位の配信リンクは `episode-media.json` で管理します。Spotify と Apple Podcasts は
  『LUX』18回と『Barrio Fino』公開済み20回、Apple Podcastsは
  『good kid, m.A.A.d city』12回のすべてで個別回へ直リンク済みです。
  『good kid, m.A.A.d city』のSpotify個別回URLと、各作品のAmazon Music個別回URLは
  匿名Web版から安定して取得できないため、曲単位シートでは非表示です
  （一般LISTENでは番組URLを表示）
- **JS 無効時に全文を出すには SSR / SSG が必要**（現状 CSR のみ）。
  `has-js` の仕組みは入れてあるので、SSG 化すれば要件を満たせます
- **アプリ本体の書体は Google Fonts 参照**。自己ホストにすると DESIGN.md §27 に
  より適合します（プレビュー生成では既に自己ホスト化して実表示を確認済み）
- `editorial_theme` は HERO の一文コンセプトとして**1箇所だけ**表示しています。
  CONTENTS.md §14 と §15 の両方に登場しますが、同一文字列を同一ページに
  2回出すのは編集上おかしいと判断しました。別々の文言が必要なら
  フィールドを分けてください

---

## 5. 変更後に必ず確認すること

```bash
npm install && npm run build && npm run lint
```

そのうえで、少なくとも次を確認してください（すべて一度は満たしていた項目です）。

- 320 / 375 / 640 / 768 / 1024 / 1280 / 1440 / 1920px で**横スクロールが出ない**
- すべての操作要素が 44×44px 以上
- `h1` は1つ。見出しは h1 → h2 → h3 → h4 の階層
- モーダル：フォーカス移動・トラップ・Escape・フォーカス復帰・背景スクロール停止
- ポッドキャスト用の再生系アイコンが DOM に存在しない
- 日本語見出しが単語の途中で改行されていない
- `aria-hidden` の内側にフォーカス可能要素がない
- `prefers-reduced-motion` で移動・stagger・smooth scroll が止まる

`docs/DATA-HANDOFF.md` に、掲載データの根拠と公開前に差し替えが必要な項目を
まとめてあります。**内容の正確性に関わるので、こちらも必ず読んでください。**

---

## 6. 調査上の注意

実装時の作業環境では**外部ページの取得が全ホストでブロックされており**、
事実確認は検索結果の要約に頼らざるを得ませんでした。
掲載済みのアルバム情報（発表日・チャート・受賞・プロデューサー・
「Gasolina」関連の記録）は一次情報での再確認をお願いします。
特に**トラック名の表記（アクセント記号・引用符）は公式トラックリストとの
照合を推奨**します。
