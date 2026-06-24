import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const APP_VERSION = pkg.version;
const BUILD_TIME = new Date().toISOString();

// Emit a small JSON file at /version.json so the running app can poll the
// server to detect when a newer deploy is available. Hashed JS/CSS get
// cache-busted automatically by Vite — only index.html + this file need to
// be served with `no-cache` (see firebase.json headers).
function emitVersionJson() {
  return {
    name: 'emit-version-json',
    apply: 'build',
    writeBundle() {
      writeFileSync(
        resolve(__dirname, 'dist/version.json'),
        JSON.stringify({ version: APP_VERSION, builtAt: BUILD_TIME }, null, 2),
      );
    },
  };
}

export default defineConfig({
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
