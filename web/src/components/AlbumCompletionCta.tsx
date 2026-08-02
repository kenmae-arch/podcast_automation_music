import type { Album, Episode } from '../data/types';
import { pad2 } from '../data';
import styles from './AlbumCompletionCta.module.css';

interface Props {
  album: Album;
  firstEpisode: Episode | undefined;
}

/** CONTENTS.md §17. Copy switches on album status; nothing else changes. */
export function AlbumCompletionCta({ album, firstEpisode }: Props) {
  const complete = album.status === 'complete';
  const href = firstEpisode ? `#track-${pad2(firstEpisode.track_number)}` : '#tracks';

  const heading = complete ? '最初の曲から、もう一度。' : '公開済みの曲を、続けて聴く。';
  const body = complete
    ? `全${album.episode_count}話を曲順にたどると、このアルバムの景色はどう変わるでしょうか。`
    : `現在、第${album.published_count}曲まで公開しています。新しい解説は順次追加されます。`;
  const cta = complete
    ? `全${album.episode_count}話を1曲目からたどる`
    : `公開済みの${album.published_count}話をたどる`;

  return (
    <section className={styles.section} aria-labelledby="completion-title">
      <div className={`${styles.inner} container grid`}>
        <h2 className={styles.heading} id="completion-title">
          {heading}
        </h2>
        <div className={styles.side}>
          <p className={styles.body}>{body}</p>
          <a className="btn btn-inverse" href={href}>
            {cta}
            <span className="btn-glyph" aria-hidden="true">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
