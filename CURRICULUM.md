# カリキュラム進捗 — アルバム全曲解説ポッドキャスト

1つの番組(1つのフィード)で、名盤を1枚ずつ、シリーズとして解説していく運用。各回の制作前に、トラックリストと事実関係を必ず最新情報で再確認すること。

ステータス: ✅配信済み / ⬜未作成 / 🔄進行中

## シリーズ一覧
- **第1弾**: Rosalía『LUX』(2025) — 全18曲・4楽章 … ✅ **完結**(番組内 #1〜#18)
- **第2弾**: Kendrick Lamar『good kid, m.A.A.d city』(2012) — 全12曲 … 🔄 **進行中**(番組内 #1〜#5 配信済み)

> 音声ファイルは番組通算の連番 `episode_{連番}_{日付}.mp3`(第1弾 001〜018、第2弾 019〜)。エピソードタイトルの番号(#N)はシリーズごとにリセット。

### アートワーク
| 用途 | ファイル | 備考 |
|---|---|---|
| 番組カバー(チャンネル) | `docs/cover-v2.jpg` | レコードの溝と灯り。全シリーズ共通 |
| 第1弾 LUX | `docs/art/lux.jpg` | 光背(ひかり)。#1〜#18 に付与 |
| 第2弾 GKMC | `docs/art/gkmc.jpg` | 夜のコンプトン。#19〜 に付与 |

> ⚠️ **番組カバーを差し替えるときは、ファイル名も必ず変える**(`cover-v2` → `cover-v3` …)。Spotify等はアートワークをURL単位でキャッシュするため、同名のまま中身だけ差し替えても反映されない。手順: `tools/make_art.py` の `COVER_FILE` と `config.PODCAST_COVER_FILE` を新しい名前に更新 → 再生成 → フィード再生成。

新シリーズを始めるときは、`docs/art/<album>.jpg`(3000px四方・RGB)を追加し、台本 `scripts/pending.json` に `"image": "art/<album>.jpg"` を書けば、そのエピソードに反映される。いずれも実在のジャケットは複製せず、テーマから起こしたオリジナル図案。生成スクリプトは `tools/make_art.py`(`python3 tools/make_art.py` で3枚とも作り直せる)。

---

# 第2弾: Kendrick Lamar『good kid, m.A.A.d city』(進行中)

アルバム: 2012年10月22日 / Interscope・Top Dawg・Aftermath / 全12曲。"A Short Film by Kendrick Lamar" を掲げた映画的コンセプト作(コンプトンで育つ10代の“ある一日”)。エグゼクティブP: Dr. Dre & Anthony "Top Dawg" Tiffith。トラックリストは英語版Wikipedia で検証済み(2026-07-25時点)。

| # | 曲名 | ステータス | 配信日 / メモ |
|---|------|-----------|--------------|
| 1 | Sherane a.k.a Master Splinter's Daughter | ✅ | 2026-07-25 / #1。物語の幕開け。17歳とSherane、留守電の仕掛け。prod. Tha Bizness |
| 2 | Bitch, Don't Kill My Vibe | ✅ | 2026-07-25 / #2。自分の波長を守る宣言＋流行批判。prod. Sounwave / Boom Clap Bachelors sample |
| 3 | Backseat Freestyle | ✅ | 2026-07-25 / #3。少年の空想と野望、MLK参照の皮肉。prod. Hit-Boy |
| 4 | The Art of Peer Pressure | ✅ | 2026-07-25 / #4。同調圧力で強盗に加担。二重の自己。prod. Tabu |
| 5 | Money Trees (feat. Jay Rock) | ✅ | 2026-07-25 / #5。誘惑としての金。prod. DJ Dahi / Beach House "Silver Soul" sample |
| 6 | Poetic Justice (feat. Drake) | ⬜ | 次回制作予定(#5ラストで予告済み) |
| 7 | good kid | ⬜ | |
| 8 | m.A.A.d city (feat. MC Eiht) | ⬜ | |
| 9 | Swimming Pools (Drank) | ⬜ | |
| 10 | Sing About Me, I'm Dying of Thirst | ⬜ | 12分超の大曲 |
| 11 | Real (feat. Anna Wise) | ⬜ | |
| 12 | Compton (feat. Dr. Dre) | ⬜ | 最終曲 |

### 配信済みファイル対応(第2弾)
| 話 | 音声 | アーカイブ台本 |
|----|------|--------------|
| #1 | docs/audio/episode_019_2026-07-25.mp3 | scripts/published/2026-07-25_ep019.json |
| #2 | docs/audio/episode_020_2026-07-25.mp3 | scripts/published/2026-07-25_ep020.json |
| #3 | docs/audio/episode_021_2026-07-25.mp3 | scripts/published/2026-07-25_ep021.json |
| #4 | docs/audio/episode_022_2026-07-25.mp3 | scripts/published/2026-07-25_ep022.json |
| #5 | docs/audio/episode_023_2026-07-25.mp3 | scripts/published/2026-07-25_ep023.json |

---

# 第1弾: Rosalía『LUX』(完結)

アルバム: Rosalía『LUX』(2025年11月7日 / Columbia Records / 全18曲・4楽章)。トラックリストは英語版Wikipedia "Lux (Rosalía album)" で検証済み。

> 🎉 **2026-07-25、全18曲(4楽章)の解説を配信完了。第1弾『LUX』シリーズ完結。**

## 第1楽章 (First Movement)
| # | 曲名 | 長さ | ステータス | 配信日 / メモ |
|---|------|------|-----------|--------------|
| 1 | Sexo, Violencia y Llantas | 2:20 | ✅ | 2026-07-25 / #1。世俗と神聖の対比で幕開け |
| 2 | Reliquia | 3:49 | ✅ | 2026-07-25 / #2。聖遺物＝世界に置いてきた自分のかけら |
| 3 | Divinize | 4:03 | ✅ | 2026-07-25 / #3。神化(テオーシス)。母語カタルーニャ語＋英語 |
| 4 | Porcelana (with Dougie F) | 4:07 | ✅ | 2026-07-25 / #4。日本の尼僧・了然元総に着想。西英羅日の4言語 |
| 5 | Mio Cristo Piange Diamanti | 4:29 | ✅ | 2026-07-25 / #5。ほぼ全編伊語。アッシジのフランチェスコと聖キアラの霊的友情に着想 |

## 第2楽章 (Second Movement)
| # | 曲名 | 長さ | ステータス | メモ |
|---|------|------|-----------|------|
| 6 | Berghain (with Björk and Yves Tumor) | 2:58 | ✅ | 2026-07-25 / #6。第2楽章の幕開け。崇拝としての愛。独西英 |
| 7 | La Perla (with Yahritza y su Esencia) | 3:15 | ✅ | 2026-07-25 / #7。偽りの真珠=トキシックな相手への決別 |
| 8 | Mundo Nuevo | 2:20 | ✅ | 2026-07-25 / #8。新しい世界への渇望。ペテネーラ。日本語ヴァース |
| 9 | De Madrugá | 1:44 | ✅ | 2026-07-25 / #9。夜明け前と復讐の宿命。ウクライナ語。El Mal Querer期の未収録曲 |

## 第3楽章 (Third Movement)
| # | 曲名 | 長さ | ステータス | メモ |
|---|------|------|-----------|------|
| 10 | Dios Es un Stalker | 2:57 | ✅ | 2026-07-25 / #10。第3楽章の幕開け。神の視点＝崇拝と監視は紙一重 |
| 11 | La Yugular | 4:18 | ✅ | 2026-07-25 / #11。頸静脈より近い愛。神秘家ラービアに着想。西/アラビア語 |
| 12 | Focu 'Ranni | 2:50 | ✅ | 2026-07-25 / #12。シチリア語。名の由来サンタ・ロサリア。自立の宣言 |
| 13 | Sauvignon Blanc | 2:42 | ✅ | 2026-07-25 / #13。第3弾シングル。豪華さの放棄と精神的充足 |
| 14 | Jeanne | 3:51 | ✅ | 2026-07-25 / #14。フィジカル盤限定。ジャンヌ・ダルクに捧ぐ。仏/西 |

## 第4楽章 (Fourth Movement)
| # | 曲名 | 長さ | ステータス | メモ |
|---|------|------|-----------|------|
| 15 | Novia Robot | 3:12 | ✅ | 2026-07-25 / #15。最終楽章の幕開け。物象化への風刺と解放。中/ヘブライ語 |
| 16 | La Rumba del Perdón (with Estrella Morente and Sílvia Pérez Cruz) | 4:11 | ✅ | 2026-07-25 / #16。裏切りと喪失を赦しのルンバへ。El Mal Querer期の旧曲 |
| 17 | Memória (with Carminho) | 3:45 | ✅ | 2026-07-25 / #17。全編ポルトガル語のファド。記憶とアイデンティティ |
| 18 | Magnolias | 3:14 | ✅ | 2026-07-25 / #18【最終回】。死を祝祭に。神と中間で出会う。シリーズ完結 |

---

## 配信済みファイル対応
| 話 | 音声ファイル | アーカイブ台本 |
|----|------------|--------------|
| #1 | docs/audio/episode_001_2026-07-25.mp3 | scripts/published/2026-07-25_ep001.json |
| #2 | docs/audio/episode_002_2026-07-25.mp3 | scripts/published/2026-07-25_ep002.json |
| #3 | docs/audio/episode_003_2026-07-25.mp3 | scripts/published/2026-07-25_ep003.json |
| #4 | docs/audio/episode_004_2026-07-25.mp3 | scripts/published/2026-07-25_ep004.json |
| #5 | docs/audio/episode_005_2026-07-25.mp3 | scripts/published/2026-07-25_ep005.json |
| #6 | docs/audio/episode_006_2026-07-25.mp3 | scripts/published/2026-07-25_ep006.json |
| #7 | docs/audio/episode_007_2026-07-25.mp3 | scripts/published/2026-07-25_ep007.json |
| #8 | docs/audio/episode_008_2026-07-25.mp3 | scripts/published/2026-07-25_ep008.json |
| #9 | docs/audio/episode_009_2026-07-25.mp3 | scripts/published/2026-07-25_ep009.json |
| #10 | docs/audio/episode_010_2026-07-25.mp3 | scripts/published/2026-07-25_ep010.json |
| #11 | docs/audio/episode_011_2026-07-25.mp3 | scripts/published/2026-07-25_ep011.json |
| #12 | docs/audio/episode_012_2026-07-25.mp3 | scripts/published/2026-07-25_ep012.json |
| #13 | docs/audio/episode_013_2026-07-25.mp3 | scripts/published/2026-07-25_ep013.json |
| #14 | docs/audio/episode_014_2026-07-25.mp3 | scripts/published/2026-07-25_ep014.json |
| #15 | docs/audio/episode_015_2026-07-25.mp3 | scripts/published/2026-07-25_ep015.json |
| #16 | docs/audio/episode_016_2026-07-25.mp3 | scripts/published/2026-07-25_ep016.json |
| #17 | docs/audio/episode_017_2026-07-25.mp3 | scripts/published/2026-07-25_ep017.json |
| #18 | docs/audio/episode_018_2026-07-25.mp3 | scripts/published/2026-07-25_ep018.json |

> メモ: 音声ファイル名は `episode_{連番}_{日付}.mp3` 形式(同日に複数話を作っても衝突しないよう `main.py` を修正済み)。
