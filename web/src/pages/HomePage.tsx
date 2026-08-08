import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ListenPlatformSheet } from '../components/ListenPlatformSheet';
import { Reveal } from '../components/Reveal';
import { SeriesArtwork } from '../components/SeriesArtwork';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import {
  availablePlatforms,
  formatPublished,
  getAlbum,
  getAlbums,
  getEpisodes,
  getLatestEpisodes,
  isPublished,
  pad2,
  safeAccent,
  site,
  sitePath,
} from '../data';
import type { Album, Episode } from '../data/types';
import { useDialog } from '../hooks/useDialog';
import styles from './HomePage.module.css';

const HERO_COPY =
  '海外アーティストの名盤を、1話1曲、3〜5分で解説。曲の背景や意味をたどりながら、一枚の作品を最初から最後まで楽しむポッドキャストです。';

function episodePath(episode: Episode) {
  return `/episodes/${episode.id}`;
}

function albumStatus(album: Album) {
  return album.status === 'complete' ? 'COMPLETE' : 'IN PROGRESS';
}

function AlbumCard({ album, index }: { album: Album; index: number }) {
  const accent = safeAccent(album.accent);
  const meta = [album.release_year, album.genre].filter(Boolean).join(' / ');
  const style = accent ? ({ '--album-accent': accent } as React.CSSProperties) : undefined;

  return (
    <Reveal as="li" index={index} className={styles.albumItem}>
      <Link
        className={styles.albumCard}
        to={`/albums/${album.id}`}
        aria-label={`${album.artist_name}『${album.album_title}』の全曲解説を見る`}
        style={style}
      >
        <span className={styles.albumArt}>
          <SeriesArtwork album={album} variant="card" />
          <span className={styles.albumTint} aria-hidden="true" />
        </span>
        <span className={styles.albumCopy}>
          <span className={styles.albumTopline}>
            <span
              className={`status ${
                album.status === 'complete' ? 'status-complete' : 'status-in-progress'
              }`}
            >
              {albumStatus(album)}
            </span>
            <span className={`${styles.albumCount} mono`}>
              {album.published_count} / {album.episode_count} TRACKS
            </span>
          </span>
          <span className={styles.albumArtist}>{album.artist_name}</span>
          <span className={styles.albumTitle}>{album.album_title}</span>
          {meta && <span className={`${styles.albumMeta} mono`}>{meta}</span>}
          {album.editorial_theme && (
            <span className={styles.albumTheme}>{album.editorial_theme}</span>
          )}
        </span>
      </Link>
    </Reveal>
  );
}

export function HomePage() {
  const listen = useDialog();
  const heroRef = useRef<HTMLElement | null>(null);
  const albums = getAlbums();
  const currentAlbum = albums.find((album) => album.status === 'in_progress') ?? albums[0];
  const currentEpisodes = currentAlbum ? getEpisodes(currentAlbum.id) : [];
  const publishedCurrent = currentEpisodes.filter(isPublished);
  const latestCurrent = publishedCurrent[publishedCurrent.length - 1];
  const firstCurrent = publishedCurrent[0];
  const nextCurrent = currentEpisodes.find((episode) => !isPublished(episode));
  const latestEpisodes = getLatestEpisodes(5);
  const platforms = availablePlatforms();
  const progress = currentAlbum
    ? Math.round((currentAlbum.published_count / currentAlbum.episode_count) * 100)
    : 0;
  const accent = currentAlbum ? safeAccent(currentAlbum.accent) : null;
  const pageStyle = accent ? ({ '--album-accent': accent } as React.CSSProperties) : undefined;

  useEffect(() => {
    document.title = 'アルバム全曲解説｜アルバムを、曲順で読み解く。';
    const description =
      '海外アーティストの名盤を1話1曲、3〜5分で解説。曲の背景や意味をたどりながら、アルバム全体の物語を楽しむ音楽メディアです。';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, []);

  // HEROロードシーケンス — 1本のGSAPタイムライン。
  // reduced-motionではタイムラインを生成せず静的表示（DESIGN.md §23）。
  // JS無効・プリレンダー時も要素は最初から可視なので何も失われない（§31-9）。
  const seriesNumber = currentAlbum?.series_number ?? 1;
  useEffect(() => {
    const scope = heroRef.current;
    if (!scope) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      const q = (name: string) => scope.querySelectorAll(`[data-hero="${name}"]`);
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. アクセント面がワイプで開く（PC: 右から / SP: 上から）
      tl.from(isDesktop ? q('panel') : q('stage'), {
        clipPath: isDesktop ? 'inset(0 0 0 100%)' : 'inset(0 0 100% 0)',
        duration: 0.9,
        ease: 'power3.inOut',
      }, 0);
      // 2. ラベル（罫線の伸長はCSS側）
      tl.from(q('label'), { autoAlpha: 0, duration: 0.5 }, 0.2);
      // 3. 見出し3行：行マスクからのせり上がり
      tl.from(q('line'), { yPercent: 115, duration: 0.9, stagger: 0.07, ease: 'power4.out' }, 0.25);
      // 4. アートワーク：沈み込みから浮上して「置かれる」
      tl.from(q('art'), { y: 28, scale: 1.02, autoAlpha: 0, duration: 0.9 }, 0.35);
      // 5. リード・CTA
      tl.from(q('lead'), { y: 16, autoAlpha: 0, duration: 0.6 }, 0.55);
      tl.from(q('actions'), { y: 16, autoAlpha: 0, duration: 0.6 }, 0.63);
      // 6. シリーズ番号：スライドイン＋01→現番号のイージング付きカウント（§24の転用）
      const numEl = scope.querySelector<HTMLElement>('[data-hero="number"]');
      if (numEl) {
        const counter = { n: Math.min(1, seriesNumber) };
        tl.from(numEl, { x: 24, autoAlpha: 0, duration: 0.5 }, 0.7);
        tl.to(counter, {
          n: seriesNumber,
          duration: 0.8,
          ease: 'power2.inOut',
          snap: { n: 1 },
          onUpdate: () => {
            numEl.textContent = String(Math.round(counter.n)).padStart(2, '0');
          },
        }, 0.7);
      }
      // 7. NOW EXPLORINGストリップ：最後に下から差し込む
      tl.from(q('strip'), { clipPath: 'inset(100% 0 0 0)', y: 12, duration: 0.6, ease: 'power3.inOut' }, 0.95);
      // 8. 縦書き注記
      tl.from(q('side'), { autoAlpha: 0, duration: 0.5 }, 1.2);

      return () => tl.kill();
    });

    return () => mm.revert();
  }, [seriesNumber]);

  if (!currentAlbum) return null;

  const currentCta =
    currentAlbum.status === 'complete'
      ? '1曲目からたどる'
      : publishedCurrent.length > 1
        ? '最新の解説を聴く'
        : '1曲目から聴く';
  const currentCtaEpisode =
    currentAlbum.status === 'complete' || publishedCurrent.length === 1
      ? firstCurrent
      : latestCurrent;

  return (
    <div className={styles.page} style={pageStyle}>
      <div className={styles.grain} aria-hidden="true" />
      <a className={styles.skip} href="#main">
        本文へスキップ
      </a>

      <SiteHeader current="HOME" onOpenListen={listen.openDialog} />

      <main id="main" className={styles.main}>
        {/* HOME HERO — 案C「Immersive Liner」。右42%をアルバムアクセントの面として
            天地ブリードさせ、アートと NOW EXPLORING ストリップを載せる。SPはビジュアル先行。 */}
        <section ref={heroRef} className={styles.hero} aria-labelledby="home-title">
          <div className={styles.accentPanel} aria-hidden="true" data-hero="panel" />
          <p className={`${styles.sideNote} mono`} aria-hidden="true" data-hero="side">
            SERIES {pad2(currentAlbum.series_number)} — {currentAlbum.album_title.toUpperCase()}
            {currentAlbum.release_year ? `, ${currentAlbum.release_year}` : ''}
          </p>
          <div className={`${styles.heroInner} container`}>
            <div className={styles.heroCopy}>
              <p className={`${styles.ruleLabel} label`} data-hero="label">TRACK BY TRACK</p>
              {/* 文節単位の行マスク。改行位置を固定し「読み / 解く。」の分断を防ぐ */}
              <h1 className={styles.heroTitle} id="home-title">
                <span className={styles.mask}>
                  <span className={styles.hl} data-hero="line">アルバムを、</span>
                </span>
                <span className={styles.mask}>
                  <span className={`${styles.hl} ${styles.hl2}`} data-hero="line">曲順で</span>
                </span>
                <span className={styles.mask}>
                  <span className={`${styles.hl} ${styles.hl3}`} data-hero="line">読み解く。</span>
                </span>
              </h1>
              <p className={styles.heroLead} data-hero="lead">{HERO_COPY}</p>
              <div className={styles.heroActions} data-hero="actions">
                {latestCurrent && (
                  <Link className="btn btn-primary" to={episodePath(latestCurrent)}>
                    現在の解説を聴く
                    <span className="btn-glyph" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M2 1.5v9l8-4.5z" />
                      </svg>
                    </span>
                  </Link>
                )}
                <Link className="btn btn-secondary" to="/albums">
                  アルバムを選ぶ
                  <span className="btn-glyph" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className={styles.stageOuter}>
              <div className={styles.stage} data-hero="stage">
                <div className={styles.stageInner} data-hero="art">
                  <Link
                    className={styles.stageLink}
                    to={`/albums/${currentAlbum.id}`}
                    aria-label={`${currentAlbum.artist_name}『${currentAlbum.album_title}』の全曲解説を見る`}
                  >
                    <span className={`${styles.seriesNo} mono`} aria-hidden="true" data-hero="number">
                      {pad2(currentAlbum.series_number)}
                    </span>
                    <SeriesArtwork album={currentAlbum} priority />
                    <span className={styles.nowStrip} data-hero="strip">
                      <span className={styles.nowHead}>
                        <span className={`${styles.nowLabel} label`}>NOW EXPLORING</span>
                        <span className={styles.nowName}>
                          {currentAlbum.artist_name}『{currentAlbum.album_title}』
                        </span>
                      </span>
                      <span className={`${styles.nowMeta} mono`}>
                        {currentAlbum.published_count} / {currentAlbum.episode_count} TRACKS
                        {latestCurrent && (
                          <b>{pad2(latestCurrent.track_number)}. {latestCurrent.track_title}</b>
                        )}
                      </span>
                      <span className={`${styles.nowGo} mono`} aria-hidden="true">→</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.statement} container`} aria-labelledby="why-albums">
          <Reveal>
            <div className={styles.sectionRule}>
              <p className="label">WHY ALBUMS?</p>
            </div>
            <h2 className={styles.statementTitle} id="why-albums">曲順には、意味がある。</h2>
            <p className={styles.statementLead}>
              プレイリストでは、曲は次々に流れていく。けれどアルバムには、始まりがあり、展開があり、終わりがあります。
            </p>
            <div className={styles.statementBody}>
              <p>「アルバム全曲解説」は、一曲ずつ背景や意味を読み解きながら、一枚の作品を最後まで味わうための音楽メディアです。</p>
              <p>知っている曲から入ってもいい。気になるアルバムから始めてもいい。前後の曲へ進むうちに、これまでとは違う作品の輪郭が見えてきます。</p>
            </div>
            <ul className={styles.keywords} aria-label="解説の視点">
              {['CONTEXT', 'CULTURE', 'SOUND', 'SEQUENCE'].map((keyword) => (
                <li key={keyword} className="label">{keyword}</li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section className={styles.current} aria-labelledby="current-album-title">
          <div className={`${styles.currentInner} container`}>
            <Reveal className={styles.currentArt}>
              <SeriesArtwork album={currentAlbum} />
            </Reveal>
            <Reveal className={styles.currentCopy}>
              <p className={`${styles.currentLabel} label`}>NOW EXPLORING</p>
              <h2 className={styles.currentHeading} id="current-album-title">いま、読み解いているアルバム</h2>
              <p className={styles.currentArtist}>{currentAlbum.artist_name}</p>
              <p className={styles.currentTitle}>{currentAlbum.album_title}</p>
              <p className={`${styles.currentMeta} mono`}>
                {[currentAlbum.release_year, currentAlbum.genre].filter(Boolean).join(' / ')}
              </p>
              {currentAlbum.editorial_theme && (
                <p className={styles.currentTheme}>{currentAlbum.editorial_theme}</p>
              )}
              <div className={styles.progressHead}>
                <p className={`${styles.progressCount} mono`}>
                  {currentAlbum.status === 'complete'
                    ? `COMPLETE — ${currentAlbum.episode_count} TRACKS`
                    : `${currentAlbum.published_count} / ${currentAlbum.episode_count} TRACKS PUBLISHED`}
                </p>
                <p className={`${styles.progressPercent} mono`}>{progress}%</p>
              </div>
              <progress
                className={styles.progress}
                value={currentAlbum.published_count}
                max={currentAlbum.episode_count}
                aria-label={`${currentAlbum.episode_count}曲中${currentAlbum.published_count}曲を公開済み`}
              />
              {nextCurrent && (
                <p className={styles.nextTrack}>
                  次の解説は、トラック{nextCurrent.track_number}「{nextCurrent.track_title}」。
                </p>
              )}
              {latestCurrent && (
                <div className={styles.latestCurrent}>
                  <span className={`${styles.latestNumber} mono`}>{pad2(latestCurrent.track_number)}</span>
                  <span>
                    <span className={styles.latestTrack}>{latestCurrent.track_title}</span>
                    {latestCurrent.title && <span className={styles.latestTitle}>{latestCurrent.title}</span>}
                  </span>
                </div>
              )}
              <div className={styles.currentActions}>
                {currentCtaEpisode && (
                  <Link className="btn btn-inverse" to={episodePath(currentCtaEpisode)}>
                    {currentCta}
                    <span className="btn-glyph" aria-hidden="true">→</span>
                  </Link>
                )}
                <Link className={styles.currentTextLink} to={`/albums/${currentAlbum.id}`}>
                  アルバム全体を見る <span aria-hidden="true">→</span>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section className={`${styles.archive} container`} aria-labelledby="archive-title" id="album-archive">
          <Reveal>
            <div className={styles.sectionRule}>
              <p className="label">ALBUM ARCHIVE</p>
            </div>
            <div className={`${styles.sectionHeadingRow} grid`}>
              <h2 id="archive-title">一枚を選んで、<br />曲順にたどる。</h2>
              <p>異なる時代、言語、ジャンルから選んだアルバムを、一曲ずつ解説しています。</p>
            </div>
          </Reveal>
          <ul className={styles.albumGrid}>
            {albums.map((album, index) => <AlbumCard key={album.id} album={album} index={index} />)}
          </ul>
          <Link className="btn btn-secondary" to="/albums">
            すべてのアルバムを見る
            <span className="btn-glyph" aria-hidden="true">→</span>
          </Link>
        </section>

        <section className={`${styles.how} container`} aria-labelledby="how-title">
          <Reveal>
            <div className={styles.sectionRule}><p className="label">HOW TO LISTEN</p></div>
            <h2 id="how-title">一曲から、一枚へ。</h2>
          </Reveal>
          <ol className={styles.steps}>
            {[
              ['気になるアルバムを選ぶ', '好きなアーティスト、知っている曲、惹かれたアートワーク。入口はどこからでも構いません。'],
              ['曲順に沿って解説を聴く', '1話3〜5分。制作背景や音の特徴、アルバムの中で担う役割を紹介します。'],
              ['アルバムを聴き直す', '解説を手がかりに、実際の作品を最初から。曲と曲のつながりを味わってください。'],
            ].map(([heading, body], index) => (
              <Reveal as="li" index={index} className={styles.step} key={heading}>
                <span className={`${styles.stepNumber} mono`}>{pad2(index + 1)}</span>
                <h3>{heading}</h3>
                <p>{body}</p>
              </Reveal>
            ))}
          </ol>
          <Link className="btn btn-primary" to="/albums">
            アルバムを選ぶ <span className="btn-glyph" aria-hidden="true">→</span>
          </Link>
        </section>

        <section className={`${styles.latest} container`} aria-labelledby="latest-title">
          <Reveal>
            <div className={styles.sectionRule}><p className="label">RECENT EPISODES</p></div>
            <h2 id="latest-title">新しく公開した解説</h2>
          </Reveal>
          {latestEpisodes.length > 0 ? (
            <ol className={styles.episodeList}>
              {latestEpisodes.map((episode, index) => {
                const album = getAlbum(episode.album_id);
                return (
                  <Reveal as="li" index={index} className={styles.episodeItem} key={episode.id}>
                    <Link className={styles.episodeLink} to={episodePath(episode)}>
                      <span className={styles.episodeMeta}>
                        {episode.published && <span className="mono">{formatPublished(episode.published)}</span>}
                        {album && <span>{album.artist_name} / {album.album_title}</span>}
                      </span>
                      <span className={`${styles.episodeNumber} mono`}>{pad2(episode.track_number)}</span>
                      <span className={styles.episodeCopy}>
                        <span className={styles.episodeTrack}>{episode.track_title}</span>
                        {episode.title && <span className={styles.episodeTitle}>{episode.title}</span>}
                      </span>
                      {episode.duration && <span className={`${styles.episodeDuration} mono`}>{episode.duration}</span>}
                      <span className={styles.episodeCta}>この解説を聴く <span aria-hidden="true">→</span></span>
                    </Link>
                  </Reveal>
                );
              })}
            </ol>
          ) : (
            <p className={styles.empty}>最初のエピソードを準備しています。公開まで、もう少しお待ちください。</p>
          )}
        </section>

        <section className={`${styles.approach} container`} aria-labelledby="approach-title">
          <Reveal>
            <div className={styles.sectionRule}><p className="label">OUR APPROACH</p></div>
            <div className={`${styles.approachGrid} grid`}>
              <h2 id="approach-title">調べて、考えて、<br />独自の言葉で。</h2>
              <div className={styles.approachCopy}>
                <p>制作背景や文化的な文脈、音楽的な特徴を調査し、その曲がアルバムの中で果たす役割を考えます。歌詞の朗読や逐語訳ではなく、作品をもう一度聴きたくなる入口をつくります。</p>
                <p className={styles.approachNote}>調査・構成・編集した独自の解説原稿を、AIナレーションを使用して音声化しています。</p>
                <Link className="textlink" to="/about">番組のつくり方を知る <span className="btn-glyph" aria-hidden="true">→</span></Link>
              </div>
            </div>
          </Reveal>
        </section>

        {platforms.length > 0 && (
          <section className={`${styles.platform} container`} aria-labelledby="platform-title">
            <Reveal>
              <div className={styles.platformHeading}>
                <h2 id="platform-title">いつものアプリで、<br />アルバムの続きを。</h2>
                <p>番組をフォローすると、新しい解説が公開されたときにすぐ聴けます。</p>
              </div>
              <div className={styles.platformLinks}>
                {platforms.map((platform) => (
                  <a
                    key={platform.key}
                    href={platform.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${platform.label}（新しいタブで開きます）`}
                  >
                    {platform.badge ? (
                      <img
                        src={sitePath(platform.badge.src)}
                        alt={platform.label}
                        width={180}
                        height={54}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : platform.label}
                  </a>
                ))}
              </div>
            </Reveal>
          </section>
        )}

        <section className={styles.request} aria-labelledby="request-title">
          <Reveal className={`${styles.requestInner} container`}>
            <p className="label">YOUR NEXT ALBUM</p>
            <span className={`${styles.requestNumber} mono`} aria-hidden="true">?</span>
            <h2 id="request-title">次に読み解いてほしい一枚は？</h2>
            <p>あなたが何度も聴いてきたアルバム、もっと背景を知りたい作品を教えてください。今後のシリーズ選定の参考にします。</p>
            <Link className="btn btn-primary" to="/request">
              アルバムをリクエストする <span className="btn-glyph" aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
      <ListenPlatformSheet
        open={listen.open}
        onClose={listen.closeDialog}
        panelRef={listen.panelRef}
      />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: site.site_name,
            description: HERO_COPY,
            inLanguage: 'ja',
          }),
        }}
      />
    </div>
  );
}
