# データ引き継ぎメモ

`CONTENTS.md` §42「実装時に生成してはいけないもの」に従い、**確認できない値は生成していません**。
未確定の項目は `null` にしてあり、UI 側は §38「欠損時の扱い」のとおり
「その項目のみ非表示」で動作します。`不明` や `未設定` は画面に出ません。

このメモは、公開前に差し替えが必要な項目の一覧です。

---

## 1. 差し替えが必須の項目

| 項目 | 現在の値 | 対応 |
| --- | --- | --- |
| RSS アートワーク | `albums.json` の `original_artwork: null` | 各シリーズで実際に使用している RSS のアートワークを `{ src, alt }` で設定。設定するまでは `DESIGN.md` §8「画像フォールバック」の共通ビジュアル（紙色・シリーズ番号・アーティスト名・アルバム名・アクセント線）が表示されます。新規に画像は生成していません。 |
| 配信先 URL | `site.json` の `platforms[].url: null` | Spotify / Apple Podcasts / Amazon Music の実 URL を設定。未設定のサービスは §2 のとおり非表示（無効化ではない）。3件とも未設定の場合、LISTEN シートは空状態の文言を表示します。 |
| 各話の再生時間 | `episodes.json` の `duration: null` | 実データを `"04:32"` 形式で設定。 |
| 各話の公開日 | `episodes.json` の `published: null` | ISO 日付で設定。画面には `YYYY.MM.DD` で表示されます。 |
| 音声ファイル | `episodes.json` の `audio_file: null` | 本ページは音声を再生しないため表示には影響しませんが、EPISODE DETAIL では必要になります。 |
| 話数（`episode_number`） | `null` | 番組全体の通し番号が確定したら設定。 |

---

## 2. 掲載済みテキストの根拠

アルバム単位の記述は、公開情報として確認できた範囲に限っています。

**事実として記載したもの**

- 2004年7月13日発表 / El Cartel Records・VI Music
- 全21曲
- Billboard Top Latin Albums で初登場1位、レゲトン作品として初の同チャート首位
- 2005年の年間最多売上ラテンアルバム
- ラテン・グラミー賞 最優秀アーバン・ミュージック・アルバム受賞
- 参加プロデューサー（Luny Tunes、Echo、Eliel、Nely、DJ Nelson、Monserrate & DJ Urba、Naldo ほか）
- 「Gasolina」は Luny Tunes 制作。レゲトン曲として初めてラテン・グラミー賞
  最優秀レコード部門にノミネート。National Recording Registry 登録。
  Rolling Stone のレゲトン楽曲ランキング1位（2022年）
- 「No Me Dejes Solo」は Wisin & Yandel 参加、シングルとして発表

**解釈として記載したもの**

`CONTENTS.md` §15 の指定どおり、編集上の見方は
「このシリーズでは〜と捉えます」の形で明示しています。
`listening_points` の `kind: "reading"` は画面上でも「このシリーズの読み」と表示されます。

**記載しなかったもの**

歌詞、制作秘話、アーティスト発言、レビュー、再生回数、受賞歴の推測、
客演クレジットのうち確証が得られなかったもの。

> ⚠️ 調査時、この作業環境では外部ページの取得（WebFetch）が全ホストで
> ブロックされていたため、裏取りは検索結果の要約に限られています。
> **公開前に一次情報での再確認をお願いします。** 特にトラック名の表記
> （アクセント記号・引用符）は、公式トラックリストとの照合を推奨します。

---

## 3. 公開済みエピソードの範囲

『LUX』はトラック01〜18、『good kid, m.A.A.d city』はトラック01〜12を公開済みです。
『Barrio Fino』はトラック01〜20が公開済み、21が公開予定です。

公開状態は手作業で二重管理せず、ルートの `tools/sync_website_data.py` が
`docs/episodes.json` から次の項目を同期します。

- 通し話数
- 解説見出し
- 公開済みショーノートから抽出した150字以内の要約
- 音声ファイル
- 公開日
- 公開状態とアルバムの公開話数

`key_points` と `album_role` は自動生成しません。実際の原稿に基づく編集内容が
ある項目だけを保持します。未公開の行には要約も解説タイトルも表示しません。

---

## 4. 『good kid, m.A.A.d city』の確認情報

- 発売日と12曲の本編トラック、Apple Musicの曲IDはApple公式カタログで確認
- 作品の物語構造と「A Short Film by Kendrick Lamar」の位置づけは
  Apple Musicの編集ノートおよびGRAMMY.comの10周年記事で確認
- 公開話数、見出し、要約、音声ファイルは `docs/episodes.json` から同期
- Apple Podcastsの個別回IDはApple公式のiTunes Search APIで確認
- `key_points` と `album_role` は推測で作らず、現時点では未設定

参考：

- https://music.apple.com/us/album/good-kid-m-a-a-d-city/1471263898
- https://www.grammy.com/news/for-the-record-kendrick-lamar-good-kid-maad-city-ushered-in-new-era-for-west-coast-rap-storytelling-10-year-anniversary/

---

## 5. 関連アルバム

`albums.json` には `CONTENTS.md` §6 の初期公開6作品を登録していますが、
`LUX`、`good kid, m.A.A.d city`、`Barrio Fino` 以外は本ページの表示に必要な項目
（`artist_name` / `album_title` / `series_number` / `related_reason`）のみ設定し、
残りは `null` にしてあります。各シリーズを制作する際に埋めてください。
