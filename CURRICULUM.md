# カリキュラム進捗 — アルバム全曲解説ポッドキャスト

1つの番組(1つのフィード)で、名盤を1枚ずつ、シリーズとして解説していく運用。各回の制作前に、トラックリストと事実関係を必ず最新情報で再確認すること。

ステータス: ✅配信済み / ⬜未作成 / 🔄進行中

## シリーズ一覧
- **第1弾**: Rosalía『LUX』(2025) — 全18曲・4楽章 … ✅ **完結**(番組内 #1〜#18)
- **第2弾**: Kendrick Lamar『good kid, m.A.A.d city』(2012) — 全12曲 … ✅ **完結**(番組内 #1〜#12)
- **第3弾**: Beyoncé『Lemonade』(2016) — 全12曲 … ✅ **完結**(番組内 #1〜#12)
- **第4弾**: Bad Bunny『Debí Tirar Más Fotos』(2025) — 全17曲 … 🔄 **進行中**
- **第5弾(予定)**: Kendrick Lamar『To Pimp a Butterfly』(2015)

> 以降の並びは「女性の物語 → 言語と土地 → 黒人音楽史の総括」という射程の広げ方で決定(2026-07-26)。

> 音声ファイルは番組通算の連番 `episode_{連番}_{日付}.mp3`(第1弾 001〜018、第2弾 019〜)。エピソードタイトルの番号(#N)はシリーズごとにリセット。

### アートワーク
| 用途 | ファイル | 備考 |
|---|---|---|
| 番組カバー(チャンネル) | `docs/cover-v2.jpg` | レコードの溝と灯り。全シリーズ共通 |
| 第1弾 LUX | `docs/art/lux.jpg` | 光背(ひかり)。#1〜#18 に付与 |
| 第2弾 GKMC | `docs/art/gkmc.jpg` | 夜のコンプトン。#19〜#30 に付与 |
| 第3弾 Lemonade | `docs/art/lemonade.jpg` | 黄金の水面(オシュンと南部の夜)。#31〜#42 に付与 |
| 第4弾 DtMF | `docs/art/dtmf.jpg` | カリブの夕景をポラロイドが収める。#43〜 に付与 |

> ✅ **音声化の前に読みチェックが自動で走る**(`main.py` に組み込み済み)。未登録の固有名詞や
> 読みの割れる助数詞が残っていると音声化せずに中止するので、指摘された語を
> `pronunciation_dict.json` に登録してから再実行すること。手動実行は `python3 tools/check_reading.py --all`。

> ⚠️ **配信済みエピソードの音声を作り直したときは、ファイル名も変える**(`episode_023_..._v2.mp3` のように)。同名で中身だけ差し替えても、Spotify等は古い音声をキャッシュし続ける。
> このとき `episodes.json` の **`guid` は絶対に変えないこと**。guid はエピソードの同一性を示すIDで、変えると配信先で「別の新エピソード」として重複してしまう。`rss_manager` は `guid` があればそれを、無ければ音声URLを使う実装。

> ⚠️ **番組カバーを差し替えるときは、ファイル名も必ず変える**(`cover-v2` → `cover-v3` …)。Spotify等はアートワークをURL単位でキャッシュするため、同名のまま中身だけ差し替えても反映されない。手順: `tools/make_art.py` の `COVER_FILE` と `config.PODCAST_COVER_FILE` を新しい名前に更新 → 再生成 → フィード再生成。

新シリーズを始めるときは、`docs/art/<album>.jpg`(3000px四方・RGB)を追加し、台本 `scripts/pending.json` に `"image": "art/<album>.jpg"` を書けば、そのエピソードに反映される。いずれも実在のジャケットは複製せず、テーマから起こしたオリジナル図案。生成スクリプトは `tools/make_art.py`(`python3 tools/make_art.py` で3枚とも作り直せる)。

---

# 第4弾: Bad Bunny『Debí Tirar Más Fotos』(進行中)

アルバム: 2025年1月5日 / Rimas Entertainment / 全17曲(米盤LPのみボーナス1曲)。タイトルは「もっと写真を撮っておけばよかった」。レゲトンに、プエルトリコの伝統音楽(プレーナ／ボンバ／ヒバロ／サルサ)を大きく取り込み、ジェントリフィケーションと文化の喪失、島への愛を歌う。1月3日に短編映画(Bad Bunny共同監督・Jacobo Morales主演)を先行公開。各曲のビジュアライザーにはプエルトリコ史の解説が付され、歴史家Jorell Meléndez Badilloが監修。**2026年グラミーで、スペイン語アルバムとして史上初の年間最優秀アルバム賞を受賞**(ラテン・グラミーでも年間最優秀アルバム)。Metacritic 95。トラックリストは英語版Wikipediaで検証済み(2026-07-26時点)。

| # | 曲名 | ステータス | メモ |
|---|------|-----------|------|
| 1 | Nuevayol | ✅ | 2026-07-27 / #1。El Gran Combo「Un Verano en Nueva York」sample。NYのプエルトリコ人街 |
| 2 | Voy a Llevarte Pa' PR | ✅ | 2026-07-27 / #2。島へ連れて行く。楽しむこと自体が主張になる構造 |
| 3 | Baile Inolvidable | ✅ | 2026-07-27 / #3。6分超のサルサ。Escuela Libre de Músicaの若い奏者たち |
| 4 | Perfumito Nuevo (feat. RaiNao) | ✅ | 2026-07-27 / #4。RaiNaoにとってキャリア初のBillboardチャート1位 |
| 5 | Weltita (feat. Chuwi) | ✅ | 2026-07-27 / #5。Jarabe de Palo「La Flaca」をインターポレート |
| 6 | Veldá (feat. Omar Courtz & Dei V) | ✅ | 2026-07-27 / #6。verdadの島発音綴り。Plan B sample＋Wisinのアウトロ＝三世代の交差 |
| 7 | El Clúb | ✅ | 2026-07-27 / #7。2024年の先行シングル。ハウス。MV終盤の「DTmF 2025」がアルバム予告 |
| 8 | Ketu Tecré | ✅ | 2026-07-27 / #8。"Qué tú te crees"の島発音。停電・三賢者の日・ドミノ・ピトーロ |
| 9 | Bokete | ✅ | 2026-07-27 / #9。boquete=道路の穴。心の穴と行政に放置された穴の二重性 |
| 10 | Kloufrens | ✅ | 2026-07-27 / #10。"close friends"の島発音。自作『La Santa』(YHLQMDLG)への言及 |
| 11 | Turista | ✅ | 2026-07-27 / #11。恋人＝観光客の二重の意味(本人がポッドキャストで明言) |
| 12 | Café con Ron (feat. Los Pleneros de la Cresta) | ✅ | 2026-07-27 / #12。プレーナ。共演で彼らの月間リスナーが数万→1200万規模へ |
| 13 | Pitorro de Coco | ✅ | 2026-07-27 / #13。ヒバロのリズム。賑やかなクリスマスにひとりで飲む酒 |
| 14 | Lo Que Le Pasó a Hawaii | ✅ | 2026-07-27 / #14。1898年に同じくアメリカ領へ。川と浜、そして「レロライ」を守れ。夢で丸ごと浮かんだ曲 |
| 15 | Eoo | ✅ | 2026-07-27 / #15。Héctor & Tito＋自作『X 100pre』への二重の原点回帰。グラミー最優秀グローバル音楽パフォーマンス |
| 16 | DtMF | ⬜ | 次回制作予定。表題曲 |
| 17 | La Mudanza | ⬜ | 最終曲。引っ越し＝去ること／留まること |

### 配信済みファイル対応(第4弾)
| 話 | 音声 | アーカイブ台本 |
|----|------|--------------|
| #1 | docs/audio/episode_043_2026-07-27_v2.mp3 | scripts/published/2026-07-27_ep043.json |
| #2 | docs/audio/episode_044_2026-07-27_v2.mp3 | scripts/published/2026-07-27_ep044.json |
| #3 | docs/audio/episode_045_2026-07-27_v2.mp3 | scripts/published/2026-07-27_ep045.json |
| #4 | docs/audio/episode_046_2026-07-27_v3.mp3 | scripts/published/2026-07-27_ep046.json |
| #5 | docs/audio/episode_047_2026-07-27_v2.mp3 | scripts/published/2026-07-27_ep047.json |
| #6 | docs/audio/episode_048_2026-07-27_v2.mp3 | scripts/published/2026-07-27_ep048.json |
| #7 | docs/audio/episode_049_2026-07-27_v3.mp3 | scripts/published/2026-07-27_ep049.json |
| #8 | docs/audio/episode_050_2026-07-27_v2.mp3 | scripts/published/2026-07-27_ep050.json |
| #9 | docs/audio/episode_051_2026-07-27_v2.mp3 | scripts/published/2026-07-27_ep051.json |
| #10 | docs/audio/episode_052_2026-07-27_v2.mp3 | scripts/published/2026-07-27_ep052.json |
| #11 | docs/audio/episode_053_2026-07-27.mp3 | scripts/published/2026-07-27_ep053.json |
| #12 | docs/audio/episode_054_2026-07-27.mp3 | scripts/published/2026-07-27_ep054.json |
| #13 | docs/audio/episode_055_2026-07-27.mp3 | scripts/published/2026-07-27_ep055.json |
| #14 | docs/audio/episode_056_2026-07-27.mp3 | scripts/published/2026-07-27_ep056.json |
| #15 | docs/audio/episode_057_2026-07-27.mp3 | scripts/published/2026-07-27_ep057.json |

---

# 第3弾: Beyoncé『Lemonade』(進行中)

アルバム: 2016年4月23日 / Parkwood・Columbia / 全12曲。ヴィジュアル・アルバム。夫の裏切りをめぐる私的な物語を、アメリカにおける黒人女性の歴史的経験へと接続したコンセプト作。映像版はキューブラー・ロスの受容過程になぞらえた11章(Intuition / Denial / Anger / Apathy / Emptiness / Accountability / Reformation / Forgiveness / Resurrection / Hope / Redemption)で構成。詩人 Warsan Shire の詩篇が全編に配される。トラックリスト・章構成は英語版Wikipediaで検証済み(2026-07-26時点)。

| # | 曲名 | 章 | ステータス | メモ |
|---|------|----|-----------|------|
| 1 | Pray You Catch Me | Intuition | ✅ | 2026-07-26 / #1。疑いの始まり。prod. Kevin Garrett & Beyoncé |
| 2 | Hold Up | Denial | ✅ | 2026-07-26 / #2。黄金のドレス＝ヨルバの女神オシュン |
| 3 | Don't Hurt Yourself (feat. Jack White) | Anger | ✅ | 2026-07-26 / #3。Led Zeppelin「When the Levee Breaks」sample(原曲は1929年の黒人ブルース)＋Malcolm X演説 |
| 4 | Sorry | Apathy | ✅ | 2026-07-26 / #4。「good hair」＝美の序列への批評。犯人探しには乗らない書き方で |
| 5 | 6 Inch (feat. The Weeknd) | Emptiness | ✅ | 2026-07-26 / #5。Isaac Hayes「Walk On By」sample。働く女性と労働の商品化 |
| 6 | Daddy Lessons | Accountability | ✅ | 2026-07-26 / #6。父から継いだ教えと痛みの反復。カントリーの黒人ルーツ、2016年CMAでのThe Chicks共演と反発 |
| 7 | Love Drought | Reformation | ✅ | 2026-07-26 / #7。イボ・ランディング(1803)の伝承、Julie Dash『Daughters of the Dust』の影響 |
| 8 | Sandcastles | Forgiveness | ✅ | 2026-07-26 / #8。ピアノ一台。あえて崩した歌声。感情曲線の底 |
| 9 | Forward (feat. James Blake) | Resurrection | ✅ | 2026-07-26 / #9。約1分。Sybrina Fulton / Lezley McSpadden / Gwen Carr が遺影を抱く |
| 10 | Freedom (feat. Kendrick Lamar) | Hope | ✅ | 2026-07-26 / #10。Alan Lomax録音(1947 パーチマン刑務所 / 1959 賛美歌)＋Hattie Whiteの言葉＝アルバム名の由来。2024年に大統領選キャンペーン曲 |
| 11 | All Night | Redemption | ✅ | 2026-07-26 / #11。OutKast「SpottieOttieDopaliscious」sample。ホームビデオ＋次世代の女性たち |
| 12 | Formation | — | ✅ | 2026-07-26 / #12【最終回】。章立ての外側。Katrinaと沈むパトカー、Big Freedia／Messy Myaの声。翌日のSuper Bowl 50 |

### 配信済みファイル対応(第3弾)
| 話 | 音声 | アーカイブ台本 |
|----|------|--------------|
| #1 | docs/audio/episode_031_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep031.json |
| #2 | docs/audio/episode_032_2026-07-26.mp3 | scripts/published/2026-07-26_ep032.json |
| #3 | docs/audio/episode_033_2026-07-26.mp3 | scripts/published/2026-07-26_ep033.json |
| #4 | docs/audio/episode_034_2026-07-26.mp3 | scripts/published/2026-07-26_ep034.json |
| #5 | docs/audio/episode_035_2026-07-26.mp3 | scripts/published/2026-07-26_ep035.json |
| #6 | docs/audio/episode_036_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep036.json |
| #7 | docs/audio/episode_037_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep037.json |
| #8 | docs/audio/episode_038_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep038.json |
| #9 | docs/audio/episode_039_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep039.json |
| #10 | docs/audio/episode_040_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep040.json |
| #11 | docs/audio/episode_041_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep041.json |
| #12 | docs/audio/episode_042_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep042.json |

---

# 第2弾: Kendrick Lamar『good kid, m.A.A.d city』(進行中)

> 🎉 **2026-07-26、全12曲の解説を配信完了。第2弾『good kid, m.A.A.d city』シリーズ完結。**

アルバム: 2012年10月22日 / Interscope・Top Dawg・Aftermath / 全12曲。"A Short Film by Kendrick Lamar" を掲げた映画的コンセプト作(コンプトンで育つ10代の“ある一日”)。エグゼクティブP: Dr. Dre & Anthony "Top Dawg" Tiffith。トラックリストは英語版Wikipedia で検証済み(2026-07-25時点)。

| # | 曲名 | ステータス | 配信日 / メモ |
|---|------|-----------|--------------|
| 1 | Sherane a.k.a Master Splinter's Daughter | ✅ | 2026-07-25 / #1。物語の幕開け。17歳とSherane、留守電の仕掛け。prod. Tha Bizness |
| 2 | Bitch, Don't Kill My Vibe | ✅ | 2026-07-25 / #2。自分の波長を守る宣言＋流行批判。prod. Sounwave / Boom Clap Bachelors sample |
| 3 | Backseat Freestyle | ✅ | 2026-07-25 / #3。少年の空想と野望、MLK参照の皮肉。prod. Hit-Boy |
| 4 | The Art of Peer Pressure | ✅ | 2026-07-25 / #4。同調圧力で強盗に加担。二重の自己。prod. Tabu |
| 5 | Money Trees (feat. Jay Rock) | ✅ | 2026-07-25 / #5。誘惑としての金。prod. DJ Dahi / Beach House "Silver Soul" sample |
| 6 | Poetic Justice (feat. Drake) | ✅ | 2026-07-26 / #6。暴力の合間の恋。93年の同名映画＋Janet Jackson sample。prod. Scoop DeVille。2024年のKendrick×Drakeのビーフにも言及 |
| 7 | good kid | ✅ | 2026-07-26 / #7。ギャングと警察の板挟み。人種プロファイリング。prod. Pharrell |
| 8 | m.A.A.d city (feat. MC Eiht) | ✅ | 2026-07-26 / #8。狂った街。前半 Sounwave & THC / 後半 Terrace Martin の G-Funk |
| 9 | Swimming Pools (Drank) | ✅ | 2026-07-26 / #9。酒に沈む。良心の声との二重構造。prod. T-Minus |
| 10 | Sing About Me, I'm Dying of Thirst | ✅ | 2026-07-26 / #10。12:04の大曲。三つの視点＋Maya Angelouの祈り。prod. Like / Skhye Hutch |
| 11 | Real (feat. Anna Wise) | ✅ | 2026-07-26 / #11。“リアル=責任”。両親の留守電がアルバムの存在理由を明かす。prod. Terrace Martin |
| 12 | Compton (feat. Dr. Dre) | ✅ | 2026-07-26 / #12【最終回】。街への凱旋歌。二人が初めて録音した曲。prod. Just Blaze |

### 配信済みファイル対応(第2弾)
| 話 | 音声 | アーカイブ台本 |
|----|------|--------------|
| #1 | docs/audio/episode_019_2026-07-25.mp3 | scripts/published/2026-07-25_ep019.json |
| #2 | docs/audio/episode_020_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep020.json |
| #3 | docs/audio/episode_021_2026-07-25.mp3 | scripts/published/2026-07-25_ep021.json |
| #4 | docs/audio/episode_022_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep022.json |
| #5 | docs/audio/episode_023_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep023.json |
| #6 | docs/audio/episode_024_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep024.json |
| #7 | docs/audio/episode_025_2026-07-26.mp3 | scripts/published/2026-07-26_ep025.json |
| #8 | docs/audio/episode_026_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep026.json |
| #9 | docs/audio/episode_027_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep027.json |
| #10 | docs/audio/episode_028_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep028.json |
| #11 | docs/audio/episode_029_2026-07-26_v3.mp3 | scripts/published/2026-07-26_ep029.json |
| #12 | docs/audio/episode_030_2026-07-26_v2.mp3 | scripts/published/2026-07-26_ep030.json |

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
| #1 | docs/audio/episode_001_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep001.json |
| #2 | docs/audio/episode_002_2026-07-25.mp3 | scripts/published/2026-07-25_ep002.json |
| #3 | docs/audio/episode_003_2026-07-25.mp3 | scripts/published/2026-07-25_ep003.json |
| #4 | docs/audio/episode_004_2026-07-25.mp3 | scripts/published/2026-07-25_ep004.json |
| #5 | docs/audio/episode_005_2026-07-25.mp3 | scripts/published/2026-07-25_ep005.json |
| #6 | docs/audio/episode_006_2026-07-25.mp3 | scripts/published/2026-07-25_ep006.json |
| #7 | docs/audio/episode_007_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep007.json |
| #8 | docs/audio/episode_008_2026-07-25.mp3 | scripts/published/2026-07-25_ep008.json |
| #9 | docs/audio/episode_009_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep009.json |
| #10 | docs/audio/episode_010_2026-07-25.mp3 | scripts/published/2026-07-25_ep010.json |
| #11 | docs/audio/episode_011_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep011.json |
| #12 | docs/audio/episode_012_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep012.json |
| #13 | docs/audio/episode_013_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep013.json |
| #14 | docs/audio/episode_014_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep014.json |
| #15 | docs/audio/episode_015_2026-07-25.mp3 | scripts/published/2026-07-25_ep015.json |
| #16 | docs/audio/episode_016_2026-07-25_v2.mp3 | scripts/published/2026-07-25_ep016.json |
| #17 | docs/audio/episode_017_2026-07-25.mp3 | scripts/published/2026-07-25_ep017.json |
| #18 | docs/audio/episode_018_2026-07-25.mp3 | scripts/published/2026-07-25_ep018.json |

> メモ: 音声ファイル名は `episode_{連番}_{日付}.mp3` 形式(同日に複数話を作っても衝突しないよう `main.py` を修正済み)。
