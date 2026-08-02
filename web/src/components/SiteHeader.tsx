import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useDialog } from '../hooks/useDialog';
import { ExternalIcon, CloseIcon } from './icons';
import styles from './SiteHeader.module.css';

const NAV = [
  { label: 'HOME', href: '/' },
  { label: 'ALBUMS', href: '/albums' },
  { label: 'ABOUT', href: '/about' },
  { label: 'REQUEST', href: '/request' },
];

/** Mobile menu carries the two extra destinations — CONTENTS.md §2. */
const NAV_MOBILE = [...NAV, { label: 'CONTACT', href: '/contact' }, { label: 'PRIVACY POLICY', href: '/privacy' }];

interface Props {
  /** Which nav item is the current page, for aria-current + underline. */
  current: string;
  onOpenListen: (event: { currentTarget: EventTarget | null }) => void;
}

export function SiteHeader({ current, onOpenListen }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const menu = useDialog();

  // Header ground turns opaque once the page moves — DESIGN.md §10.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`${styles.inner} container`}>
        {/*
          Narrow screens use the short logotype so it never wraps to two lines,
          while the accessible name stays the full service name — DESIGN.md §10.
        */}
        <Link className={styles.logo} to="/" aria-label="アルバム全曲解説">
          <span className={styles.logoFull} aria-hidden="true">
            アルバム全曲解説
          </span>
          <span className={styles.logoShort} aria-hidden="true">
            全曲解説
          </span>
        </Link>

        <nav className={styles.nav} aria-label="グローバルナビゲーション">
          {NAV.map((item) => {
            const isCurrent = item.label === current;
            return (
              <NavLink
                key={item.label}
                className={`${styles.navLink} ${isCurrent ? styles.navCurrent : ''}`}
                to={item.href}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <button type="button" className={styles.listen} onClick={onOpenListen}>
            LISTEN
            <ExternalIcon size={13} />
          </button>

          <button
            type="button"
            className={styles.menuButton}
            onClick={menu.openDialog}
            aria-expanded={menu.open}
            aria-haspopup="dialog"
          >
            メニューを開く
          </button>
        </div>
      </div>

      {menu.open && (
        <div className={styles.menuScrim} onClick={menu.closeDialog}>
          <div
            className={styles.menuSheet}
            ref={menu.panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="メニュー"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.menuHead}>
              <button type="button" className={styles.menuClose} onClick={menu.closeDialog}>
                <CloseIcon />
                メニューを閉じる
              </button>
            </div>
            <nav aria-label="メニュー">
              {NAV_MOBILE.map((item) => {
                const isCurrent = item.label === current;
                return (
                  <NavLink
                    key={item.label}
                    className={styles.menuLink}
                    to={item.href}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
