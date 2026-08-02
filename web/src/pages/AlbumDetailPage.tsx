import { useEffect, useMemo, useRef } from 'react';
import { getAlbum, getEpisodes, getRelatedAlbums, isPublished, safeAccent, site, sitePath } from '../data';
import { getLastTrack } from '../data/progress';
import { useCurrentTrack } from '../hooks/useCurrentTrack';
import { useDialog } from '../hooks/useDialog';
import { useScrolledPast } from '../hooks/useScrolledPast';
import { SiteHeader } from '../components/SiteHeader';
import { StickyAlbumBar } from '../components/StickyAlbumBar';
import { AlbumHero } from '../components/AlbumHero';
import { AlbumOverview } from '../components/AlbumOverview';
import { TrackJourney } from '../components/TrackJourney';
import { AlbumCompletionCta } from '../components/AlbumCompletionCta';
import { RelatedAlbums } from '../components/RelatedAlbums';
import { SiteFooter } from '../components/SiteFooter';
import { ListenPlatformSheet } from '../components/ListenPlatformSheet';
import styles from './AlbumDetailPage.module.css';

interface Props {
  albumId: string;
}

export function AlbumDetailPage({ albumId }: Props) {
  const album = getAlbum(albumId);
  const episodes = useMemo(() => getEpisodes(albumId), [albumId]);

  const listen = useDialog();
  const heroRef = useRef<HTMLDivElement>(null);
  const scrolledPastHero = useScrolledPast(heroRef);
  const { current, inJourney } = useCurrentTrack(episodes.length);

  // CONTENTS.md §1 — title and description templates.
  useEffect(() => {
    if (!album) return;
    document.title = `${album.album_title} — ${album.artist_name} 全曲解説｜${site.site_name}`;
    const description = `${album.artist_name}『${album.album_title}』を1曲ずつ解説。作品の背景、テーマ、聴きどころを曲順にたどります。`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [album]);

  if (!album) {
    // CONTENTS.md §37 — 404 copy, not a blank screen.
    return (
      <main className={`${styles.notFound} container`}>
        <h1>このページは見つかりませんでした。</h1>
        <p>URLが変更されたか、ページが公開されていない可能性があります。</p>
        <a className="btn btn-primary" href={sitePath('/')}>
          アルバムを探す
          <span className="btn-glyph" aria-hidden="true">
            →
          </span>
        </a>
      </main>
    );
  }

  const accent = safeAccent(album.accent);
  const firstPublished = episodes.find(isPublished);
  const related = getRelatedAlbums(album);
  const resumeTrack = getLastTrack(album.id);

  // Album accent is scoped to the page root — DESIGN.md §30.
  const themeStyle = accent ? ({ '--album-accent': accent } as React.CSSProperties) : undefined;

  return (
    <div className={styles.page} style={themeStyle}>
      {/* Paper grain — DESIGN.md §7.4, decorative and never over 4% opacity. */}
      <div className={styles.grain} aria-hidden="true" />

      <a className={styles.skip} href="#main">
        本文へスキップ
      </a>

      <SiteHeader current="ALBUMS" onOpenListen={listen.openDialog} />
      <StickyAlbumBar
        album={album}
        current={current}
        showTrack={inJourney}
        visible={scrolledPastHero}
      />

      <main id="main" className={styles.main}>
        {/* Wrapper exists so the sticky bar can observe the hero's full height. */}
        <div ref={heroRef}>
          <AlbumHero
            album={album}
            firstEpisode={firstPublished}
            resumeTrack={resumeTrack}
            onOpenListen={listen.openDialog}
          />
        </div>

        <AlbumOverview album={album} />

        <TrackJourney
          album={album}
          episodes={episodes}
          current={current}
          onOpenListen={listen.openDialog}
        />

        <AlbumCompletionCta album={album} firstEpisode={firstPublished} />
        <RelatedAlbums albums={related} />
      </main>

      <SiteFooter />

      <ListenPlatformSheet
        open={listen.open}
        onClose={listen.closeDialog}
        panelRef={listen.panelRef}
      />

      {/* CONTENTS.md §39 — CollectionPage + ItemList, no invented ratings. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${album.album_title} — ${album.artist_name} 全曲解説`,
            inLanguage: 'ja',
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: episodes.length,
              itemListElement: episodes.map((episode) => ({
                '@type': 'ListItem',
                position: episode.track_number,
                name: episode.track_title,
              })),
            },
          }),
        }}
      />
    </div>
  );
}
