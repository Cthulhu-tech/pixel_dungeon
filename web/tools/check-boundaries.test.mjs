import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkBoundaries } from './check-boundaries.mjs';
function check(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'pd-boundaries-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [path, value] of Object.entries(files)) { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), value); }
  return checkBoundaries(root);
}
test('public module APIs and pure contracts are allowed', (t) => {
  assert.deepEqual(check(t, { 'modules/a/index.ts': 'export const a=1;', 'app/main.ts': "import {a} from '../modules/a/index.ts';" }), []);
});
test('deep imports and framework dependencies fail', (t) => {
  const errors = check(t, { 'modules/a/index.ts': "import Phaser from 'phaser'; import {x} from '../b/internal.ts';", 'modules/b/internal.ts': 'export const x=1;' });
  assert.ok(errors.some((e) => e.includes('External'))); assert.ok(errors.some((e) => e.includes('deep import')));
});
test('relative domain imports cannot reach adapters', (t) => {
  assert.ok(check(t, { 'modules/a/index.ts': "import '../../adapters/x.ts';", 'adapters/x.ts': 'export const x=1;' }).some((e) => e.includes('Domain cannot')));
});
test('cycles are rejected', (t) => {
  assert.ok(check(t, { 'app/a.ts': "import './b.ts';", 'app/b.ts': "import './a.ts';" }).some((e) => e.includes('Dependency cycle')));
});
test('browser/time/random APIs and explicit any are rejected', (t) => {
  const errors = check(t, { 'modules/a/index.ts': "const a: any = Date.now(); const b=Math['random'](); window.fetch('/');" });
  assert.ok(errors.some((e) => e.includes('Explicit any'))); assert.ok(errors.some((e) => e.includes('Date'))); assert.ok(errors.some((e) => e.includes('Math[random]')));
});
test('dynamic imports, re-exports and type imports obey boundaries', (t) => {
  const errors = check(t, { 'modules/a/index.ts': "export * from 'phaser'; const a=import('zustand'); type B=import('xstate').Actor; const x=import(name);" });
  assert.equal(errors.length, 4);
});
