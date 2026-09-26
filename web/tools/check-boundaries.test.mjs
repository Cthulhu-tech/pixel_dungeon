import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBoundaries } from './check-boundaries.mjs';
function check(t, files) {
  const scratch = fileURLToPath(new URL('../../tmp/', import.meta.url));
  mkdirSync(scratch, { recursive: true });
  const root = mkdtempSync(join(scratch, 'pd-boundaries-'));
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
  assert.ok(errors.some(e => e.includes('Type imports')));
  assert.ok(errors.some(e => e.includes('Computed dynamic imports')));
});

test('a scheduler process method and port properties are not Node or browser globals', (t) => {
  assert.deepEqual(check(t, { 'modules/a/index.ts': 'export class Scheduler { process() {} resume() { this.process(); } } const port = { fetch() {}, process: 1 }; port.fetch();' }), []);
});
test('real global reads and shorthand references are still rejected', (t) => {
  const errors = check(t, { 'modules/a/index.ts': 'const a=process.env; const b={process}; const c=Date.now(); const d=globalThis["window"];' });
  assert.equal(errors.filter(e => e.endsWith(': process')).length, 2);
  assert.ok(errors.some(e => e.endsWith(': Date')));
  assert.ok(errors.some(e => e.endsWith(': globalThis')));
});

test('trusted owner JSON imports are allowed but another module assets are not', (t) => {
  const files = { 'modules/a/index.ts': "import data from './assets/data.json' with {type:'json'};", 'modules/a/assets/data.json': '{"n":1}' };
  assert.deepEqual(check(t, files), []);
  files['modules/a/index.ts'] = "import data from '../b/assets/data.json' with {type:'json'};";
  files['modules/b/assets/data.json'] = '{"n":1}';
  assert.ok(check(t, files).some(e => e.includes('owning module assets')));
});

test('ambient owner declarations pass, own type definitions and type imports outside them fail', t => {
  assert.deepEqual(check(t, {'types/test/ports.d.ts': 'interface PDTest { value: number }',
    'modules/a/index.ts': 'export function read(input: PDTest) {return input.value;}'}), []);
  const errors=check(t, {'app/a.ts': "export type A=number; interface B{}; import type T from 'xstate';",
    'types/a/ports.d.ts': 'export interface Bad {}'});
  assert.equal(errors.filter(e=>e.includes('Own type/interface')).length,2);
  assert.ok(errors.some(e=>e.includes('Type imports')));
  assert.ok(errors.some(e=>e.includes('ambient, not exported')));
});
test('physical owner shaders pass; inline/generated/cross-owner shader sources fail', t => {
  const files={'adapters/phaser/shaders/sprite.frag.glsl': 'void main(){}',
    'adapters/phaser/a.ts': "import fragmentSource from './shaders/sprite.frag.glsl?raw'; export const shader={fragmentSource};"};
  assert.deepEqual(check(t,files),[]);
  const errors=check(t,{...files,'adapters/other/a.ts': "import fs from '../phaser/shaders/sprite.frag.glsl?raw';",
    'adapters/phaser/b.ts': "const fragmentSource='void main(){}'; export const shader={fragmentSource};"});
  assert.ok(errors.some(e=>e.includes('owning-adapter')));
  assert.ok(errors.some(e=>e.includes('Inline GLSL')));
  assert.ok(errors.some(e=>e.includes('unmodified physical')));
});
