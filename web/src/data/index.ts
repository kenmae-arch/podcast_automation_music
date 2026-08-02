import albumsJson from './albums.json';
import episodesJson from './episodes.json';
import siteJson from './site.json';
import type { Album, Episode, PlatformLink, SiteSettings } from './types';

const albums = albumsJson as Album[];
const episodes = episodesJson as Episode[];
export const site = siteJson as SiteSettings;

/** Resolve an internal URL against the GitHub Pages project base path. */
export function sitePath(path: string): string {
  if (/^(?:https?:|mailto:|tel:|#)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalized = path.replace(/^\/+/, '');
  return normalized ? `${base}/${normalized}` : `${base}/`;
}

/** DESIGN.md §30: album accents arrive as data, so only accept validated hex. */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export function safeAccent(value: string | null): string | null {
  return value && HEX.test(value) ? value : null;
}

export function getAlbum(id: string): Album | undefined {
  return albums.find((a) => a.id === id);
}

/** Episodes for an album, always in track order — the sequence is the point. */
export function getEpisodes(albumId: string): Episode[] {
  return episodes
    .filter((e) => e.album_id === albumId)
    .sort((a, b) => a.track_number - b.track_number);
}

export function getRelatedAlbums(album: Album): Album[] {
  return album.related_album_ids
    .map((id) => getAlbum(id))
    .filter((a): a is Album => a !== undefined);
}

/** CONTENTS.md §2: services without a URL are hidden, not disabled. */
export function availablePlatforms(): PlatformLink[] {
  return site.platforms.filter((p) => Boolean(p.url));
}

/**
 * CONTENTS.md §38: an episode without `web_summary` is not publishable, and the
 * summary is never derived from another field. Treat such rows as upcoming so a
 * half-populated record can't leak an empty published row into the page.
 */
export function isPublished(episode: Episode): boolean {
  return episode.status === 'published' && Boolean(episode.web_summary);
}

/** Latest published track number, or null when nothing is published yet. */
export function latestPublishedTrack(episodes: Episode[]): number | null {
  const published = episodes.filter(isPublished);
  return published.length ? published[published.length - 1].track_number : null;
}

/** CONTENTS.md §0: dates render as YYYY.MM.DD, and only when present. */
export function formatPublished(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

/** Track numbers are always two digits — CONTENTS.md §0. */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
