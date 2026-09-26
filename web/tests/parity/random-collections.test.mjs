import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { JavaRandom } from '../../src/modules/compatibility/index.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const reference = join(root, 'tests/reference/random/Random.java');
const csv = (values) => values.map(String).join(',');
const items = (value) => value === '' ? [] : value.split(',').map(v => v === 'null' ? null : Number(v));
function tape(values) {
  let cursor = 0;
  return {
    nextDouble() {
      assert.ok(cursor < values.length, 'Draw tape exhausted');
      return values[cursor++];
    },
    consumed: () => cursor,
  };
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command}: ${result.stderr}`);
  return result.stdout;
}
function cases() {
  const entries = [];
  const traces = [0, 2 ** -24, 0.125, 0.5, 0.9999999701976776, 1 - 2 ** -53].map(v => Array(40).fill(v));
  // Seeded test INPUTS only. Every expected outcome comes from unmodified Java.
  let state = 0x715eed;
  for (let n = 0; n < 24; n++) traces.push(Array.from({ length: 40 }, () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  }));
  const add = (method, first, draws, second = [], max = 0, weights = []) => entries.push({ method, first, second, max, weights, draws });
  for (const n of [0, 1, 2, 3, 5, 8, 17]) {
    const first = Array.from({ length: n }, (_, i) => i === 1 ? null : (i * 16) - 3);
    for (const draws of traces) {
      for (const method of ['collectionIndex', 'oneOf', 'element', 'collectionElement', 'shuffle', 'shuffleSame']) add(method, first, draws);
      for (const max of [-3, -1, 0, 1, n, n + 3]) add('elementWithin', first, draws, [], max);
      for (const length of new Set([0, 1, Math.max(0, n - 1), n, n + 2])) add('shufflePair', first, draws, Array.from({ length }, (_, i) => 100 + i));
      for (const weights of [first.map(() => 1), first.map(() => 0), first.map((_, i) => i + 1), first.map((_, i) => i === 0 ? 16777216 : 1)]) add('weightedKey', first, draws, [], 0, weights);
    }
  }
  return entries;
}
function actual(entry, observedOrder) {
  const source = tape(entry.draws);
  const random = new JavaRandom(source);
  const first = [...entry.first];
  const second = [...entry.second];
  let result;
  try {
    switch (entry.method) {
      case 'shuffle': random.shuffle(first); result = 'ok'; break;
      case 'shufflePair': random.shufflePair(first, second); result = 'ok'; break;
      case 'shuffleSame': random.shufflePair(first, first); result = 'ok'; break;
      case 'weightedKey': {
        const weights = new Map(entry.first.map((key, index) => [key, entry.weights[index]]));
        result = `v:${random.weightedKey(observedOrder.map(key => ({ key, weight: weights.get(key) })))}`;
        break;
      }
      case 'oneOf': result = `v:${random.oneOf(...first)}`; break;
      case 'elementWithin': result = `v:${random.elementWithin(first, entry.max)}`; break;
      default: result = `v:${random[entry.method](first)}`;
    }
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    result = 'error:array-bounds';
  }
  return [result, csv(first), csv(second), String(source.consumed())].join('\t');
}

test('collection operations match Java, including order, consumed draws and partial mutations', (t) => {
  const bytes = readFileSync(reference);
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), 'cc6ce01ae51678da114ee1e0d26485717107704c');
  const tmp = join(root, 'tmp'); mkdirSync(tmp, { recursive: true });
  const out = mkdtempSync(join(tmp, 'random-collections-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  run('javac', ['-proc:none', '-encoding', 'UTF-8', '-d', out, reference,
    join(root, 'tools/port/oracle/random/RandomOracle.java'), join(root, 'tools/port/oracle/random/RandomCollectionsOracle.java')]);
  const entries = cases();
  const input = entries.map(e => [e.method, csv(e.first), csv(e.second), csv(e.weights), e.max, csv(e.draws)].join('\t')).join('\n') + '\n';
  const expected = run('java', ['-cp', out, 'com.watabou.utils.RandomCollectionsOracle'], { input }).trimEnd().split('\n');
  assert.equal(expected.length, entries.length);
  for (let i = 0; i < entries.length; i++) {
    const fields = expected[i].split('\t');
    // The map's order is exported by Java, NOT assumed to be JS insertion order.
    assert.equal(actual(entries[i], items(fields[4] ?? '')), fields.slice(0, 4).join('\t'), `case ${i}: ${JSON.stringify(entries[i])}`);
  }
  t.diagnostic(`${entries.length} original-Java collection comparisons; map order is an explicit oracle input`);
});

test('empty collection index draws once, collection selection draws nothing, array selection throws after drawing', () => {
  const source = tape([0.5, 0.5]); const random = new JavaRandom(source);
  assert.equal(random.collectionIndex([]), 0);
  assert.equal(random.collectionElement([]), null);
  assert.equal(source.consumed(), 1);
  assert.throws(() => random.element([]), RangeError);
  assert.equal(source.consumed(), 2);
});

test('empty map consumes a draw before failing, empty float array does not', () => {
  const source = tape([0.5]); const random = new JavaRandom(source);
  assert.throws(() => random.weightedIndex([]), RangeError);
  assert.equal(source.consumed(), 0);
  assert.throws(() => random.weightedKey([]), RangeError);
  assert.equal(source.consumed(), 1);
});

test('paired shuffle preserves the first mutation before an invalid second-array access', () => {
  const first = ['a', 'b']; const second = [];
  assert.throws(() => new JavaRandom(tape([0.75])).shufflePair(first, second), RangeError);
  assert.deepEqual(first, ['b', 'a']); assert.deepEqual(second, []);
});

test('paired aliases are swapped twice and retain source identity', () => {
  const values = [null, 'b', 'c'];
  new JavaRandom(tape([0.9, 0.9])).shufflePair(values, values);
  assert.deepEqual(values, [null, 'b', 'c']);
});

test('selection returns the original reference, never clones content', () => {
  const item = { id: 'original' }; const random = new JavaRandom(tape([0.9, 0.9]));
  assert.equal(random.element([null, item]), item);
  assert.equal(random.weightedKey([{ key: item, weight: 1 }]), item);
});
