import { defineConfig, type Plugin } from 'vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Генерирует dist/sw.js со списком всех файлов сборки.
 * После первого открытия приложение целиком лежит в кеше и работает без интернета.
 */
function offlineServiceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'offline-sw',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const p = join(dir, name);
          if (statSync(p).isDirectory()) walk(p);
          else if (name !== 'sw.js' && !name.endsWith('.map')) files.push(p);
        }
      };
      walk(outDir);
      const hash = createHash('sha256');
      for (const f of files.sort()) hash.update(readFileSync(f));
      const version = hash.digest('hex').slice(0, 12);
      const urls = ['./', ...files.map((f) => './' + relative(outDir, f).split('\\').join('/'))];
      const sw = `/* Автоматически создано при сборке. Версия ${version} */
const CACHE = 'ft70d-${version}';
const PRECACHE = ${JSON.stringify(urls, null, 1)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ft70d-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
`;
      writeFileSync(join(outDir, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [offlineServiceWorker()],
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 900 },
});
