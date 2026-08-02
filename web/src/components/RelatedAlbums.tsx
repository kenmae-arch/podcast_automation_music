import type { Album } from '../data/types';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { SeriesArtwork } from './SeriesArtwork';
import styles from './RelatedAlbums.module.css';

interface Props {
  albums: Album[];
}

/** CONTENTS.md §18 — up to three, and the relation reason is always shown. */
export function RelatedAlbums({ albums }: Props) {
  if (!albums.length) return null;

  return (
    <section className={`${styles.section} container`} aria-labelledby="related-title">
      <div className={styles.head}>
        <p className="label">Keep digging</p>
        <h2 className={styles.title} id="related-title">
          次にたどるアルバム
        </h2>
      </div>

      <ul className={styles.grid}>
        {albums.slice(0, 3).map((album, i) => (
          <Reveal as="li" key={album.id} index={i} className={styles.card}>
            <article>
              {album.related_reason && <p className={styles.reason}>{album.related_reason}</p>}

              <SeriesArtwork album={album} variant="card" />

              <p className={styles.artist}>{album.artist_name}</p>
              <h3 className={styles.albumTitle}>{album.album_title}</h3>

              <Link className={`textlink ${styles.cardLink}`} to={`/albums/${album.id}`}>
                全曲解説を見る
                <span className="btn-glyph" aria-hidden="true">
                  →
                </span>
                {/* Accessible name spelled out per CONTENTS.md §6. */}
                <span className="visually-hidden">
                  （{album.artist_name}『{album.album_title}』）
                </span>
              </Link>
            </article>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
