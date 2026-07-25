# アルバム全曲解説ポッドキャスト 開発引き継ぎ資料

このドキュメントは、**鹿島アントラーズ版(`~/Sandbox/App/podcast_automation`)と同じ要領で構築した、海外アーティストのアルバム全曲解説ポッドキャスト**の引き継ぎ資料です。共通の構築手順・ハマりどころは AI版(`podcast_automation_ai/HANDOFF.md`)に詳しいので必読。本書は音楽解説番組の固有事項と、**すでに完了している作業**を記載する。

## 0. 現在の状態(2026-07-25時点)

- ✅ フォルダ `~/Sandbox/App/podcast_automation_music` 作成済み
- ✅ 鹿島版からコード一式コピー済み(manual モード、そのまま動く)
- ✅ `.env` 作成済み(番組情報・ボイスID設定済み)
- ✅ `pronunciation_dict.json` 作成済み(スペイン語→カタカナ)
- ✅ **第1話を生成済み**: ロサリア『LUX』1曲目「Sexo, Violencia y Llantas」。`docs/audio/episode_2026-07-25.mp3`(約6分)。台本は `scripts/published/2026-07-25.json` にアーカイブ済み。`docs/feed.xml` も生成済み
- ⬜ 未実施: GitHubリポジトリ化・Pages・カバーアート・Spotify登録(ユーザー操作が必要な部分。下記手順参照)

## 1. 番組コンセプト

- **目的**: 海外アーティストの名盤を1曲ずつ深掘り解説する
- **形式**: カリキュラム型(アルバム単位のシリーズ)。ニュース型ではない
- **第1弾**: ロサリア(Rosalía)の4thアルバム『LUX』(2025年11月7日リリース)を1曲目から順に解説
- **1話1曲**: 目安2,000〜3,500字(音声5〜9分)。長めOK
- **★著作権の絶対ルール**: **歌詞そのものの朗読・逐語引用・逐語訳は禁止**。曲のテーマ・制作背景・音楽的分析を自分の言葉で解説する。台本冒頭で「歌詞の朗読はしない」と一言添える運用にしている(第1話参照)。歌詞サイトの文言をそのまま使わないこと

## 2. 確定済みの設定(.env)

```bash
FISH_AUDIO_API_KEY=<鹿島版と同じキー。コピー済み>
FISH_AUDIO_REFERENCE_ID=5161d41404314212af1254556477c17d  # 鹿島版と同じ声。★ユーザーに音楽番組用の声を確認してもよい
LLM_PROVIDER=manual
SITE_BASE_URL=https://kenmae-arch.github.io/podcast_automation_music
PODCAST_TITLE=アルバム全曲解説            # ★ユーザーに最終確認(仮題)
PODCAST_DESCRIPTION=海外アーティストの名盤を1曲ずつ深掘りする音楽解説ポッドキャスト。…
PODCAST_AUTHOR=Album Deep Dive
PODCAST_EMAIL=k-maekawa-9jt@eagle.sophia.ac.jp
PODCAST_CATEGORY=Music
```

- ボイスIDは今回ユーザー指定が無かったため鹿島版と同じにした。**第1話を聴いてもらい、音楽解説に合う声か確認する**こと。変えたい場合はFish AudioのボイスライブラリのIDを差し替え

## 3. 台本作成のルール(音楽解説特有)

- **事実は必ずWeb裏付け**: リリース日・レーベル・プロデューサー・参加ミュージシャン・チャート成績・受賞などはWebSearch/WebFetchで確認してから書く(第1話はWikipedia等で裏付け済み)
- **歌詞は絶対に引用しない**(セクション1参照)。曲名・アルバム名の翻訳はOK(それは歌詞ではない)
- **解説の骨子(1曲あたり)**: ①曲の概要・アルバム中の位置づけ ②歌詞が描くテーマ・世界観(自分の言葉で) ③音楽的特徴(編成・構成・サウンドの仕掛け) ④制作背景・エピソード ⑤次曲へのつなぎ
- **トーン**: 音楽好きに語りかける、熱量のある「です・ます」調の1人語り。専門的すぎず、聴くと曲を聴き返したくなる導き方
- **読み仮名辞書**: 外国語の固有名詞はTTS(日本語ボイス)が読めないので、`pronunciation_dict.json` にカタカナ読みを登録する。**新しいアーティスト名・曲名・人名が出るたびに登録**すること。台本本文にカタカナを直接書いてもよいが、ショーノート(title/description)は原語表記にする(検索性のため)

## 4. 『LUX』全曲リスト(第1弾のカリキュラム)

18曲・4楽章構成。次回以降は2曲目から順に。**各回、制作前に必ず最新情報をWebで確認する**こと(下記は制作の出発点。曲順・曲名は要検証)。

- 第1楽章 / 第2楽章 / 第3楽章 / 第4楽章 に分かれる。1曲目「Sexo, Violencia y Llantas」→ 2曲目「Reliquia」へ切れ目なく続く構成
- **次回制作するのは 2曲目「Reliquia」**(第1話のラストで予告済み)
- 全曲の正確な曲順・タイトルは英語版Wikipedia "Lux (Rosalía album)" のトラックリストで確認する(https://en.wikipedia.org/wiki/Lux_(Rosal%C3%ADa_album) )
- 進捗管理: 配信済みは `scripts/published/` に残るが、`CURRICULUM.md` を作って全曲リスト+ステータス(未作成/配信済み)を管理するのが望ましい(まだ未作成)

### アルバム基礎情報(検証済み・各回のイントロで使い回せる)

- 2025年11月7日、Columbia Recordsよりリリース、ロサリアの4作目
- ロンドン交響楽団を起用、指揮はDaníel Bjarnason。クラシック/オペラの語法を全面に
- 14言語(スペイン語・英語・アラビア語・カタルーニャ語・仏・独・ヘブライ・伊・日本語・ラテン・中国語・ポルトガル・シチリア・ウクライナ語)
- テーマ: 女性の神秘性・変容・精神性。女性聖人(ヒルデガルト・フォン・ビンゲン等)に着想。C.リスペクトル、S.ヴェイユの影響
- プロデュース: Rosalía, Caroline Shaw, Noah Goldstein, Pharrell Williams ほか
- 評価: Metacritic 95、Guardian★5、NME「傑作」

## 5. 残作業の手順(ユーザー操作が必要)

AI版HANDOFF.md の Step 6〜8 と同じ。要点:

1. **GitHubリポジトリ作成**: ユーザーに `podcast_automation_music`(Public)を作ってもらう(Claude権限では公開リポジトリを作れない)。その後 `git init`→commit→remote add→push はClaude可。pushで `send-pack disconnect` が出たら `git config http.postBuffer 157286400`
2. **Pages有効化**: `gh api repos/kenmae-arch/podcast_automation_music/pages -X POST -f "source[branch]=main" -f "source[path]=/docs"`
3. **Secret/Variable登録**: `gh secret set FISH_AUDIO_API_KEY ...` と各 `gh variable set ...`
4. **カバーアート**: `docs/cover.jpg`(1400〜3000px四方RGB)。ユーザーに画像支給を確認(鹿島版はGemini生成画像)。`rss_manager.py` は cover.jpg 前提の実装済み
5. **Spotify登録**: ★最大の罠。ホスト型で番組作成→**エピソード1本を手動アップ**(既に第1話MP3がある)→設定「ポッドキャストのリダイレクト」に `https://kenmae-arch.github.io/podcast_automation_music/feed.xml` を入力。詳細はAI版HANDOFF.md Step 8

## 6. 日々の運用

ユーザー「次の曲やって」→ 該当曲を最新情報でWeb裏付け → 台本を `scripts/pending.json` に(新出固有名詞は辞書へ、歌詞引用しない)→ `"$SCRATCH/venv/bin/python" main.py` → MP3をユーザーに送付 → CURRICULUM更新 → `git push`

## 7. 技術メモ(音楽番組で踏んだ点)

- **ffmpeg未導入だとバイト連結フォールバックになる**: 第1話も2チャンクをバイト連結で結合済み。再生は問題ないが、duration表示の正確さや結合部の品質を上げたいなら `brew install ffmpeg` でpydub結合になる(長尺・多チャンクなら推奨)
- 実行venv: `/private/tmp/.../scratchpad/venv`(鹿島版で作成したもの。無ければ `python3 -m venv venv && pip install -r requirements.txt`)
- アルバムが変わったら `.env` の PODCAST_TITLE 等は据え置きでよいが、シリーズ切り替え時は説明文やカバーの扱いを検討(番組は1つで、シリーズをまたぐ運用を想定)
