import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { JavaRandom, toJavaInt } from '../../src/modules/compatibility/index.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const sourceFile = join(root, 'tests/reference/random/Random.java');
const expectedBlob = 'cc6ce01ae51678da114ee1e0d26485717107704c';

function referenceBlob() {
  const bytes = readFileSync(sourceFile);
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

function tape(values) {
  let position = 0;
  return {
    nextDouble() {
      if (position >= values.length) throw new Error('TS draw tape exhausted');
      const value = values[position++];
      assert.ok(Number.isFinite(value) && value >= 0 && value < 1, 'invalid test draw');
      return value;
    },
    consumed: () => position,
  };
}

function resultFor(entry) {
  const source = tape(entry.draws);
  const random = new JavaRandom(source);
  let result;
  try {
    const value = entry.method === 'cast'
      ? toJavaInt(entry.args[0])
      : entry.method === 'weightedIndex'
        ? random.weightedIndex(entry.args)
        : random[entry.method](...entry.args);
    if (entry.method.startsWith('float')) {
      const view = new DataView(new ArrayBuffer(4));
      view.setFloat32(0, value);
      result = `f:${view.getUint32(0)}`;
    } else {
      assert.equal(Object.is(value, -0), false, 'Java int must not be negative zero');
      result = `i:${value}`;
    }
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    result = 'error:array-bounds';
  }
  return `${result}\t${source.consumed()}`;
}

function numberText(value) {
  return Object.is(value, -0) ? '-0.0' : String(value);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024, ...options,
  });
  if (result.error) throw new Error(`${command} is required for original-Java parity`, { cause: result.error });
  assert.equal(result.status, 0, `${command} failed: ${result.stderr}`);
  return result.stdout.trimEnd();
}

function cases() {
  const entries = [];
  const add = (method, args, draws = []) => entries.push({ method, args, draws });
  const draws = [0, Number.MIN_VALUE, 2 ** -24, 0.125, 0.4999999701976776, 0.5, 0.9999999701976776, 1 - 2 ** -53];
  // This seeded sequence generates TEST INPUTS only, never expected results or gameplay RNG.
  let seed = 0x5eed;
  for (let i = 0; i < 64; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    draws.push(seed / 2 ** 32);
  }
  const ranges = [[0, 1], [-7, 2], [-10, -1], [7, 7], [10, 2], [-2147483648, 2147483647], [2147483647, -2147483648], [2147483646, 2147483647]];
  const floatRanges = [[-1, 1], [-16777217, 16777217], [1.00000006, 1.00000018], [-1e38, 1e38], [7, 7], [10, -2], [-0, 0]];
  const weights = [[1], [0], [1, 2, 3], [0, 0, 0], [0, 1], [1e-40, 1e-40, 1e-40], [16777216, 1, 1], []];
  for (const draw of draws) {
    add('float', [], [draw]);
    for (const max of [-0, 0, -1, 1, 1.00000006, 16777217, 1e38]) add('floatTo', [max], [draw]);
    for (const range of floatRanges) add('floatBetween', range, [draw]);
    for (const max of [-2147483648, -1, 0, 1, 3, 2147483647]) add('intTo', [max], [draw]);
    for (const range of ranges) {
      add('intBetween', range, [draw]);
      add('intRange', range, [draw]);
      for (const second of [0, 0.5, 1 - 2 ** -53]) add('normalIntRange', range, [draw, second]);
    }
    for (const values of weights) add('weightedIndex', values, [draw]);
  }
  for (const value of [NaN, Infinity, -Infinity, -0, -0.9, 0.9, -1.9, 1.9, 2147483646.9, 2147483647, 2147483648, -2147483648, -2147483649, Number.MAX_VALUE]) add('cast', [value]);
  return entries;
}

test('reference is byte-identical to the pinned PD-classes blob', () => {
  assert.equal(referenceBlob(), expectedBlob);
});

test('all supported operations match original Java results, float bits and draw counts', (t) => {
  assert.equal(referenceBlob(), expectedBlob, 'Refusing an edited oracle source');
  const tmp = join(root, 'tmp');
  mkdirSync(tmp, { recursive: true });
  const output = mkdtempSync(join(tmp, 'random-oracle-'));
  t.after(() => rmSync(output, { recursive: true, force: true }));
  run('javac', ['-proc:none', '-encoding', 'UTF-8', '-d', output, sourceFile,
    join(root, 'tools/port/oracle/random/RandomOracle.java')]);
  const entries = cases();
  const input = entries.map(({ method, args, draws }) =>
    `${method}\t${args.map(numberText).join(',')}\t${draws.map(numberText).join(',')}`).join('\n') + '\n';
  const expected = run('java', ['-cp', output, 'com.watabou.utils.RandomOracle'], { input }).split('\n');
  assert.equal(expected.length, entries.length);
  entries.forEach((entry, index) => {
    assert.equal(resultFor(entry), expected[index], `case ${index}: ${JSON.stringify(entry)}`);
  });
  t.diagnostic(`${entries.length} original-Java comparisons; expected values are NOT computed by the TS implementation`);
});

test('non-positive Int(max) draws nothing, but equal ranges retain their draws', () => {
  const source = tape([0.25, 0.5, 0.75, 0.125]);
  const random = new JavaRandom(source);
  assert.equal(random.intTo(0), 0);
  assert.equal(random.intTo(-3), 0);
  assert.equal(source.consumed(), 0);
  assert.equal(random.intBetween(7, 7), 7);
  assert.equal(source.consumed(), 1);
  assert.equal(random.normalIntRange(7, 7), 7);
  assert.equal(source.consumed(), 3);
  assert.equal(random.float(), 0.125);
});

test('near-one float32 draw preserves the original weighted-array failure', () => {
  const source = tape([1 - 2 ** -53]);
  assert.throws(() => new JavaRandom(source).weightedIndex([1]), RangeError);
  assert.equal(source.consumed(), 1);
});

test('empty weights fail before any draw; all-zero weights fail after one draw', () => {
  const empty = tape([]);
  assert.throws(() => new JavaRandom(empty).weightedIndex([]), RangeError);
  assert.equal(empty.consumed(), 0);
  const zero = tape([0.5]);
  assert.throws(() => new JavaRandom(zero).weightedIndex([0, 0]), RangeError);
  assert.equal(zero.consumed(), 1);
});

test('instances neither start nor share a hidden random source', () => {
  const first = tape([0.25]);
  const second = tape([0.75]);
  const a = new JavaRandom(first);
  const b = new JavaRandom(second);
  assert.equal(first.consumed(), 0);
  assert.equal(second.consumed(), 0);
  assert.equal(a.float(), 0.25);
  assert.equal(b.float(), 0.75);
  assert.throws(() => a.float(), /exhausted/);
});

test('weighted selection does not mutate trusted caller data', () => {
  const weights = [1, 2, 3];
  new JavaRandom(tape([0.5])).weightedIndex(weights);
  assert.deepEqual(weights, [1, 2, 3]);
});
