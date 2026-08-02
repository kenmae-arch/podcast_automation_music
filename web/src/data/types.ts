/**
 * Content model. Field names follow CONTENTS.md §38「データ連携ルール」verbatim so
 * the JSON can be swapped for a real CMS/RSS feed without renaming anything.
 *
 * `null` is the explicit "not supplied yet" signal. Per CONTENTS.md §38
 * 「欠損時の扱い」a missing field is hidden entirely — never rendered as
 * 「不明」/「未設定」, and never back-filled with invented text.
 */

export type AlbumStatus = 'in_progress' | 'complete';

/** CONTENTS.md §16「状態別表示」*/
export type EpisodeStatus = 'published' | 'upcoming';

export interface ListeningPoint {
  /** Short heading shown above the body copy. */
  heading: string;
  body: string;
  /**
   * `fact` = verifiable and attributable. `reading` = this series' interpretation,
   * which CONTENTS.md §15 requires be marked as such rather than stated flatly.
   */
  kind: 'fact' | 'reading';
}

export interface KeyPoint {
  heading: string;
  body: string;
}

export interface Album {
  id: string;
  series_number: number;
  artist_name: string;
  album_title: string;
  release_year: number | null;
  genre: string | null;
  language: string | null;
  country: string | null;
  episode_count: number;
  published_count: number;
  status: AlbumStatus;
  introduction: string | null;
  cultural_context: string | null;
  selection_reason: string | null;
  editorial_theme: string | null;
  listening_points: ListeningPoint[];
  /**
   * Series artwork. In production this is the artwork already used in the RSS
   * feed — see docs/DATA-HANDOFF.md. `null` renders the brand fallback described
   * in DESIGN.md §8「画像フォールバック」rather than a generated image.
   */
  original_artwork: { src: string; alt: string } | null;
  related_album_ids: string[];
  /** Why this album is surfaced under KEEP DIGGING on another album's page. */
  related_reason: string | null;
  /** Album accent, DESIGN.md §3.2. Validated as hex before use. */
  accent: string | null;
}

export interface Episode {
  id: string;
  episode_number: number | null;
  series_number: number;
  track_number: number;
  album_id: string;
  /** Official track title. Shown only when confirmed — CONTENTS.md §16. */
  track_title: string;
  /** The episode's own headline, distinct from the track title. */
  title: string | null;
  /** 150 chars max, CONTENTS.md §16. Absent ⇒ episode is not publishable (§38). */
  web_summary: string | null;
  key_points: KeyPoint[];
  album_role: string | null;
  audio_file: string | null;
  /** e.g. "04:32" — CONTENTS.md §0 表記ルール */
  duration: string | null;
  /** ISO date. Rendered as YYYY.MM.DD. */
  published: string | null;
  status: EpisodeStatus;
  /** Apple Music catalog ID for the original song preview. */
  apple_music_track_id: string | null;
  /** Direct links to this specific podcast episode. Missing services stay hidden. */
  podcast_urls: Partial<Record<PlatformKey, string>>;
}

export type PlatformKey = 'spotify' | 'apple_podcasts' | 'amazon_music';

/** Platform links live in site settings; unset services are hidden (CONTENTS.md §2). */
export interface PlatformLink {
  key: PlatformKey;
  /** Label already carries the action verb — CONTENTS.md §2「LISTEN選択UI」*/
  label: string;
  url: string | null;
  /** Official service badge for light surfaces, plus an optional dark-surface variant. */
  badge?: {
    src: string;
    dark_src: string | null;
  };
}

export interface SiteSettings {
  site_name: string;
  tagline: string;
  description: string;
  editor: string;
  platforms: PlatformLink[];
}
