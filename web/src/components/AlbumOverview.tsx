import type { Album } from '../data/types';
import { pad2 } from '../data';
import { Reveal } from './Reveal';
import styles from './AlbumOverview.module.css';

interface Props {
  album: Album;
}

export function AlbumOverview({ album }: Props) {
  // CONTENTS.md §15 order. Missing entries drop out rather than render empty.
  const blocks = [
    { key: 'introduction', body: album.introduction },
    { key: 'cultural_context', body: album.cultural_context },
    { key: 'selection_reason', body: album.selection_reason },
  ].filter((b): b is { key: string; body: string } => Boolean(b.body));

  const points = album.listening_points.slice(0, 3);

  if (!blocks.length && !points.length) return null;

  return (
    <section className={styles.section} aria-labelledby="overview-title">
      <div className={`${styles.head} container grid`}>
        <div className={styles.headText}>
          <p className="label">About this album</p>
          <h2 className={styles.title} id="overview-title">
            この一枚を
            <br />
            読み解く。
          </h2>
        </div>

        <div className={styles.body}>
          {blocks.map((block, i) => (
            <Reveal key={block.key} index={i}>
              <p className={styles.paragraph}>{block.body}</p>
            </Reveal>
          ))}
        </div>
      </div>

      {points.length > 0 && (
        <div className={`${styles.listening} container grid`}>
          <div className={styles.listeningHead}>
            <p className="label">Before listening</p>
            <h3 className={styles.listeningTitle}>
              聴く前に
              <br />
              知っておきたいこと
            </h3>
          </div>

          {/*
            A numbered vertical list rather than three equal columns — the brief
            rules out repeating even 3-up grids, and DESIGN.md §17 asks for
            numbered rows separated by rules instead of cards.
          */}
          <ol className={styles.points}>
            {points.map((point, i) => (
              <Reveal as="li" key={point.heading} index={i} className={styles.point}>
                <span className={`${styles.pointNumber} mono`} aria-hidden="true">
                  {pad2(i + 1)}
                </span>
                <div className={styles.pointBody}>
                  <h4 className={styles.pointHeading}>{point.heading}</h4>
                  {/* Interpretation is flagged, per CONTENTS.md §15. */}
                  {point.kind === 'reading' && (
                    <span className={styles.pointKind}>このシリーズの読み</span>
                  )}
                  <p className={styles.pointText}>{point.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
