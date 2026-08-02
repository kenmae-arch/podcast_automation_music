import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ListenPlatformSheet } from '../components/ListenPlatformSheet';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { site } from '../data';
import { useDialog } from '../hooks/useDialog';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  const listen = useDialog();

  useEffect(() => {
    document.title = `ページが見つかりません｜${site.site_name}`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'お探しのページは見つかりませんでした。');
  }, []);

  return (
    <div className={styles.page}>
      <SiteHeader current="" onOpenListen={listen.openDialog} />
      <main className={`${styles.main} container`}>
        <p className={`${styles.code} mono`} aria-hidden="true">404</p>
        <p className="label">Page not found</p>
        <h1>このページは見つかりませんでした。</h1>
        <p className={styles.body}>
          URLが変更されたか、ページがまだ公開されていない可能性があります。
        </p>
        <Link className="btn btn-primary" to="/albums/barrio-fino">
          Barrio Fino 全曲解説へ
          <span className="btn-glyph" aria-hidden="true">→</span>
        </Link>
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
