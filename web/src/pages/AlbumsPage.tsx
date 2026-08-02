import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ListenPlatformSheet } from '../components/ListenPlatformSheet';
import { Reveal } from '../components/Reveal';
import { SeriesArtwork } from '../components/SeriesArtwork';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getAlbums, pad2, safeAccent, site } from '../data';
import type { Album } from '../data/types';
import { useDialog } from '../hooks/useDialog';
import styles from './AlbumsPage.module.css';

const PAGE_DESCRIPTION =
  '一曲ずつたどりながら、作品がどこから始まり、どこへ向かうのかを読み解きます。';

function AlbumArchiveCard({ album, index }: { album: Album; index: number }) {
  const accent = safeAccent(album.accent);
  const themeStyle = accent
    ? ({ '--album-accent': accent } as React.CSSProperties)
    : undefined;
  const metadata = [
    album.release_year,
    album.genre,
    album.language,
  ].filter((value): value is string | number => Boolean(value));

  return (
    <Reveal as="li" index={index} className={styles.item}>
      <Link
        className={styles.card}
        to={`/albums/${album.id}`}
        aria-label={`${album.artist_name}『${album.album_title}』の全曲解説を見る`}
        style={themeStyle}
      >
        <span className={styles.artwork}>
          <SeriesArtwork album={album} variant="card" />
          <span className={styles.tint} aria-hidden="true" />
          <span className={`${styles.series} mono`} aria-hidden="true">
            {pad2(album.series_number)}
          </span>
        </span>

        <span className={styles.copy}>
          <span className={styles.topline}>
            <span
              className={`status ${
                album.status === 'complete' ? 'status-complete' : 'status-in-progress'
              }`}
            >
              {album.status === 'complete' ? 'COMPLETE' : 'IN PROGRESS'}
            </span>
            <span className={`${styles.count} mono`}>
              {album.published_count} / {album.episode_count} TRACKS
            </span>
          </span>

          <span className={styles.artist}>{album.artist_name}</span>
          <span className={styles.title}>{album.album_title}</span>

          {metadata.length > 0 && (
            <span className={`${styles.metadata} mono`}>
              {metadata.map((value) => <span key={value}>{value}</span>)}
            </span>
          )}

          {album.editorial_theme && (
            <span className={styles.theme}>{album.editorial_theme}</span>
          )}

          <span className={styles.cta}>
            全曲解説を見る <span aria-hidden="true">→</span>
          </span>
        </span>
      </Link>
    </Reveal>
  );
}

export function AlbumsPage() {
  const listen = useDialog();
  const albums = getAlbums();
  const albumLabel = `${albums.length} ${albums.length === 1 ? 'ALBUM' : 'ALBUMS'}`;

  useEffect(() => {
    document.title = `アルバム一覧｜${site.site_name}`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', PAGE_DESCRIPTION);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <a className={styles.skip} href="#main">
        本文へスキップ
      </a>

      <SiteHeader current="ALBUMS" onOpenListen={listen.openDialog} />

      <main id="main" className={styles.main}>
        <section className={`${styles.hero} container`} aria-labelledby="albums-title">
          <div className={`${styles.heroGrid} grid`}>
            <div className={styles.heroCopy}>
              <p className="label">ALBUM ARCHIVE</p>
              <h1 id="albums-title">アルバムを選ぶ。</h1>
              <p>{PAGE_DESCRIPTION}</p>
            </div>
            <p className={`${styles.heroCount} mono`} aria-hidden="true">
              {pad2(albums.length)}
            </p>
          </div>
          <p className={`${styles.countLabel} label`}>{albumLabel}</p>
        </section>

        <section className={`${styles.archive} container`} aria-labelledby="archive-heading">
          <div className={styles.archiveRule}>
            <p className="label">ALL SERIES</p>
            <h2 className="visually-hidden" id="archive-heading">アルバム一覧</h2>
          </div>

          {albums.length > 0 ? (
            <ul className={styles.gridList}>
              {albums.map((album, index) => (
                <AlbumArchiveCard key={album.id} album={album} index={index} />
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>
              アルバムを準備しています。最初のシリーズ公開まで、もう少しお待ちください。
            </p>
          )}
        </section>
      </main>

      <SiteFooter />
      <ListenPlatformSheet
        open={listen.open}
        onClose={listen.closeDialog}
        panelRef={listen.panelRef}
      />
    </div>
  );
}
