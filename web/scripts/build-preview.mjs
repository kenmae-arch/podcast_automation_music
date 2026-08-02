/*
 * Bundles `dist/` into one self-contained HTML file for sharing as a preview.
 *
 * Why this exists: preview hosts (Claude Artifacts among them) apply a strict
 * CSP that blocks every external request, including font CDNs, and they supply
 * their own <head>. So the page has to carry its CSS, JS and typefaces inline,
 * and must not depend on a charset declaration it cannot make.
 *
 * Run `npm run build` first, then `npm run preview:bundle`.
 *
 * Prerequisites (not permanent dependencies — they are large and only needed
 * when regenerating the preview):
 *
 *   pip install fonttools brotli
 *   npm i -D @fontsource/instrument-serif @fontsource/inter \
 *            @fontsource/ibm-plex-mono @fontsource/noto-sans-jp \
 *            @fontsource/noto-serif-jp
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const FS_DIR = path.join(ROOT, 'node_modules/@fontsource');
const WORK = path.join(ROOT, '.preview-fonts');
const OUT = process.argv[2] ?? path.join(ROOT, 'preview.html');

/* ---- 1. Collect the characters the page can actually render -------------
 * A superset taken from source is fine and safer than sampling the DOM: it
 * includes every string the app could produce, not just what one render showed.
 */
function collectCharset() {
  let text = '';
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const p = path.join(dir, entry);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx?|json|css|html)$/.test(entry)) text += fs.readFileSync(p, 'utf8');
    }
  })(path.join(ROOT, 'src'));

  const set = new Set();
  for (const ch of text) if (ch.codePointAt(0) > 0x7f) set.add(ch);
  return [...set].sort().join('');
}

/* ---- 2. Subset the Japanese faces --------------------------------------
 * Full Noto Sans/Serif JP are ~1.4MB each. Restricted to the glyphs this page
 * uses they come in around 55–75KB, which is what makes inlining viable.
 */
function subsetJapanese(charset) {
  fs.mkdirSync(WORK, { recursive: true });
  const out = {};
  for (const [family, weights] of [
    ['noto-serif-jp', [500, 600]],
    ['noto-sans-jp', [400, 500]],
  ]) {
    for (const weight of weights) {
      const src = path.join(FS_DIR, family, 'files', `${family}-japanese-${weight}-normal.woff2`);
      const dest = path.join(WORK, `${family}-${weight}.woff2`);
      execFileSync('python3', [
        '-m', 'fontTools.subset', src,
        `--text=${charset}`,
        '--unicodes=U+0020-007E',
        '--flavor=woff2',
        `--output-file=${dest}`,
        '--layout-features=',
        '--no-hinting',
        '--desubroutinize',
      ]);
      out[`${family}-${weight}`] = dest;
    }
  }
  return out;
}

/* ---- 3. Inline everything ---------------------------------------------- */
const b64 = (p) => fs.readFileSync(p).toString('base64');
const face = (family, weight, file) =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};` +
  `font-display:swap;src:url(data:font/woff2;base64,${b64(file)}) format('woff2')}`;

/*
 * Escape non-ASCII as \uXXXX so the file survives a host that does not declare
 * UTF-8 — otherwise the Japanese renders as mojibake. Safe because the bundle
 * is minified (no comments) and non-ASCII appears only inside string and
 * template literals; surrogate pairs survive since each unit escapes alone.
 */
const toAscii = (s) =>
  s.replace(/[-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

const entities = (s) =>
  [...s].map((c) => (c.codePointAt(0) > 127 ? `&#x${c.codePointAt(0).toString(16)};` : c)).join('');

const charset = collectCharset();
const jp = subsetJapanese(charset);
const latin = (name, file) => path.join(FS_DIR, name, 'files', file);

const faces = [
  face('Instrument Serif', 400, latin('instrument-serif', 'instrument-serif-latin-400-normal.woff2')),
  face('Inter', 400, latin('inter', 'inter-latin-400-normal.woff2')),
  face('Inter', 500, latin('inter', 'inter-latin-500-normal.woff2')),
  face('Inter', 600, latin('inter', 'inter-latin-600-normal.woff2')),
  face('IBM Plex Mono', 400, latin('ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff2')),
  face('IBM Plex Mono', 500, latin('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff2')),
  face('Noto Serif JP', 500, jp['noto-serif-jp-500']),
  face('Noto Serif JP', 600, jp['noto-serif-jp-600']),
  face('Noto Sans JP', 400, jp['noto-sans-jp-400']),
  face('Noto Sans JP', 500, jp['noto-sans-jp-500']),
].join('\n');

// Every accented character the content uses (a-acute, i-acute, inverted ?, ...)
// is Latin-1, so the `latin` subsets suffice and no unicode-range is needed.

const assetDir = path.join(ROOT, 'dist/assets');
const assets = fs.readdirSync(assetDir);
const css = fs.readFileSync(path.join(assetDir, assets.find((f) => f.endsWith('.css'))), 'utf8');
const js = toAscii(fs.readFileSync(path.join(assetDir, assets.find((f) => f.endsWith('.js'))), 'utf8'));

const html = `<title>${entities('Barrio Fino — Daddy Yankee 全曲解説｜アルバム全曲解説')}</title>
<style>
${faces}
/* Single warm-paper world (DESIGN.md sec.3), not a light/dark pair, so pin the
   scheme instead of inheriting the viewer's. */
:root{color-scheme:light}
html,body{background:#f2efe8}
</style>
<style>${css}</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;

fs.writeFileSync(OUT, html);

const nonAscii = [...fs.readFileSync(OUT)].filter((b) => b > 127).length;
if (nonAscii > 0) throw new Error(`preview build is not ASCII-only (${nonAscii} bytes)`);

console.log(`wrote ${OUT} — ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)}MB, ASCII-only`);
