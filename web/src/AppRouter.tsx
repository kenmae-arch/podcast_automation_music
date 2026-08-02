import {
  Outlet,
  RouterProvider,
  ScrollRestoration,
  createBrowserRouter,
  useParams,
} from 'react-router-dom';
import { AlbumDetailPage } from './pages/AlbumDetailPage';
import { EpisodeDetailPage } from './pages/EpisodeDetailPage';
import { HomePage } from './pages/HomePage';
import { AlbumsPage } from './pages/AlbumsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { getAlbum, getEpisode, isPublished } from './data';

function RouteRoot() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

function AlbumRoute() {
  const { albumId } = useParams();
  return albumId && getAlbum(albumId) ? <AlbumDetailPage albumId={albumId} /> : <NotFoundPage />;
}

function EpisodeRoute() {
  const { episodeId } = useParams();
  const episode = episodeId ? getEpisode(episodeId) : undefined;
  return episode && isPublished(episode) ? (
    <EpisodeDetailPage episodeId={episode.id} />
  ) : (
    <NotFoundPage />
  );
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RouteRoot />,
      errorElement: <NotFoundPage />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'albums', element: <AlbumsPage /> },
        { path: 'albums/:albumId', element: <AlbumRoute /> },
        { path: 'episodes/:episodeId', element: <EpisodeRoute /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename },
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
