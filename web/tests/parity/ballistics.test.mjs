import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { GridBallistica } from '../../src/modules/grid/index.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command}: ${result.stderr}`);
  return result.stdout;
}
const mask = (predicate) => Array.from({ length: 1024 }, (_, cell) => Boolean(predicate(cell)));
function openWorld() {
  return { passable: mask(() => true), avoid: mask(() => false), losBlocking: mask(() => false), occupied: mask(() => false) };
}
function fixtures() {
  const open = openWorld();
  const border = cell => cell < 32 || cell >= 992 || cell % 32 === 0 || cell % 32 === 31;
  const worlds = [
    open,
    { ...openWorld(), passable: mask(c => !border(c)), losBlocking: mask(border) },
    { ...openWorld(), passable: mask(() => false) },
    { ...openWorld(), passable: mask(() => false), avoid: mask(() => true) },
    { ...openWorld(), losBlocking: mask(c => c % 7 === 0) },
    { ...openWorld(), occupied: mask(c => c % 5 === 0) },
  ];
  // Deterministic fixture generation is not expected-result logic or gameplay RNG.
  let seed = 0x42414c4c;
  const draw = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let i = 0; i < 4; i++) worlds.push({
    passable: mask(() => draw() > 0.15), avoid: mask(() => draw() > 0.75),
    losBlocking: mask(() => draw() > 0.90), occupied: mask(() => draw() > 0.90),
  });
  const cells = [0, 31, 32, 33, 62, 63, 64, 65, 495, 496, 511, 512, 528, 992, 1023];
  const entries = [];
  for (const world of worlds) {
    for (const from of cells) for (const to of cells) for (const magic of [false, true]) for (const hitChars of [false, true]) {
      entries.push({ method: 'cast', from, to, magic, hitChars, world });
    }
    for (const to of cells) entries.push({ method: 'repeat', from: 33, to, magic: false, hitChars: true, world });
  }
  return entries;
}
function host(world) {
  const queries = [];
  return { queries, port: {
    passable: world.passable, avoid: world.avoid, losBlocking: world.losBlocking,
    hasCharacter(cell) { queries.push(cell); return world.occupied[cell]; },
  } };
}
function evaluate(e) {
  const ballistica = new GridBallistica(32, 32);
  const { queries, port } = host(e.world);
  const cast = (from, to, magic, hitChars) => {
    try { return `cell:${ballistica.cast(from, to, magic, hitChars, port)}`; }
    catch (error) { if (!(error instanceof RangeError)) throw error; return 'error:array-bounds'; }
  };
  if (e.method === 'repeat') cast(33, 45, false, false);
  const result = cast(e.from, e.to, e.magic, e.hitChars);
  return [result, ballistica.distance, ballistica.copyTrace().join(','), queries.join(',')].join('\t');
}

test('trajectories, collisions, distance, full reused trace and occupancy query order match Java', (t) => {
  const reference = join(root, 'tests/reference/ballistics/Ballistica.java');
  const bytes = readFileSync(reference);
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), '7dc0aca57188f09001a5b48299a1b219401cbbcb');
  const tmp = join(root, 'tmp'); mkdirSync(tmp, { recursive: true });
  const out = mkdtempSync(join(tmp, 'ballistica-oracle-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  run('javac', ['-proc:none', '-encoding', 'UTF-8', '-d', out, reference,
    ...['Level.java', 'Actor.java', 'BallisticaOracle.java'].map(p => join(root, 'tools/port/oracle/ballistics', p))]);
  const entries = fixtures();
  const bits = values => values.map(Number).join('');
  const input = entries.map(e => [e.method, e.from, e.to, e.magic, e.hitChars,
    bits(e.world.passable), bits(e.world.avoid), bits(e.world.losBlocking), bits(e.world.occupied)].join('|')).join('\n') + '\n';
  const expected = run('java', ['-cp', out, 'port.oracle.BallisticaOracle'], { input }).split('\n');
  assert.equal(expected.pop(), ''); assert.equal(expected.length, entries.length);
  let failures = 0;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    assert.equal(evaluate(e), expected[i], `case ${i}: ${e.method} ${e.from}->${e.to} magic=${e.magic} hitChars=${e.hitChars}`);
    if (expected[i].startsWith('error:')) failures++;
  }
  t.diagnostic(`${entries.length} original-Java comparisons; ${failures} preserved failures; input-only Actor/Level adapters, not Android integration`);
});

test('normal casts duplicate the target, including a cast to the same cell', () => {
  const cast = new GridBallistica(32, 32); const { port } = host(openWorld());
  assert.equal(cast.cast(33, 35, false, false, port), 35);
  assert.equal(cast.distance, 4); assert.deepEqual([...cast.copyTrace().slice(0, 4)], [33, 34, 35, 35]);
  assert.equal(cast.cast(33, 33, false, false, port), 33);
  assert.equal(cast.distance, 2); assert.deepEqual([...cast.copyTrace().slice(0, 2)], [33, 33]);
});

test('an impassable wall returns the previous cell and leaves its trace outside active distance', () => {
  const world = openWorld(); world.passable[34] = false;
  const { port, queries } = host(world); const cast = new GridBallistica(32, 32);
  assert.equal(cast.cast(33, 35, false, true, port), 33);
  assert.equal(cast.distance, 1); assert.equal(cast.traceAt(1), 34); assert.deepEqual(queries, []);
});

test('losBlocking short-circuits character lookup and magic can pass the target', () => {
  const world = openWorld(); world.losBlocking[34] = true;
  const { port, queries } = host(world); const cast = new GridBallistica(32, 32);
  assert.equal(cast.cast(33, 35, false, true, port), 34); assert.deepEqual(queries, []);
  world.losBlocking[34] = false; world.passable[36] = false;
  assert.equal(cast.cast(33, 35, true, false, port), 35);
  assert.equal(cast.distance, 3); assert.equal(cast.traceAt(3), 36);
});

test('post-increment is retained when the fixed trace capacity is exceeded', () => {
  const { port } = host(openWorld()); const cast = new GridBallistica(32, 32);
  assert.throws(() => cast.cast(0, 31, false, false, port), RangeError);
  assert.equal(cast.distance, 33); assert.equal(cast.traceAt(31), 31);
});

test('trace reuse retains the old tail, but instances and returned copies stay independent', () => {
  const { port } = host(openWorld()); const a = new GridBallistica(32, 32); const b = new GridBallistica(32, 32);
  a.cast(33, 40, false, false, port); a.cast(33, 34, false, false, port);
  assert.equal(a.traceAt(3), 36); const copy = a.copyTrace(); copy.fill(-1);
  assert.equal(a.traceAt(0), 33); assert.equal(b.distance, 0); assert.equal(b.traceAt(0), 0);
});
