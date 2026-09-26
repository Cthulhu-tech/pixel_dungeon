import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  base: process.env.PORT_BASE || './',
  publicDir: false,
  server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
  plugins: [{ name: 'original-license', generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'LICENSE.txt', source: readFileSync(new URL('../LICENSE.txt', import.meta.url), 'utf8') });
  } }],
});
