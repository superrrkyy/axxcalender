import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const outDir = process.argv[2] || 'dist';
// Skip legacy .woff fonts: every browser with service workers supports
// woff2, so precaching woff only doubles the font payload.
const assetFiles = (await readdir(join(outDir, 'assets')))
  .filter((file) => !file.endsWith('.woff'))
  .sort();
// Paths stay relative; sw.js resolves them against its registration
// scope, which keeps GitHub Pages project subpaths working.
const files = [
  './',
  'index.html',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'manifest.webmanifest',
  ...assetFiles.map((file) => `assets/${file}`),
];

// Version hashes the actual contents of every shipped asset plus the
// worker source, so any change (not just index.html) rolls the cache.
const hash = createHash('sha256');
hash.update(await readFile('public/sw.js'));
hash.update(await readFile(join(outDir, 'index.html')));
for (const file of assetFiles) hash.update(await readFile(join(outDir, 'assets', file)));
const version = hash.digest('hex').slice(0, 12);

let worker = await readFile('public/sw.js', 'utf8');
const withCacheName = worker.replace(
  /const CACHE = '[^']*';/,
  `const CACHE = 'axxcalender-${version}';`,
);
if (withCacheName === worker) {
  throw new Error('precache: pola "const CACHE = \'...\';" tidak ditemukan di public/sw.js');
}
worker = withCacheName;
const withPrecache = worker.replace(
  /const PRECACHE_URLS = \[[\s\S]*?\];/,
  `const PRECACHE_URLS = ${JSON.stringify(files)};`,
);
if (withPrecache === worker) {
  throw new Error('precache: pola "const PRECACHE_URLS = [...];" tidak ditemukan di public/sw.js');
}
worker = withPrecache;

await writeFile(join(outDir, 'sw.js'), worker);
console.log(`Offline cache ready: ${files.length} resources (${version}) in ${outDir}/`);
