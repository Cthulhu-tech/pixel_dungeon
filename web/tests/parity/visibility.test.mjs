import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { GridShadowCaster } from '../../src/modules/grid/index.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const bits = values => Array.from(values, Number).join('');
const mask = predicate => Array.from({ length: 1024 }, (_, cell) => Boolean(predicate(cell)));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command}: ${result.stderr}`);
  return result.stdout;
}
function fixtures() {
  const worlds = [
    mask(() => false), mask(() => true),
    mask(c => c < 32 || c >= 992 || c % 32 === 0 || c % 32 === 31),
    mask(c => c % 32 === 16), mask(c => Math.floor(c / 32) === 16),
    mask(c => c % 32 === 16 && c >= 512 || Math.floor(c / 32) === 16 && c % 32 >= 16),
    mask(c => (c % 32 + Math.floor(c / 32)) % 2 === 0),
    mask(c => c % 32 === Math.floor(c / 32)),
  ];
  // This generates INPUT masks only; Java computes every expected visibility bit.
  let seed = 0x53484144;
  const draw = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (const density of [0.05, 0.15, 0.3, 0.5, 0.7, 0.9]) worlds.push(mask(() => draw() < density));
  const coordinates = [0, 1, 7, 15, 16, 24, 30, 31];
  const entries = [];
  const add = (method, x, y, radius, blockers, initial) => entries.push({ method, x, y, radius, blockers, initial });
  for (const blockers of worlds) {
    for (const x of coordinates) for (const y of coordinates) for (let radius = 0; radius <= 8; radius++) {
      add('cast', x, y, radius, blockers, (x + y + radius) % 2 === 0);
    }
    for (const [x, y] of [[0, 0], [31, 0], [0, 31], [31, 31]]) {
      for (const radius of [-1, 9]) add('cast', x, y, radius, blockers, true);
    }
    for (const method of ['repeat', 'alias']) for (const radius of [0, 3, 8]) add(method, 16, 16, radius, blockers, true);
  }
  return entries;
}
function evaluate(e) {
  const caster = new GridShadowCaster(32, 32);
  const blockers = Uint8Array.from(e.blockers, Number);
  const output = e.method === 'alias' ? blockers : new Uint8Array(1024).fill(Number(e.initial));
  let result = 'ok';
  try {
    if (e.method === 'repeat') caster.castShadow(16, 16, output, 8, blockers);
    caster.castShadow(e.x, e.y, output, e.radius, blockers);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    result = 'error:array-bounds';
  }
  return [result, bits(output), bits(blockers)].join('\t');
}

test('all visibility cells, blocker state and invalid-radius failures match original Java', (t) => {
  const reference = join(root, 'tests/reference/visibility/ShadowCaster.java');
  const bytes = readFileSync(reference);
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), '566fc3b7725ec80d773b2571df4b7491e16b1ba0');
  const tmp = join(root, 'tmp'); mkdirSync(tmp, { recursive: true });
  const out = mkdtempSync(join(tmp, 'shadowcaster-oracle-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  run('javac', ['-proc:none', '-encoding', 'UTF-8', '-d', out, reference,
    join(root, 'tools/port/oracle/ballistics/Level.java'), join(root, 'tools/port/oracle/visibility/ShadowCasterOracle.java')]);
  const entries = fixtures();
  const input = entries.map(e => [e.method, e.x, e.y, e.radius, e.initial, bits(e.blockers)].join('|')).join('\n') + '\n';
  const expected = run('java', ['-cp', out, 'port.oracle.ShadowCasterOracle'], { input }).trimEnd().split('\n');
  assert.equal(expected.length, entries.length);
  let failures = 0;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    assert.equal(evaluate(e), expected[i], `case ${i}: ${e.method} origin=${e.x},${e.y} radius=${e.radius}`);
    if (expected[i].startsWith('error:')) failures++;
  }
  t.diagnostic(`${entries.length} original-Java visibility comparisons; ${failures} invalid-radius cases; all 1024 cells compared`);
});

test('radius zero clears previous visibility and leaves only the origin', () => {
  const caster = new GridShadowCaster(32, 32); const output = new Uint8Array(1024).fill(1);
  caster.castShadow(16, 16, output, 0, new Uint8Array(1024));
  assert.equal(output.reduce((sum, v) => sum + v, 0), 1);
  assert.equal(output[528], 1);
});

test('an unsupported radius fails before clearing the caller output', () => {
  const caster = new GridShadowCaster(32, 32); const output = new Uint8Array(1024).fill(1);
  for (const radius of [-1, 9]) {
    assert.throws(() => caster.castShadow(16, 16, output, radius, new Uint8Array(1024)), RangeError);
    assert.ok(output.every(v => v === 1));
  }
});

test('the blocker itself is visible while an axial cell behind it is occluded', () => {
  const caster = new GridShadowCaster(32, 32); const output = new Uint8Array(1024);
  const blockers = new Uint8Array(1024); blockers[16 * 32 + 17] = 1;
  caster.castShadow(16, 16, output, 8, blockers);
  assert.equal(output[16 * 32 + 17], 1);
  assert.equal(output[16 * 32 + 18], 0);
  assert.equal(output[16 * 32 + 15], 1);
});

test('repeated casts reset scratch and output without mutating a separate blocker mask', () => {
  const caster = new GridShadowCaster(32, 32); const output = new Uint8Array(1024);
  const blocked = new Uint8Array(1024).fill(1); const open = new Uint8Array(1024);
  caster.castShadow(16, 16, output, 8, blocked);
  assert.ok(blocked.every(v => v === 1));
  caster.castShadow(1, 1, output, 3, open);
  const expected = new Uint8Array(1024); new GridShadowCaster(32, 32).castShadow(1, 1, expected, 3, open);
  assert.deepEqual(output, expected); assert.ok(open.every(v => v === 0));
});

test('separate caster instances and output buffers are independent', () => {
  const a = new GridShadowCaster(32, 32); const b = new GridShadowCaster(32, 32);
  const first = new Uint8Array(1024); const second = new Uint8Array(1024);
  a.castShadow(0, 0, first, 8, new Uint8Array(1024)); const before = first.slice();
  b.castShadow(31, 31, second, 2, new Uint8Array(1024).fill(1));
  assert.deepEqual(first, before); assert.notDeepEqual(first, second);
});
