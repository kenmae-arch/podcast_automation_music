import { useEffect } from 'react';
import { Link } from 'react-router-dom';
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
        <section className={`${styles.hero} container`} aria-labelledby="home-title">
          <div className={`${styles.heroGrid} grid`}>
            <div className={styles.heroCopy}>
              <p className="label">TRACK BY TRACK</p>
              <h1 className={styles.heroTitle} id="home-title">
                アルバムを、
                <br />
                曲順で読み解く。
              </h1>
              <p className={styles.heroLead}>{HERO_COPY}</p>
              <div className={styles.heroActions}>
                {latestCurrent && (
                  <Link className="btn btn-primary" to={episodePath(latestCurrent)}>
                    現在の解説を聴く
                    <span className="btn-glyph" aria-hidden="true">→</span>
                  </Link>
                )}
                <Link className="btn btn-secondary" to="/albums">
                  アルバムを選ぶ
                  <span className="btn-glyph" aria-hidden="true">→</span>
                </Link>
              </div>
              <p className={`${styles.heroNote} mono`}>
                ONE ALBUM / ONE TRACK / ONE STORY AT A TIME
              </p>
            </div>

            <div className={styles.heroVisual}>
              <span className={`${styles.heroNumber} mono`} aria-hidden="true">
                {pad2(currentAlbum.series_number)}
              </span>
              <SeriesArtwork album={currentAlbum} priority />
              <span className={`${styles.heroTrack} mono`} aria-hidden="true">
                {pad2(latestCurrent?.track_number ?? 1)}
              </span>
            </div>
          </div>
          <div className={styles.scrollCue} aria-hidden="true">
            <span />
            <span className="label">SCROLL TO EXPLORE</span>
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
                  <span className="status status-latest">LATEST</span>
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
            <div className={styles.sectionRule}><p className="label">LATEST EPISODES</p></div>
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
                      <img src={sitePath(platform.badge.src)} alt={platform.label} />
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
