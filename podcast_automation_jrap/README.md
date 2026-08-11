# 日本語ラップ アルバム全曲解説ポッドキャスト

日本語ラップの名盤を **1曲ずつ深掘り解説** する音楽ポッドキャストの自動生成プロジェクトです。台本を用意すると、Fish Audio の TTS で音声化し、Podcast 用の RSS フィード(`docs/feed.xml`)を生成して GitHub Pages で配信します。

海外アーティスト編の姉妹番組 [podcast_automation_music](https://github.com/kenmae-arch/podcast_automation_music) と同じ仕組みで、こちらは **日本語ラップ専門・1話長め(4,000〜6,000字 ≒ 10〜15分)** の編成です。

- **配信ページ**: https://kenmae-arch.github.io/podcast_automation_jrap/
- **RSS フィード**: https://kenmae-arch.github.io/podcast_automation_jrap/feed.xml
- **第1弾**: Mall Boyz(Tohji & gummyboy)の1st EP『Mall Tape』(2018年) を1曲目から順に解説

## しくみ

```
台本(scripts/pending.json)
        │  main.py
        ▼
  ① 台本取得(manualモード) → ② Fish Audioで音声化 → ③ docs/audio/ に保存
        │
        ▼
  ④ RSSフィード再生成(docs/feed.xml + docs/episodes.json)
        │  git push
        ▼
   GitHub Pages で公開 → Spotify等のポッドキャストアプリへ配信
```

台本は Claude Code などが事前に作成する **manual モード**(既定)で運用しています。LLM API を使わないため無料です(`gemini` / `groq` モードも実装済み)。

## 構成

| ファイル / ディレクトリ | 役割 |
|---|---|
| `main.py` | パイプライン本体(台本取得 → 音声化 → RSS更新 → アーカイブ) |
| `config.py` | 環境変数・定数の一元管理 |
| `script_generator.py` | 台本の取得/生成(manual / gemini / groq) |
| `audio_generator.py` | Fish Audio による音声化・読み仮名辞書の適用・チャンク結合 |
| `rss_manager.py` | `feed.xml` / `episodes.json` の生成 |
| `pronunciation_dict.json` | TTSが読み間違える固有名詞のカタカナ読み辞書 |
| `scripts/pending.json` | 次に音声化する台本(処理後 `scripts/published/` へアーカイブ) |
| `docs/` | GitHub Pages 配信ディレクトリ(`feed.xml` / `audio/` / `cover-v1.jpg` / `art/`) |
| `docs/art/` | シリーズ(アルバム)ごとのエピソード・アートワーク |
| `tools/check_reading.py` | 読み事故の検出リンター(音声化前のゲート) |
| `tools/make_art.py` | カバー/シリーズ別アートワークの生成(`python3 tools/make_art.py`) |
| `CURRICULUM.md` | シリーズごとの進捗管理 |

## セットアップ

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 各種キー・番組情報を記入
```

> 長尺・多チャンクの音声結合を高品質にするには `brew install ffmpeg` を推奨(未導入時はバイト連結にフォールバック)。

## 使い方(1話ぶんの制作)

1. 対象曲を最新情報で裏付け(リリース情報・制作陣・音楽的特徴などを確認)
2. 台本を `scripts/pending.json` に配置(`{"title", "description", "script"}` の JSON)
   - 任意で `"image": "art/malltape.jpg"` を添えると、そのエピソードのアートワークになる(省略時は番組カバー)
3. 新出の固有名詞を `pronunciation_dict.json` に登録
4. 音声生成 & フィード更新
   ```bash
   python main.py
   ```
   実行時に**読みチェック**が走り、未登録の固有名詞や読みの割れる助数詞が残っていると
   音声化せずに中止する。指摘された語を `pronunciation_dict.json` に登録して再実行する。
5. `git push` で公開(GitHub Pages が自動でビルド)

音声ファイルは `episode_{連番}_{日付}.mp3` 形式で保存され、同じ日に複数話を作っても上書きされません。

## 読みチェック(TTSの誤読を防ぐ)

日本語TTSは、未登録のアルファベットや助数詞を読み違える(例: 6分→「ろくぶん」、
7日→「なのか」ではなく「なぬか/しちにち」)。`tools/check_reading.py` は、読み仮名辞書を適用した
**後**のテキストを検査し、**まだ辞書に入っていない危険語だけ**を報告する。

```bash
python3 tools/check_reading.py            # scripts/pending.json を検査
python3 tools/check_reading.py --all      # 配信済み全話を検査
```

検出対象:

| 種別 | 例 |
|---|---|
| 未登録のラテン文字 | `Tohji` `gummyboy` `Higher`(日本語TTSでは確実に崩れる) |
| 数字+助数詞 | `15本` `15階` `6分` |
| 日付の不規則読み | `2日`(ふつか) `7日`(なのか) `20日`(はつか) |
| 1人/2人 | ひとり・ふたり |
| 「数〜」 | `数ヶ月`(すうかげつ) |
| 多音語(警告のみ) | `十分` `大分` `最中` |

`main.py` はこのチェックをゲートとして実行し、HIGH が残っていれば音声化を中止する
(`--skip-reading-check` で明示的に無視できる)。

## 台本作成のルール

- **著作権**: 歌詞そのものの朗読・逐語引用・逐語訳は行わない。曲のテーマ・制作背景・音楽的分析を自分の言葉で解説する。
- **事実は必ず裏付け**: リリース日・レーベル・制作陣・チャート成績などは一次情報に近いソースで確認する。
- **トーン**: 音楽好きに語りかける、熱量のある「です・ます」調の1人語り。
- **長さ**: 1話1曲・**4,000〜6,000字**(姉妹番組より長尺。読み上げでおよそ10〜15分)。
  背景 → アルバム/シーンの文脈 → 曲の深掘り → リスニングポイント、の流れで厚めに構成する。

## GitHub Actions

`scripts/pending.json` を push すると `.github/workflows/daily_podcast.yml` が起動し、GitHub 上で音声化 → 配信まで自動化できます(要 Secret `FISH_AUDIO_API_KEY`)。ローカルで `main.py` を実行して結果を push する運用でも配信できます。

## ライセンス / 注意

生成音声・台本は本番組の配信用です。楽曲そのものの権利は各権利者に帰属します。本プロジェクトは歌詞を引用せず、批評・解説を目的としています。
