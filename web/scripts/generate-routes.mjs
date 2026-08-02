import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(scriptDir, '..');
const docsDir = resolve(webDir, '..', 'docs');
const sourceHtml = resolve(docsDir, 'index.html');

const [albums, episodes] = await Promise.all([
  readFile(resolve(webDir, 'src/data/albums.json'), 'utf8').then(JSON.parse),
  readFile(resolve(webDir, 'src/data/episodes.json'), 'utf8').then(JSON.parse),
]);

const template = await readFile(sourceHtml, 'utf8');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function withMetadata(title, description) {
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    );
}

const albumRoutes = albums.map((album) => ({
  route: `albums/${album.id}`,
  html: withMetadata(
    `${album.album_title} — ${album.artist_name} 全曲解説｜アルバム全曲解説`,
    `${album.artist_name}『${album.album_title}』を1曲ずつ解説。作品の背景、テーマ、聴きどころを曲順にたどります。`,
  ),
}));

const episodeRoutes = episodes
  .filter((episode) => episode.status === 'published' && episode.web_summary)
  .map((episode) => {
    const heading = episode.title ?? episode.track_title;
    return {
      route: `episodes/${episode.id}`,
      html: withMetadata(
        `${heading} — ${episode.track_title}｜アルバム全曲解説`,
        episode.web_summary,
      ),
    };
  });

const routes = [
  {
    route: 'albums',
    html: withMetadata(
      'アルバム一覧｜アルバム全曲解説',
      '一曲ずつたどりながら、作品がどこから始まり、どこへ向かうのかを読み解きます。',
    ),
  },
  ...albumRoutes,
  ...episodeRoutes,
];

// These folders contain generated entry documents only; assets live elsewhere.
await Promise.all([
  rm(resolve(docsDir, 'albums'), { recursive: true, force: true }),
  rm(resolve(docsDir, 'episodes'), { recursive: true, force: true }),
]);

for (const { route, html } of routes) {
  const routeDir = resolve(docsDir, route);
  await mkdir(routeDir, { recursive: true });
  await writeFile(resolve(routeDir, 'index.html'), html);
}

await copyFile(sourceHtml, resolve(docsDir, '404.html'));
console.log(`generated ${routes.length} static routes`);
