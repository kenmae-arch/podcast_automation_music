import { cp, copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(scriptDir, '..');
const repositoryDocsDir = resolve(webDir, '..', 'docs');
const docsDir = process.env.VITE_OUT_DIR
  ? resolve(webDir, process.env.VITE_OUT_DIR)
  : repositoryDocsDir;
const sourceHtml = resolve(docsDir, 'index.html');

const [albums, episodes] = await Promise.all([
  readFile(resolve(webDir, 'src/data/albums.json'), 'utf8').then(JSON.parse),
  readFile(resolve(webDir, 'src/data/episodes.json'), 'utf8').then(JSON.parse),
]);

const template = await readFile(sourceHtml, 'utf8');
const siteOrigin = 'https://albumatlas.jp';

// Cloudflare Pages用の独立出力に、RSSと画像だけを同梱する。
// MP3はPagesに複製せずR2から配信する。
if (docsDir !== repositoryDocsDir) {
  const coverFiles = (await readdir(repositoryDocsDir)).filter((name) =>
    /^cover.*\.(?:jpe?g|png|webp)$/i.test(name),
  );
  await Promise.all([
    copyFile(resolve(repositoryDocsDir, 'feed.xml'), resolve(docsDir, 'feed.xml')),
    copyFile(resolve(repositoryDocsDir, 'episodes.json'), resolve(docsDir, 'episodes.json')),
    ...coverFiles.map((name) =>
      copyFile(resolve(repositoryDocsDir, name), resolve(docsDir, name)),
    ),
    cp(resolve(repositoryDocsDir, 'art'), resolve(docsDir, 'art'), { recursive: true }),
  ]);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function withMetadata(title, description, pathname, schema = []) {
  const canonicalUrl = `${siteOrigin}${pathname}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteOrigin}/#organization`,
        name: 'アルバム全曲解説',
        url: `${siteOrigin}/`,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        url: `${siteOrigin}/`,
        name: 'アルバム全曲解説',
        inLanguage: 'ja',
        publisher: { '@id': `${siteOrigin}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        inLanguage: 'ja',
        isPartOf: { '@id': `${siteOrigin}/#website` },
      },
      ...schema,
    ],
  };

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    )
    .replace(/<link rel="canonical"[^>]*\/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<meta property="og:title"[^>]*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description"[^>]*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url"[^>]*\/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta name="twitter:title"[^>]*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta name="twitter:description"[^>]*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">${escapeJsonForHtml(structuredData)}</script>`,
    );
}

const albumRoutes = albums.map((album) => ({
  route: `albums/${album.id}`,
  html: withMetadata(
    `${album.album_title} — ${album.artist_name} 全曲解説｜アルバム全曲解説`,
    `${album.artist_name}『${album.album_title}』を1曲ずつ解説。作品の背景、テーマ、聴きどころを曲順にたどります。`,
    `/albums/${album.id}/`,
    [{
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteOrigin}/` },
        { '@type': 'ListItem', position: 2, name: 'アルバム一覧', item: `${siteOrigin}/albums/` },
        { '@type': 'ListItem', position: 3, name: album.album_title, item: `${siteOrigin}/albums/${album.id}/` },
      ],
    }],
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
        `/episodes/${episode.id}/`,
        [{
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteOrigin}/` },
            { '@type': 'ListItem', position: 2, name: 'エピソード', item: `${siteOrigin}/episodes/${episode.id}/` },
          ],
        }],
      ),
    };
  });

const routes = [
  {
    route: 'albums',
    html: withMetadata(
      'アルバム一覧｜アルバム全曲解説',
      '一曲ずつたどりながら、作品がどこから始まり、どこへ向かうのかを読み解きます。',
      '/albums/',
    ),
  },
  {
    route: 'request',
    html: withMetadata(
      'アルバムをリクエスト｜アルバム全曲解説',
      '何度も聴いてきたアルバム、背景をもっと知りたい作品、曲順でたどってほしい一枚を募集しています。',
      '/request/',
    ),
  },
  {
    route: 'privacy',
    html: withMetadata(
      'プライバシーポリシー｜アルバム全曲解説',
      'アルバム全曲解説における、個人情報、外部サービス、Cookieおよびローカルストレージの取り扱いについて説明します。',
      '/privacy/',
    ),
  },
  {
    route: 'contact',
    html: withMetadata(
      'お問い合わせ｜アルバム全曲解説',
      '感想、内容の訂正・情報提供、コラボレーションなど、アルバム全曲解説へのお問い合わせはこちらからお送りください。',
      '/contact/',
    ),
  },
  {
    route: 'about',
    html: withMetadata(
      'この番組について｜アルバム全曲解説',
      '海外アーティストの作品を一曲ずつたどりながら、アルバム全体の背景、意味、物語を楽しむ「アルバム全曲解説」の編集方針を紹介します。',
      '/about/',
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

const notFoundHtml = withMetadata(
  'ページが見つかりません｜アルバム全曲解説',
  'お探しのページは見つかりませんでした。',
  '/404.html',
).replace(
  '<meta name="robots" content="index,follow,max-image-preview:large" />',
  '<meta name="robots" content="noindex,follow" />',
);
await writeFile(resolve(docsDir, '404.html'), notFoundHtml);

const sitemapRoutes = ['/', ...routes.map(({ route }) => `/${route}/`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes
  .map((pathname) => `  <url><loc>${siteOrigin}${pathname}</loc></url>`)
  .join('\n')}\n</urlset>\n`;
await writeFile(resolve(docsDir, 'sitemap.xml'), sitemap);

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`;
await writeFile(resolve(docsDir, 'robots.txt'), robots);
console.log(`generated ${routes.length} static routes`);
