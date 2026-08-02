# アルバム全曲解説 — ALBUM DETAIL

Daddy Yankee『Barrio Fino』の ALBUM DETAIL ページ実装。
Claude Design のプロトタイプ (`project/Album Detail - Barrio Fino.dc.html`) を、
React + TypeScript + Vite の本実装として起こしたものです。

仕様の優先順位は元の指示どおり **CONTENTS.md → DESIGN.md → モックアップ** としています。

```bash
npm install
npm run sync     # docs/episodes.json から公開状態を同期
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint
```

`npm run build` の出力先はリポジトリの `docs/` です。既存のRSS、音声、
アートワークを残したまま、GitHub Pagesのトップページと `site-assets/` を更新します。

`/albums/{album_id}` のパスから album id を読み、ルート直下では `barrio-fino` を表示します。

## 共有用プレビューの書き出し

CSS・JS・書体をすべてインライン化した単一 HTML を生成します。
外部リクエストを一切行わないため、CSP の厳しい共有先でもそのまま表示できます。

```bash
pip install fonttools brotli
npm i -D @fontsource/instrument-serif @fontsource/inter @fontsource/ibm-plex-mono \
         @fontsource/noto-sans-jp @fontsource/noto-serif-jp
npm run build && npm run preview:bundle   # → preview.html
```

書体パッケージと fonttools は生成時にのみ必要なため、常設の依存には含めていません
（Noto の日本語フォントだけで 175MB あるため）。
日本語フォントはページ内で実際に使う約 390 文字だけにサブセット化し、
1.4MB → 約 60KB に圧縮しています。生成物は ASCII のみで構成しており、
配信先が UTF-8 を宣言しない場合でも文字化けしません。

## 構成

```
src/
  data/          albums.json / episodes.json / site.json + 型とアクセサ
  styles/        tokens.css (DESIGN.md §30) / base.css / system.css
  components/    SiteHeader, AlbumHero, AlbumOverview, TrackJourney,
                 TrackRow, StickyAlbumBar, AlbumCompletionCta,
                 RelatedAlbums, ListenPlatformSheet, SiteFooter …
  hooks/         useCurrentTrack, useScrolledPast, useDialog
  pages/         AlbumDetailPage
docs/
  DATA-HANDOFF.md   公開前に差し替えが必要な項目の一覧（重要）
```

デザイントークンは `styles/tokens.css` に集約し、コンポーネント側では
色・余白・書体・時間・角丸を直接書かず変数を参照しています（DESIGN.md §31-3）。
アルバム固有色はページルートに `--album-accent` として適用し、
`albums.json` から来る値は HEX 形式を検証してから使います。

## このページに存在しないもの

サイト内では音声を再生しないという方針にあわせて、
プレーヤー、再生・停止ボタン、三角形の再生アイコン、シークバー、音量、
前後送り、NOW PLAYING 表示、画面下部の固定プレーヤーは実装していません。

トラックごとの導線は次の2つだけです。

- **解説を見る →** サイト内の EPISODE DETAIL へ
- **配信アプリで聴く ↗** 配信プラットフォーム選択シートを開く

外部遷移はアイコンと文言の両方で示しています。

## 確認済みの項目

- 1440 / 1024 / 640 / 320px で表示崩れなし。320px で横スクロールなし
- タップ領域はすべて 44×44px 以上
- 見出しは h1 → h2 → h3 → h4 の階層。h1 は1つ
- モーダルはフォーカス移動・トラップ・Escape・フォーカス復帰・背景スクロール停止に対応
- 装飾番号・罫線は支援技術から隠し、同じ情報をテキストでも提供
- `prefers-reduced-motion` で移動・stagger・smooth scroll を無効化（表示状態は維持）
- スクロール連動表示は JS 無効時に「常に表示」へフォールバック

## 既知の制約

- **アプリ本体の Web フォントは Google Fonts から読み込みます。**
  実際の書体（Instrument Serif / Noto Serif JP / Inter / Noto Sans JP /
  IBM Plex Mono）での表示は、上記のプレビュー書き出し（書体を自己ホスト）で
  確認済みです。フォールバック書体でもレイアウトが崩れないことも確認しています。
  本番でも自己ホスティングに切り替えると DESIGN.md §27 の要件により適合します。
- ルーティングは単一ページ想定の簡易実装です。EPISODE DETAIL などを
  追加する際はルータの導入を推奨します。
- JS 無効時に全文を表示するには SSR / SSG が必要です（現状は CSR のみ）。
- 掲載データの根拠と差し替え項目は `docs/DATA-HANDOFF.md` を参照してください。
