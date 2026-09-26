import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { GridPathFinder } from '../../src/modules/grid/index.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command}: ${result.stderr}`);
  return result.stdout;
}
function fixtures() {
  const entries = [];
  let seed = 0x50415448;
  const draw = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (const [width, height] of [[3, 3], [4, 5], [8, 8], [32, 32]]) {
    const size = width * height;
    const masks = [
      Array(size).fill(false), Array(size).fill(true),
      Array.from({ length: size }, (_, c) => c >= width && c < size - width && c % width > 0 && c % width < width - 1),
      Array.from({ length: size }, (_, c) => c % 2 === 0),
      Array.from({ length: size }, (_, c) => c % width === 1 || Math.floor(c / width) === 1),
      Array.from({ length: size }, (_, c) => Math.floor(c / width) !== Math.floor(height / 2)),
    ];
    for (let i = 0; i < 8; i++) masks.push(Array.from({ length: size }, () => draw() > i / 10));
    const cells = [...new Set([0, size - 1, width + 1, size - width - 2, Math.floor(size / 2)])];
    const add = (method, from, to, mask, limit = 2147483647) => entries.push({ method, width, height, from, to, mask, limit });
    for (const mask of masks) {
      for (const from of cells) for (const to of cells) for (const method of ['find', 'step', 'back']) add(method, from, to, mask);
      for (const to of cells) for (const limit of [-1, 0, 1, 2, 4, 2147483647]) add('map', 0, to, mask, limit);
      for (const to of cells) add('unlimited', 0, to, mask);
      for (const method of ['same', 'reshape', 'resize']) add(method, cells[0], cells.at(-1), mask, 4);
    }
  }
  return entries;
}
function evaluate(e) {
  const finder = new GridPathFinder(e.width, e.height);
  let result;
  try {
    const path = (p) => p === null ? 'p:null' : `p:${p.join(',')}`;
    switch (e.method) {
      case 'find': result = path(finder.find(e.from, e.to, e.mask)); break;
      case 'step': result = `s:${finder.getStep(e.from, e.to, e.mask)}`; break;
      case 'back': result = `s:${finder.getStepBack(e.from, e.to, e.mask)}`; break;
      case 'same': finder.buildDistanceMap(e.to, e.mask, e.limit); result = path(finder.find(e.to, e.to, e.mask)); break;
      case 'reshape': finder.setMapSize(e.height, e.width); finder.buildDistanceMap(e.to, e.mask, e.limit); result = 'map'; break;
      case 'resize': finder.setMapSize(2, 3); finder.setMapSize(e.width, e.height); finder.buildDistanceMap(e.to, e.mask, e.limit); result = 'map'; break;
      case 'unlimited': finder.buildDistanceMap(e.to, e.mask, 2147483647); result = 'map'; break;
      case 'map': finder.buildDistanceMap(e.to, e.mask, e.limit); result = 'map'; break;
      default: throw new Error(`Unknown test operation ${e.method}`);
    }
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    result = 'error:array-bounds';
  }
  return `${result}\t${finder.copyDistanceMap().join(',')}`;
}

test('exact paths, next steps, retreat, limits and full distance buffers match original Java', (t) => {
  const reference = join(root, 'tests/reference/pathfinding/PathFinder.java');
  const bytes = readFileSync(reference);
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), 'd58524776566aaf0d835200a6c797ba65a3d61fa');
  const tmp = join(root, 'tmp'); mkdirSync(tmp, { recursive: true });
  const out = mkdtempSync(join(tmp, 'pathfinder-oracle-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  run('javac', ['-proc:none', '-encoding', 'UTF-8', '-d', out, reference, join(root, 'tools/port/oracle/pathfinding/PathFinderOracle.java')]);
  const entries = fixtures();
  const input = entries.map(e => [e.method, e.width, e.height, e.from, e.to, e.limit, e.mask.map(Number).join('')].join('|')).join('\n') + '\n';
  const expected = run('java', ['-cp', out, 'port.oracle.PathFinderOracle'], { input }).trimEnd().split('\n');
  assert.equal(expected.length, entries.length);
  let failures = 0;
  for (let i = 0; i < entries.length; i++) {
    assert.equal(evaluate(entries[i]), expected[i], `case ${i}: ${JSON.stringify(entries[i])}`);
    if (expected[i].startsWith('error:')) failures++;
  }
  t.diagnostic(`${entries.length} original-Java comparisons, including ${failures} preserved failure outcomes and partial distance buffers`);
});

test('equal endpoints preserve the previous distance map and return null/-1', () => {
  const finder = new GridPathFinder(5, 5); const mask = Array(25).fill(true);
  finder.buildDistanceMap(12, mask, 2); const before = finder.copyDistanceMap();
  assert.equal(finder.find(12, 12, mask), null);
  assert.equal(finder.getStep(12, 12, mask), -1);
  assert.deepEqual(finder.copyDistanceMap(), before);
});

test('same-area reshape preserves source direction offsets; changed area reallocates', () => {
  const finder = new GridPathFinder(4, 5); const other = new GridPathFinder(4, 5);
  const mask = Array(20).fill(true);
  finder.setMapSize(5, 4); finder.buildDistanceMap(6, mask, 1); other.buildDistanceMap(6, mask, 1);
  assert.deepEqual(finder.copyDistanceMap(), other.copyDistanceMap());
  finder.setMapSize(5, 5); assert.equal(finder.copyDistanceMap().length, 25);
  assert.ok(finder.copyDistanceMap().every(value => value === 0));
});

test('raw pathfinder retains flattened row adjacency instead of inventing geometry checks', () => {
  const finder = new GridPathFinder(4, 5);
  finder.buildDistanceMap(7, Array(20).fill(true), 1);
  assert.equal(finder.distanceAt(8), 1);
});

test('caller masks, distance snapshots and separate instances have independent ownership', () => {
  const a = new GridPathFinder(5, 5); const b = new GridPathFinder(5, 5);
  const mask = Array(25).fill(true); const before = [...mask];
  a.buildDistanceMap(12, mask, 2); const copy = a.copyDistanceMap(); copy.fill(-17);
  assert.equal(a.distanceAt(12), 0); assert.deepEqual(mask, before);
  assert.ok(b.copyDistanceMap().every(value => value === 0));
});
