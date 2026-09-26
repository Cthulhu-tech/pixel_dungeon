import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { TurnScheduler } from '../../src/modules/turns/index.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command}: ${result.stderr}`);
  return result.stdout;
}
function bits(value) {
  if (Number.isNaN(value)) return '2143289344'; // Java Float.floatToIntBits canonical NaN.
  const data = new DataView(new ArrayBuffer(4)); data.setFloat32(0, value);
  return String(data.getUint32(0));
}
const name = actor => actor === null ? '-' : actor.name;

/** Scripted participants provide inputs only; expected scheduling is computed by Java. */
class Host {
  constructor() { this.reset(); }
  reset() {
    this.actors = new Map(); this.events = []; this.members = new Set();
    this.hero = null; this.duration = 0; this.actCalls = 0;
    this.scheduler = new TurnScheduler(1024, this.members, {
      hero: () => this.hero,
      heroIsAlive: () => this.hero.alive,
      addDuration: elapsed => { this.duration = Math.fround(this.duration + elapsed); },
    });
  }
  make(name, kind, time, id, position) {
    const actor = {
      name, kind, position, moving: false, alive: true, attached: new Set(), actions: [],
      character: null,
      onAdd: () => this.events.push(`add(${name})`),
      onRemove: () => this.events.push(`remove(${name})`),
      act: () => this.act(actor),
    };
    if (kind === 'hero' || kind === 'mob') actor.character = {
      get position() { return actor.position; },
      get isMoving() { return actor.moving; },
      buffs: () => actor.attached,
    };
    if (kind === 'hero') this.hero = actor;
    this.actors.set(name, actor);
    this.scheduler.restoreClock(actor, { time, id });
    return actor;
  }
  act(actor) {
    this.events.push(`act(${actor.name})`);
    assert.ok(++this.actCalls <= 10000, 'Unbounded test action script');
    if (actor.actions.length === 0) return false;
    const a = actor.actions.shift().split(','); const scheduler = this.scheduler;
    switch (a[0]) {
      case 'S': scheduler.spend(actor, Number(a[1])); if (a[3] === '1') scheduler.next(actor); return a[2] === '1';
      case 'R': scheduler.remove(actor); return a[1] === '1';
      case 'K': scheduler.spend(actor, Number(a[1])); this.hero.alive = false; return a[2] === '1';
      case 'N': scheduler.next(actor); return a[1] === '1';
      case 'A': scheduler.add(this.actors.get(a[1])); scheduler.spend(actor, Number(a[2])); return a[3] === '1';
      case 'M': actor.position = Number(a[1]); scheduler.spend(actor, Number(a[2])); return a[3] === '1';
      case 'C': scheduler.clear(); return a[1] === '1';
      case 'D': scheduler.deactivate(actor); return a[1] === '1';
      default: throw new Error(`Unknown test behavior ${a[0]}`);
    }
  }
  command(input) {
    const c = input.split(':'); const actor = this.actors.get(c[1]) ?? null; const s = this.scheduler;
    switch (c[0]) {
      case 'reset': this.reset(); break;
      case 'new': this.make(c[1], c[2], Number(c[3]), Number(c[4]), Number(c[5])); break;
      case 'add': s.add(actor); break;
      case 'delay': s.addDelayed(actor, Number(c[2])); break;
      case 'remove': s.remove(actor); break;
      case 'spend': s.spend(actor, Number(c[2])); break;
      case 'postpone': s.postpone(actor, Number(c[2])); break;
      case 'deactivate': s.deactivate(actor); break;
      case 'restore': s.restoreClock(actor, { time: Number(c[2]), id: Number(c[3]) }); break;
      case 'id': return String(s.id(actor));
      case 'buff': actor.attached.add(this.actors.get(c[2])); break;
      case 'moving': actor.moving = c[2] === '1'; break;
      case 'move': actor.position = Number(c[2]); break;
      case 'alive': this.hero.alive = c[1] === '1'; break;
      case 'hero': this.hero = actor; break;
      case 'script': actor.actions = c[2] === '' ? [] : c[2].split('/'); break;
      case 'init': s.initialize(c[1] === '' ? [] : c[1].split(',').map(n => this.actors.get(n)), c[2] === '' ? [] : c[2].split(',').map(n => this.actors.get(n))); break;
      case 'process': s.process(); break;
      case 'next': s.next(actor); break;
      case 'fix': s.fixTime(); break;
      case 'clear': s.clear(); break;
      case 'occupy': s.occupyCell(actor); break;
      case 'free': s.freeCell(Number(c[1])); break;
      default: throw new Error(`Unknown test command ${input}`);
    }
    return '_';
  }
  snapshot(result) {
    const s = this.scheduler;
    const clocks = [...this.actors.values()].map(actor => {
      const clock = s.clockOf(actor);
      return [actor.name, bits(clock.time), clock.id, bits(s.cooldown(actor)), name(s.findById(clock.id))].join(',');
    });
    const occupied = [];
    for (let cell = 0; cell < 1024; cell++) {
      const actor = s.findChar(cell); if (actor !== null) occupied.push(`${cell}:${name(actor)}`);
    }
    const resultText = [result, bits(s.now), name(s.currentActor), bits(this.duration),
      s.list().map(name).join(','), clocks.join('/'), occupied.join(','), this.events.join(',')].join('|');
    this.events = []; return resultText;
  }
}
function fixtures() {
  const groups = [];
  const base = [
    'reset', 'new:h:hero:0:0:33', 'new:a:mob:0:4:34', 'new:b:mob:0:0:35',
    'new:f:buff:0:7:0', 'new:z:blob:0:0:0', 'new:c:actor:0:0:0',
  ];
  const add = steps => groups.push([...base, ...steps]);
  for (const initial of ['-0.0', '-1.401298464324817e-45', '0.1', '0.5', '1', '16777216', '3.4028234663852886e38']) {
    for (const cost of ['0', '0.1', '0.5', '1.5']) for (const reverse of [false, true]) {
      add([
        `restore:a:${initial}:4`, 'buff:h:f',
        `script:h:S,${cost},1,1/S,1,0,0`, `script:a:S,${cost},1,0/S,0.5,0,1`,
        'script:b:S,0.5,1,1/R,1', 'script:f:S,0.25,1,1/D,1',
        ...(reverse ? ['add:b','add:a','add:h'] : ['add:h','add:a','add:b']),
        'add:h', 'delay:a:100', 'process', 'process', 'next:h', 'process', 'next:a', 'process',
        'postpone:b:2', 'spend:c:0.1', 'delay:c:0.5', 'process', 'fix', 'remove:f', 'remove:f',
        'clear', 'process', 'next:h', 'next:a', 'next:b', 'next:c', 'process', 'init:a,b:z', 'process',
      ]);
    }
  }
  add(['add:h', 'id:h', 'id:a', 'add:a', 'id:b', 'add:b', 'remove:a', 'add:a', 'restore:b:0:4', 'remove:b', 'id:f', 'add:f', 'fix']);
  add(['restore:h:0:2147483647', 'add:h', 'id:c', 'id:c', 'restore:c:0:2', 'add:c', 'restore:z:0:2', 'add:z', 'remove:c']);
  add(['buff:h:f', 'add:f', 'delay:h:5', 'remove:h', 'add:h', 'remove:f', 'add:h', 'fix']);
  add(['init:a,b:z', 'script:h:S,1,0,0', 'process', 'next:a', 'process', 'next:h', 'process', 'fix']);
  add(['add:h', 'moving:h:1', 'process', 'process', 'moving:h:0', 'process', 'clear', 'process', 'next:h', 'process']);
  add(['add:h', 'script:h:K,1,1', 'process', 'process', 'next:h', 'alive:1', 'process']);
  add(['add:h', 'script:h:K,1,0', 'process', 'process', 'next:h', 'process']);
  add(['add:h', 'add:a', 'move:a:33', 'process', 'free:33', 'occupy:h', 'remove:h', 'next:h', 'process']);
  add(['add:h', 'script:h:A,a,1,1/M,40,1,0', 'script:a:R,1', 'process', 'next:h', 'process', 'fix']);
  for (const result of ['0','1']) for (const action of ['R', 'N', 'C', 'D']) {
    add(['add:h', `script:h:${action},${result}`, 'process', 'process', 'next:h', 'process', 'fix']);
  }
  for (const value of ['NaN','Infinity','-Infinity','-0.0','0.1','1.401298464324817e-45','3.4028234663852886e38']) {
    add([`restore:a:${value}:4`, 'add:h', 'add:a', `spend:h:${value}`, 'process', `postpone:a:${value}`, 'fix', 'clear', 'hero:null', 'fix']);
  }
  for (const cell of [-1,1024]) add([`move:a:${cell}`, 'add:a', 'process', 'free:34', 'remove:a', 'process']);
  // Deterministic input commands probe detached clocks and ID/member transitions.
  let seed = 0x5455524e;
  const draw = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  for (let scenario = 0; scenario < 24; scenario++) {
    const steps = [];
    for (let i = 0; i < 50; i++) {
      const actor = ['h','a','b','f','z','c'][draw(6)];
      const value = ['-0.5','0','0.1','0.5','1','3'][draw(6)];
      switch (draw(9)) {
        case 0: steps.push(`add:${actor}`); break;
        case 1: steps.push(`remove:${actor}`); break;
        case 2: steps.push(`delay:${actor}:${value}`); break;
        case 3: steps.push(`spend:${actor}:${value}`); break;
        case 4: steps.push(`postpone:${actor}:${value}`); break;
        case 5: steps.push(`id:${actor}`); break;
        case 6: steps.push('fix'); break;
        case 7: steps.push('process',`next:${actor}`); break;
        case 8: steps.push('clear'); break;
      }
    }
    add(steps);
  }
  return groups;
}

test('original Actor clocks, scheduling, callbacks, membership, IDs and occupancy match at every checkpoint', (t) => {
  const reference = join(root, 'tests/reference/turns/Actor.java'); const bytes = readFileSync(reference);
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), '2f91dd22a194d2d2a83f22c56930695a702100d8');
  const tmp = join(root, 'tmp'); mkdirSync(tmp, { recursive: true }); const out = mkdtempSync(join(tmp, 'turn-oracle-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const harness = join(root, 'tools/port/oracle/turns');
  run('javac', ['-proc:none', '-encoding', 'UTF-8', '-d', out, reference,
    ...readdirSync(harness).filter(p => p.endsWith('.java')).sort().map(p => join(harness, p))]);
  const groups = fixtures(); const commands = groups.flat();
  const expected = run('java', ['-cp', out, 'port.oracle.TurnOracle'], { input: commands.join('\n') + '\n' }).trimEnd().split('\n');
  assert.equal(expected.length, commands.length);
  const host = new Host(); let failures = 0;
  for (let i = 0; i < commands.length; i++) {
    let result;
    try { result = host.command(commands[i]); }
    catch (error) { if (!(error instanceof RangeError)) throw error; result = 'error:array-bounds'; }
    assert.equal(host.snapshot(result), expected[i], `checkpoint ${i}, command ${commands[i]}`);
    if (result.startsWith('error:')) failures++;
  }
  t.diagnostic(`${groups.length} scripted scenarios / ${commands.length} original-Java checkpoints; ${failures} preserved bounds failures; membership order is controlled input`);
});

test('lazy id allocation does not silently insert a post-add ID into the source lookup index', () => {
  const h = new Host(); const actor = h.make('h','hero',0,0,33); h.scheduler.add(actor);
  assert.equal(h.scheduler.id(actor), 1); assert.equal(h.scheduler.findById(1), null);
  h.scheduler.remove(actor); h.scheduler.add(actor); assert.equal(h.scheduler.findById(1), actor);
});

test('clear preserves pending current actor while initialize releases it', () => {
  const h = new Host(); const actor = h.make('h','hero',0,0,33); h.scheduler.add(actor); h.scheduler.process();
  h.scheduler.clear(); assert.equal(h.scheduler.currentActor, actor);
  const before = h.events.length; h.scheduler.process(); assert.equal(h.events.length, before);
  h.scheduler.initialize([], []); assert.equal(h.scheduler.currentActor, null);
});

test('moving actors block before act and wrong-actor next cannot release a waiting turn', () => {
  const h = new Host(); const a = h.make('h','hero',0,0,33); const b = h.make('b','mob',1,0,34);
  h.scheduler.add(a); h.scheduler.add(b); a.moving = true; h.events = []; h.scheduler.process();
  assert.deepEqual(h.events, []); assert.equal(h.scheduler.currentActor, null);
  a.moving = false; h.scheduler.process(); assert.equal(h.scheduler.currentActor, a);
  h.scheduler.next(b); assert.equal(h.scheduler.currentActor, a);
  h.scheduler.next(a); assert.equal(h.scheduler.currentActor, null);
});

test('attached buffs keep their clocks and run onAdd even when already in membership', () => {
  const h = new Host(); const a = h.make('h','hero',0,0,33); const b = h.make('f','buff',2,7,0);
  h.scheduler.add(b); a.attached.add(b); h.events = [];
  h.scheduler.addDelayed(a, 5);
  assert.equal(h.scheduler.clockOf(b).time, 2); assert.deepEqual(h.events, ['add(h)','add(f)']);
});

test('detached snapshots and separate scheduler instances do not become additional state owners', () => {
  const a = new Host(); const b = new Host(); const actor = a.make('h','hero',0,0,33);
  a.scheduler.add(actor); const clock = a.scheduler.clockOf(actor); clock.time = 100;
  assert.equal(a.scheduler.clockOf(actor).time, 0); assert.equal(b.scheduler.list().length, 0);
  const list = a.scheduler.list(); list.pop(); assert.equal(a.scheduler.has(actor), true);
});
