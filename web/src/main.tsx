import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/system.css';
import { AlbumDetailPage } from './pages/AlbumDetailPage';

/**
 * Single-route entry. The album id is the last path segment of
 * /albums/{album_id}; it falls back to barrio-fino when served at the root.
 */
function resolveAlbumId(): string {
  const match = window.location.pathname.match(/\/albums\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : 'barrio-fino';
}

// Gates the scroll-reveal hidden state so no-JS renders fully visible.
document.documentElement.classList.add('has-js');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AlbumDetailPage albumId={resolveAlbumId()} />
  </StrictMode>,
);
