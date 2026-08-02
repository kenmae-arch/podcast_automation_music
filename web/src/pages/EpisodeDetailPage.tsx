import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import {
  formatPublished,
  getAlbum,
  getEpisode,
  getEpisodes,
  isPublished,
  pad2,
  safeAccent,
  site,
  sitePath,
} from '../data';
import { ExternalIcon } from '../components/icons';
import { AppleMusicPreview } from '../components/AppleMusicPreview';
import { ListenPlatformSheet } from '../components/ListenPlatformSheet';
import { SeriesArtwork } from '../components/SeriesArtwork';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useDialog } from '../hooks/useDialog';
import styles from './EpisodeDetailPage.module.css';

interface Props {
  episodeId: string;
}

export function EpisodeDetailPage({ episodeId }: Props) {
  const episode = getEpisode(episodeId);
  const album = episode ? getAlbum(episode.album_id) : undefined;
  const listen = useDialog();

  useEffect(() => {
    if (!episode || !album || !isPublished(episode)) return;
    const heading = episode.title ?? episode.track_title;
    document.title = `${heading} — ${episode.track_title}｜${site.site_name}`;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', episode.web_summary ?? site.description);
  }, [album, episode]);

  if (!episode || !album || !isPublished(episode)) {
    return (
      <main className={`${styles.notFound} container`}>
        <h1>このエピソードは見つかりませんでした。</h1>
        <p>URLが変更されたか、まだ公開されていない可能性があります。</p>
        <a className="btn btn-primary" href={sitePath('/albums/barrio-fino')}>
          アルバムへ戻る
          <span className="btn-glyph" aria-hidden="true">→</span>
        </a>
      </main>
    );
  }

  const accent = safeAccent(album.accent);
  const themeStyle = accent ? ({ '--album-accent': accent } as CSSProperties) : undefined;
  const publishedDate = formatPublished(episode.published);
  const albumEpisodes = getEpisodes(album.id).filter(isPublished);
  const episodeIndex = albumEpisodes.findIndex((item) => item.id === episode.id);
  const previous = episodeIndex > 0 ? albumEpisodes[episodeIndex - 1] : undefined;
  const next = episodeIndex >= 0 ? albumEpisodes[episodeIndex + 1] : undefined;
  const heading = episode.title ?? episode.track_title;
  const openEpisodeListen = (event: { currentTarget: EventTarget | null }) => {
    listen.openDialog(event);
  };

  return (
    <div className={styles.page} style={themeStyle}>
      <div className={styles.grain} aria-hidden="true" />

      <a className={styles.skip} href="#main">本文へスキップ</a>
      <SiteHeader current="ALBUMS" onOpenListen={listen.openDialog} />

      <main id="main" className={styles.main}>
        <article>
          <header className={`${styles.hero} container`}>
            <a className={`textlink ${styles.back}`} href={sitePath(`/albums/${album.id}`)}>
              <span className="btn-glyph" aria-hidden="true">←</span>
              {album.album_title} 全曲解説へ
            </a>

            <div className={`${styles.heroGrid} grid`}>
              <div className={styles.copy}>
                <p className={`${styles.eyebrow} label`}>
                  {episode.episode_number && `Episode ${pad2(episode.episode_number)}`}
                  {episode.episode_number && <span aria-hidden="true"> ／ </span>}
                  Track {pad2(episode.track_number)}
                </p>
                <p className={styles.albumLine}>{album.artist_name}『{album.album_title}』</p>
                <h1 className={styles.title}>{heading}</h1>
                {episode.title && <p className={styles.trackTitle}>“{episode.track_title}”</p>}

                {(publishedDate || episode.duration) && (
                  <p className={`${styles.meta} mono`}>
                    {publishedDate}
                    {publishedDate && episode.duration && <span aria-hidden="true"> ／ </span>}
                    {episode.duration}
                  </p>
                )}

                {episode.web_summary && <p className={styles.lead}>{episode.web_summary}</p>}

                <div className={styles.preview}>
                  <AppleMusicPreview episode={episode} />
                </div>

                <button type="button" className="btn btn-primary" onClick={openEpisodeListen}>
                  配信アプリで聴く
                  <ExternalIcon size={15} />
                </button>
              </div>

              <div className={styles.art}>
                <SeriesArtwork album={album} variant="card" priority />
              </div>
            </div>
          </header>

          {episode.key_points.length > 0 && (
            <section className={`${styles.section} container`} aria-labelledby="key-points-title">
              <div className="grid">
                <div className={styles.sectionHead}>
                  <p className="label">Listening notes</p>
                  <h2 id="key-points-title">今回の聴きどころ</h2>
                </div>
                <ol className={styles.keyPoints}>
                  {episode.key_points.map((point, index) => (
                    <li key={point.heading} className={styles.keyPoint}>
                      <span className={`${styles.keyNumber} mono`} aria-hidden="true">
                        {pad2(index + 1)}
                      </span>
                      <div>
                        <h3>{point.heading}</h3>
                        <p>{point.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}

          {episode.album_role && (
            <section className={`${styles.roleSection} container`} aria-labelledby="album-role-title">
              <div className="grid">
                <div className={styles.roleHead}>
                  <p className="label">In the album</p>
                  <h2 id="album-role-title">アルバムの中で</h2>
                </div>
                <p className={styles.roleBody}>{episode.album_role}</p>
              </div>
            </section>
          )}

          <nav className={`${styles.episodeNav} container`} aria-label="前後のエピソード">
            <p className="label">Keep following the sequence</p>
            <div className={styles.episodeNavGrid}>
              {previous && (
                <a className={styles.episodeLink} href={sitePath(`/episodes/${previous.id}`)}>
                  <span className="label">← Previous · Track {pad2(previous.track_number)}</span>
                  <strong>{previous.track_title}</strong>
                  {previous.title && <span>{previous.title}</span>}
                </a>
              )}
              {next && (
                <a className={`${styles.episodeLink} ${styles.next}`} href={sitePath(`/episodes/${next.id}`)}>
                  <span className="label">Next · Track {pad2(next.track_number)} →</span>
                  <strong>{next.track_title}</strong>
                  {next.title && <span>{next.title}</span>}
                </a>
              )}
            </div>
          </nav>
        </article>
      </main>

      <SiteFooter />
      <ListenPlatformSheet
        open={listen.open}
        onClose={listen.closeDialog}
        panelRef={listen.panelRef}
        directUrls={episode.podcast_urls}
        episodeTitle={episode.track_title}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'PodcastEpisode',
            name: heading,
            description: episode.web_summary,
            episodeNumber: episode.episode_number,
            datePublished: episode.published,
            associatedMedia: episode.audio_file
              ? { '@type': 'MediaObject', contentUrl: sitePath(`/${episode.audio_file}`) }
              : undefined,
            partOfSeries: { '@type': 'PodcastSeries', name: site.site_name },
          }),
        }}
      />
    </div>
  );
}
