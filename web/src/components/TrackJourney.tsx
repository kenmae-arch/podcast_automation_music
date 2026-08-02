import type { Album, Episode } from '../data/types';
import { pad2 } from '../data';
import { TrackRow } from './TrackRow';
import { AppleMusicPreview } from './AppleMusicPreview';
import styles from './TrackJourney.module.css';

interface Props {
  album: Album;
  episodes: Episode[];
  /** Owned by the page so the sticky album bar can read the same value. */
  current: number;
  onOpenListen: (episode: Episode, event: { currentTarget: EventTarget | null }) => void;
}

export function TrackJourney({ album, episodes, current, onOpenListen }: Props) {
  const currentEpisode = episodes.find((e) => e.track_number === current);
  const total = album.episode_count;

  return (
    <section className={styles.section} id="tracks" aria-labelledby="journey-title">
      <div className={`${styles.head} container grid`}>
        <div className={styles.headText}>
          <p className="label">Track journey</p>
          <h2 className={styles.title} id="journey-title">
            曲順にたどる。
          </h2>
        </div>
        <p className={styles.intro}>
          気になる曲からでも、1曲目からでも。前後のつながりを意識しながら進んでみてください。
        </p>
      </div>

      <div className={`${styles.body} container grid`}>
        {/*
          Sticky position indicator — DESIGN.md §16. Decorative numeral is hidden
          from assistive tech; the text below it carries the same information.
        */}
        <div className={styles.indicatorColumn}>
          <div className={styles.indicator}>
            <p className={`${styles.nowReading} label`}>Now reading</p>
            <p className={`${styles.bigNumber} mono`} aria-hidden="true">
              {pad2(current)}
            </p>
            <p className={`${styles.trackCount} mono`}>
              TRACK {pad2(current)} / {total}
            </p>
            {currentEpisode && <p className={styles.currentTitle}>{currentEpisode.track_title}</p>}
            <div className={styles.indicatorTrack} aria-hidden="true">
              <span
                className={styles.indicatorFill}
                style={{ width: `${(current / total) * 100}%` }}
              />
            </div>
            <p className={styles.indicatorNote}>
              全{total}曲中、第{current}曲を表示中
            </p>
            {currentEpisode && <AppleMusicPreview episode={currentEpisode} compact />}
          </div>
        </div>

        <ol className={styles.list}>
          {episodes.map((episode) => (
            <TrackRow
              key={episode.id}
              episode={episode}
              isCurrent={episode.track_number === current}
              onOpenListen={(event) => onOpenListen(episode, event)}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
