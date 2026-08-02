import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/system.css';
import { AlbumDetailPage } from './pages/AlbumDetailPage';
import { EpisodeDetailPage } from './pages/EpisodeDetailPage';

type Route =
  | { kind: 'album'; id: string }
  | { kind: 'episode'; id: string }
  | { kind: 'not-found' };

/** Resolve the project-relative path without bringing in a router dependency. */
function resolveRoute(): Route {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const pathname = window.location.pathname.replace(new RegExp(`^${base}`), '') || '/';

  const episode = pathname.match(/^\/episodes\/([^/]+)\/?$/);
  if (episode) return { kind: 'episode', id: decodeURIComponent(episode[1]) };

  const album = pathname.match(/^\/albums\/([^/]+)\/?$/);
  if (album) return { kind: 'album', id: decodeURIComponent(album[1]) };

  if (pathname === '/' || pathname === '/albums' || pathname === '/albums/') {
    return { kind: 'album', id: 'barrio-fino' };
  }

  return { kind: 'not-found' };
}

// Gates the scroll-reveal hidden state so no-JS renders fully visible.
document.documentElement.classList.add('has-js');

const route = resolveRoute();
const page =
  route.kind === 'episode' ? (
    <EpisodeDetailPage episodeId={route.id} />
  ) : (
    <AlbumDetailPage albumId={route.kind === 'album' ? route.id : '__not-found__'} />
  );

createRoot(document.getElementById('root')!).render(
  <StrictMode>{page}</StrictMode>,
);
