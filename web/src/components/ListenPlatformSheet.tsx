import type { RefObject } from 'react';
import { availablePlatforms, sitePath } from '../data';
import type { PlatformKey } from '../data/types';
import { CloseIcon, ExternalIcon } from './icons';
import styles from './ListenPlatformSheet.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
  directUrls?: Partial<Record<PlatformKey, string>>;
  episodeTitle?: string;
}

/**
 * Platform picker — DESIGN.md §19, CONTENTS.md §2「LISTEN選択UI」.
 * Centred modal on desktop, bottom sheet on mobile. Focus handling lives in
 * useDialog. Services without a configured URL are hidden, never disabled.
 */
export function ListenPlatformSheet({ open, onClose, panelRef, directUrls, episodeTitle }: Props) {
  if (!open) return null;

  const platforms = availablePlatforms(directUrls);

  return (
    <div className={styles.scrim} onClick={onClose}>
      <div
        className={styles.panel}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="listen-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.title} id="listen-title">
          {episodeTitle ? 'この回を配信アプリで聴く' : 'いつものアプリで聴く'}
        </h2>
        <p className={styles.lead}>
          {episodeTitle
            ? `「${episodeTitle}」のポッドキャスト回を開きます。`
            : '使っている配信サービスを選んでください。'}
        </p>

        {platforms.length > 0 ? (
          <ul className={styles.list}>
            {platforms.map((platform) => (
              <li key={platform.key}>
                <a
                  className={[
                    styles.row,
                    platform.badge ? styles.badgeRow : '',
                    episodeTitle && platform.atShowLevel ? styles.rowWithNote : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  href={platform.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={
                    episodeTitle && platform.atShowLevel
                      ? `${platform.label}（番組トップを新しいタブで開きます）`
                      : `${platform.label}（新しいタブで開きます）`
                  }
                >
                  {platform.badge ? (
                    <img
                      className={styles.badge}
                      src={sitePath(platform.badge.src)}
                      alt={platform.label}
                      width={180}
                      height={54}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <>
                      {platform.label}
                      <span className={styles.rowIcon} aria-hidden="true">
                        <ExternalIcon size={16} />
                      </span>
                    </>
                  )}
                  {/*
                    Say so when the link only reaches the show. Promising "この回"
                    and landing on the episode list is worse than the extra word.
                  */}
                  {episodeTitle && platform.atShowLevel && (
                    <span className={styles.showLevelNote}>番組トップが開きます</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          /*
            Empty state — CONTENTS.md §37. Platform URLs are site settings and
            must not be invented, so until they are filled in this is what shows.
          */
          <p className={styles.empty}>
            配信先のURLがまだ登録されていません。設定後にこちらから選べるようになります。
          </p>
        )}

        <button type="button" className={styles.close} onClick={onClose}>
          <CloseIcon size={16} />
          閉じる
        </button>
      </div>
    </div>
  );
}
