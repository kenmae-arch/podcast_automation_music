import { Link } from 'react-router-dom';
import { availablePlatforms, site, sitePath } from '../data';
import { ExternalIcon } from './icons';
import styles from './SiteFooter.module.css';

const SITE_LINKS = [
  { label: 'HOME', href: '/' },
  { label: 'ALBUMS', href: '/albums' },
  { label: 'ABOUT', href: '/about' },
  { label: 'REQUEST', href: '/request' },
  { label: 'CONTACT', href: '/contact' },
  { label: 'PRIVACY POLICY', href: '/privacy' },
];

/** CONTENTS.md §36 / DESIGN.md §22. */
export function SiteFooter() {
  const platforms = availablePlatforms();

  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} container`}>
        <p className={styles.statement}>{site.tagline}</p>

        <div className={`${styles.columns} grid`}>
          <div className={styles.brand}>
            <p className={styles.brandName}>{site.site_name}</p>
            <p className={styles.brandBody}>{site.description}</p>
          </div>

          <nav className={styles.nav} aria-label="サイトリンク">
            <p className={`${styles.colLabel} label`}>Site</p>
            {SITE_LINKS.map((link) => (
              <Link key={link.label} className={styles.link} to={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Unset platform URLs are omitted entirely — CONTENTS.md §36. */}
          {platforms.length > 0 && (
            <div className={styles.platforms}>
              <p className={`${styles.colLabel} label`}>Listen</p>
              {platforms.map((platform) => (
                <a
                  key={platform.key}
                  className={`${styles.link} ${platform.badge ? styles.badgeLink : ''}`}
                  href={platform.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${platform.label}（新しいタブで開きます）`}
                >
                  {platform.badge ? (
                    <img
                      className={styles.platformBadge}
                      src={sitePath(platform.badge.dark_src ?? platform.badge.src)}
                      alt={platform.label}
                      width={160}
                      height={48}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <>
                      {platform.label.replace('で聴く', '')}
                      <ExternalIcon size={12} />
                    </>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className={styles.baseline}>
          <p className={`${styles.fine} mono`}>{site.editor}</p>
          <p className={`${styles.fine} mono`}>© {new Date().getFullYear()} {site.site_name}</p>
        </div>
      </div>
    </footer>
  );
}
