import { useId, useState } from 'react';
import type { Episode } from '../data/types';
import { formatPublished, isPublished, pad2 } from '../data';
import { setLastTrack } from '../data/progress';
import { ExternalIcon } from './icons';
import styles from './TrackJourney.module.css';

interface Props {
  episode: Episode;
  isCurrent: boolean;
  isLatest: boolean;
  onOpenListen: (event: { currentTarget: EventTarget | null }) => void;
}

export function TrackRow({ episode, isCurrent, isLatest, onOpenListen }: Props) {
  const [expanded, setExpanded] = useState(false);
  const summaryId = useId();
  const published = isPublished(episode);
  const publishedDate = formatPublished(episode.published);

  return (
    <li
      className={[
        styles.row,
        isCurrent ? styles.rowCurrent : '',
        published ? '' : styles.rowUpcoming,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`track-${pad2(episode.track_number)}`}
      data-track-number={episode.track_number}
    >
      <span className={`${styles.number} mono`} aria-hidden="true">
        {pad2(episode.track_number)}
      </span>

      <div className={styles.main}>
        <div className={styles.titleLine}>
          {/* Track number is announced here since the big numeral is decorative. */}
          <h3 className={styles.trackTitle}>
            <span className="visually-hidden">トラック{episode.track_number}　</span>
            {episode.track_title}
          </h3>

          {isLatest && published && <span className="status status-latest">Latest</span>}
          {!published && <span className="status status-upcoming">Upcoming</span>}
        </div>

        {published ? (
          <>
            {episode.title && <p className={styles.episodeTitle}>{episode.title}</p>}

            {episode.web_summary && (
              <>
                <button
                  type="button"
                  className={styles.toggle}
                  aria-expanded={expanded}
                  aria-controls={summaryId}
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? '要約を閉じる' : '要約を読む'}
                  <span className={styles.toggleGlyph} aria-hidden="true">
                    {expanded ? '−' : '＋'}
                  </span>
                </button>

                <div className={styles.summaryWrap} id={summaryId} data-expanded={expanded}>
                  <div className={styles.summaryInner}>
                    <p className={styles.summary}>{episode.web_summary}</p>
                    {(episode.duration || publishedDate) && (
                      <p className={`${styles.episodeMeta} mono`}>
                        {episode.duration}
                        {episode.duration && publishedDate && (
                          <span className={styles.metaSep} aria-hidden="true">
                            ／
                          </span>
                        )}
                        {publishedDate}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          /* Unpublished rows carry no summary or key points — CONTENTS.md §16. */
          <p className={styles.upcomingNote}>
            公開予定です。解説の公開後に、要約と解説タイトルを掲載します。
          </p>
        )}
      </div>

      <div className={styles.actions}>
        {published ? (
          <>
            {/* Internal: goes to EPISODE DETAIL. */}
            <a
              className="textlink"
              href={`#track-${pad2(episode.track_number)}`}
              onClick={() => {
                setExpanded(true);
                setLastTrack(episode.album_id, episode.track_number);
              }}
            >
              解説を見る
              <span className="btn-glyph" aria-hidden="true">
                →
              </span>
              <span className="visually-hidden">（{episode.track_title}）</span>
            </a>

            {/* External: opens the platform picker. Wording *and* icon both say so. */}
            <button type="button" className="textlink textlink-quiet" onClick={onOpenListen}>
              配信アプリで聴く
              <ExternalIcon size={13} />
              <span className="visually-hidden">（{episode.track_title}／配信サービスを選択）</span>
            </button>
          </>
        ) : (
          <span className={`${styles.notPublished} mono`}>Not published</span>
        )}
      </div>
    </li>
  );
}
