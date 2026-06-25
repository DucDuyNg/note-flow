import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Vite config lives in /configs/ — paths are anchored to the project root
// (one level up) so Vite still finds index.html, src/, public/, dist/.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf-8'));
const APP_VERSION = pkg.version;
const BUILD_TIME = new Date().toISOString();

function emitVersionJson() {
  return {
    name: 'emit-version-json',
    apply: 'build',
    writeBundle() {
      writeFileSync(
        resolve(projectRoot, 'dist/version.json'),
        JSON.stringify({ version: APP_VERSION, builtAt: BUILD_TIME }, null, 2),
      );
    },
  };
}

export default defineConfig({
  root: projectRoot,
  plugins: [react(), emitVersionJson()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  server: {
    port: 5173,
    open: true,
  },
});
