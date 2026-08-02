import type { Album } from '../data/types';
import { pad2, sitePath } from '../data';
import styles from './SeriesArtwork.module.css';

interface Props {
  album: Album;
  /** `hero` is the album's own 1:1 art; `card` is the smaller related-album tile. */
  variant?: 'hero' | 'card';
  priority?: boolean;
}

/**
 * Series artwork, always 1:1 and never cropped — DESIGN.md §8.
 *
 * When `original_artwork` is absent this renders the brand fallback the spec
 * prescribes (paper ground, large series number, artist, album, one accent
 * rule) rather than a generated image. In production the real RSS artwork is
 * dropped into `original_artwork`; see docs/DATA-HANDOFF.md.
 */
export function SeriesArtwork({ album, variant = 'hero', priority = false }: Props) {
  const className = `${styles.frame} ${variant === 'card' ? styles.card : styles.hero}`;

  if (album.original_artwork) {
    return (
      <img
        className={className}
        src={sitePath(album.original_artwork.src)}
        alt={album.original_artwork.alt}
        width={1000}
        height={1000}
        loading={priority ? 'eager' : 'lazy'}
        // Reserves the square up front so nothing shifts — DESIGN.md §24.
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
      />
    );
  }

  return (
    <div
      className={className}
      role="img"
      aria-label={`${album.artist_name}『${album.album_title}』全曲解説シリーズのアートワーク`}
    >
      <span className={`${styles.slot} label`}>Album {pad2(album.series_number)}</span>
      <span className={`${styles.number} mono`} aria-hidden="true">
        {pad2(album.series_number)}
      </span>
      <span className={styles.slot}>
        <span className={styles.accentRule} />
        <span className={styles.artist}>{album.artist_name}</span>
        <span className={styles.title}>{album.album_title}</span>
      </span>
    </div>
  );
}
