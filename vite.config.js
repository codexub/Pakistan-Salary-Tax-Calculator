import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production builds get a Content-Security-Policy that forbids every network connection from scripts
// (connect-src 'none'), so salary data cannot be sent anywhere (TC-02). It is added at build time only
// because the dev server needs a WebSocket for hot reload.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const contentSecurityPolicy = {
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  ],
};

export default defineConfig({
  plugins: [react(), contentSecurityPolicy],
  build: { sourcemap: false, modulePreload: { polyfill: false } },
  test: { environment: 'node' },
});
