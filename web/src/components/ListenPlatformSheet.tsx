import type { RefObject } from 'react';
import { availablePlatforms } from '../data';
import { CloseIcon, ExternalIcon } from './icons';
import styles from './ListenPlatformSheet.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
}

/**
 * Platform picker — DESIGN.md §19, CONTENTS.md §2「LISTEN選択UI」.
 * Centred modal on desktop, bottom sheet on mobile. Focus handling lives in
 * useDialog. Services without a configured URL are hidden, never disabled.
 */
export function ListenPlatformSheet({ open, onClose, panelRef }: Props) {
  if (!open) return null;

  const platforms = availablePlatforms();

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
          いつものアプリで聴く
        </h2>
        <p className={styles.lead}>使っている配信サービスを選んでください。</p>

        {platforms.length > 0 ? (
          <ul className={styles.list}>
            {platforms.map((platform) => (
              <li key={platform.key}>
                <a
                  className={styles.row}
                  href={platform.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {platform.label}
                  <span className={styles.rowIcon}>
                    <ExternalIcon size={16} />
                    <span className="visually-hidden">新しいタブで開きます</span>
                  </span>
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
