// TC-02 static check: application source contains no network or persistence APIs.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const files = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : [path];
});

const FORBIDDEN = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|serviceWorker)\b/;

describe('TC-02 no network or persistence code in src/', () => {
  it.each(files(srcDir).map((f) => [f.slice(srcDir.length + 1), f]))('%s', (_, path) => {
    expect(readFileSync(path, 'utf8')).not.toMatch(FORBIDDEN);
  });
});
