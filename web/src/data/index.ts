import albumsJson from './albums.json';
import episodeMediaJson from './episode-media.json';
import episodesJson from './episodes.json';
import siteJson from './site.json';
import type { Album, Episode, PlatformKey, PlatformLink, SiteSettings } from './types';

const albums = albumsJson as Album[];
const episodeMedia = episodeMediaJson as Record<
  string,
  { apple_music_track_id?: string; podcast_urls?: Partial<Record<PlatformKey, string>> }
>;
const episodes = (episodesJson as Omit<Episode, 'apple_music_track_id' | 'podcast_urls'>[]).map(
  (episode): Episode => ({
    ...episode,
    apple_music_track_id: episodeMedia[episode.id]?.apple_music_track_id ?? null,
    podcast_urls: episodeMedia[episode.id]?.podcast_urls ?? {},
  }),
);
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

export function getEpisode(id: string): Episode | undefined {
  return episodes.find((episode) => episode.id === id);
}

export function getRelatedAlbums(album: Album): Album[] {
  return album.related_album_ids
    .map((id) => getAlbum(id))
    .filter((a): a is Album => a !== undefined);
}

/** CONTENTS.md §2: services without a URL are hidden, not disabled. */
export function availablePlatforms(
  directUrls?: Partial<Record<PlatformKey, string>>,
): PlatformLink[] {
  return site.platforms
    .map((platform) => ({
      ...platform,
      url: directUrls === undefined ? platform.url : directUrls[platform.key] ?? null,
    }))
    .filter((platform) => Boolean(platform.url));
}

const APPLE_MUSIC_ALBUM_ID = '1785999696';
const APPLE_MUSIC_ALBUM_SLUG = 'barrio-fino-deluxe-version';

export function appleMusicUrl(episode: Episode, embed = false): string | null {
  if (!episode.apple_music_track_id) return null;
  const host = embed ? 'https://embed.music.apple.com' : 'https://music.apple.com';
  return `${host}/jp/album/${APPLE_MUSIC_ALBUM_SLUG}/${APPLE_MUSIC_ALBUM_ID}?i=${episode.apple_music_track_id}`;
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
