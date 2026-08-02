import type { Album, Episode } from '../data/types';
import { pad2 } from '../data';
import { SeriesArtwork } from './SeriesArtwork';
import { ExternalIcon } from './icons';
import styles from './AlbumHero.module.css';

interface Props {
  album: Album;
  firstEpisode: Episode | undefined;
  /** Device-local resume point, or null when there is none — CONTENTS.md §14. */
  resumeTrack: number | null;
  onOpenListen: (event: { currentTarget: EventTarget | null }) => void;
}

export function AlbumHero({ album, firstEpisode, resumeTrack, onOpenListen }: Props) {
  // Absent metadata is dropped, never shown as「不明」— CONTENTS.md §38.
  const meta = [album.release_year, album.genre, album.language, album.country].filter(Boolean);

  const complete = album.status === 'complete';
  const primaryHref = firstEpisode ? `#track-${pad2(firstEpisode.track_number)}` : '#tracks';

  return (
    <section className={styles.hero} aria-labelledby="album-title">
      {/* Decorative ground number — DESIGN.md §15, hidden from assistive tech. */}
      <span className={`${styles.ghost} mono`} aria-hidden="true">
        {pad2(album.series_number)}
      </span>

      <div className={`${styles.inner} container grid`}>
        <div className={styles.text}>
          <p className={styles.seriesLabel}>
            <span className="label">Album {pad2(album.series_number)}</span>
            <span className={styles.seriesRule} aria-hidden="true" />
          </p>

          <p className={styles.artist}>{album.artist_name}</p>
          <h1 className={styles.title} id="album-title">
            {album.album_title}
          </h1>

          {meta.length > 0 && (
            <p className={styles.meta}>
              {meta.map((value, i) => (
                <span key={String(value)}>
                  {i > 0 && <span className={styles.metaSep} aria-hidden="true">／</span>}
                  <span className={typeof value === 'number' ? 'mono' : undefined}>{value}</span>
                </span>
              ))}
            </p>
          )}

          {album.editorial_theme && (
            <p className={styles.concept}>{album.editorial_theme}</p>
          )}

          {/* Progress — a position on a thin rule, not a heavy bar (DESIGN.md §13). */}
          <div className={styles.progressBlock}>
            <div className={styles.progressHead}>
              <span className={`status ${complete ? 'status-complete' : 'status-in-progress'}`}>
                {complete ? 'Complete' : 'In progress'}
              </span>
              <span className={`${styles.progressCount} mono`}>
                {complete
                  ? `COMPLETE — ${album.episode_count} TRACKS`
                  : `${album.published_count} / ${album.episode_count} TRACKS PUBLISHED`}
              </span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={album.episode_count}
              aria-valuenow={album.published_count}
              aria-label={`全${album.episode_count}曲中${album.published_count}曲を公開済み`}
            >
              <span
                className={styles.progressFill}
                style={{ width: `${(album.published_count / album.episode_count) * 100}%` }}
              />
              <span
                className={styles.progressDot}
                style={{ left: `${(album.published_count / album.episode_count) * 100}%` }}
              />
            </div>
          </div>

          {/* At most two CTAs; the three services stay behind the sheet — DESIGN.md §15. */}
          <div className={styles.ctas}>
            <a className="btn btn-primary" href={primaryHref}>
              {resumeTrack ? '続きからたどる' : '1曲目からたどる'}
              <span className="btn-glyph" aria-hidden="true">
                →
              </span>
            </a>
            <button type="button" className="btn btn-secondary" onClick={onOpenListen}>
              いつものアプリで聴く
              <ExternalIcon size={15} />
            </button>
          </div>
        </div>

        <div className={styles.art}>
          <SeriesArtwork album={album} priority />
        </div>
      </div>
    </section>
  );
}
