import type { Album } from '../data/types';
import { pad2 } from '../data';
import styles from './StickyAlbumBar.module.css';

interface Props {
  album: Album;
  current: number;
  /** False while the track list is off screen, where a position would mislead. */
  showTrack: boolean;
  visible: boolean;
}

/**
 * Small sticky context strip shown once the hero has scrolled away —
 * DESIGN.md §15「スクロール後」. Sits directly below the global header and never
 * overlaps it. This is the only fixed element on the page: there is no player.
 */
export function StickyAlbumBar({ album, current, showTrack, visible }: Props) {
  return (
    <div className={`${styles.bar} ${visible ? styles.visible : ''}`} aria-hidden={!visible}>
      <div className={`${styles.inner} container`}>
        <span className={styles.album}>{album.album_title}</span>
        <span className={styles.artist}>{album.artist_name}</span>
        {showTrack && (
          <span className={`${styles.track} mono`}>
            TRACK {pad2(current)} / {album.episode_count}
          </span>
        )}
      </div>
    </div>
  );
}
