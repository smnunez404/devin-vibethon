import { defineConfig } from 'vite';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

// Sirve el kit de assets del proyecto en /assets/* sin duplicar archivos.
const ASSETS_ROOT = resolve(__dirname, '../assets');

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.json': 'application/json',
};

export default defineConfig({
  // VITE_BASE permite servir bajo subruta (p. ej. GitHub Pages /devin-vibethon/).
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    {
      name: 'serve-assets-kit',
      configureServer(server) {
        server.middlewares.use('/assets', (req, res) => {
          const rel = decodeURIComponent((req.url ?? '').split('?')[0]);
          const file = join(ASSETS_ROOT, rel);
          if (!file.startsWith(ASSETS_ROOT) || !existsSync(file) || !statSync(file).isFile()) {
            res.statusCode = 404;
            res.end('not found');
            return;
          }
          res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] ?? 'application/octet-stream');
          createReadStream(file).pipe(res);
        });
      },
    },
  ],
  server: { host: '127.0.0.1', port: 5173 },
});
