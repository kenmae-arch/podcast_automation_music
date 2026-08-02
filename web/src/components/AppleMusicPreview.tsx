import type { Episode } from '../data/types';
import { appleMusicUrl } from '../data';
import { ExternalIcon } from './icons';
import styles from './AppleMusicPreview.module.css';

interface Props {
  episode: Episode;
  compact?: boolean;
}

/** Original-song preview. The podcast audio itself continues to live in the apps. */
export function AppleMusicPreview({ episode, compact = false }: Props) {
  const embedUrl = appleMusicUrl(episode, true);
  const trackUrl = appleMusicUrl(episode);
  if (!embedUrl || !trackUrl) return null;

  return (
    <div className={`${styles.preview} ${compact ? styles.compact : ''}`}>
      <p className={`${styles.label} label`}>Original preview</p>
      <div className={styles.frameShell}>
        <iframe
          key={episode.apple_music_track_id}
          className={styles.frame}
          src={embedUrl}
          title={`Apple Musicで${episode.track_title}を試聴`}
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          loading="lazy"
        />
      </div>
      <a
        className={styles.openLink}
        href={trackUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Apple Musicで曲を開く
        <ExternalIcon size={12} />
      </a>
    </div>
  );
}
