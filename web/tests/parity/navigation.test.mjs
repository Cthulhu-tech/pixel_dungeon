import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { GridNavigation, GridPathFinder } from '../../src/modules/grid/index.ts';
import { TurnScheduler } from '../../src/modules/turns/index.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const bits = flags => Array.from(flags, Number).join('');
const mask = predicate => Array.from({ length: 1024 }, (_, cell) => Boolean(predicate(cell)));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command}: ${result.stderr}`);
  return result.stdout;
}
function fixtures() {
  const border = c => c < 32 || c >= 992 || c % 32 === 0 || c % 32 === 31;
  let seed = 0x4e415650;
  const draw = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  const worlds = [
    { pass: mask(() => true), avoid: mask(() => false) },
    { pass: mask(() => false), avoid: mask(() => true) },
    { pass: mask(c => !border(c)), avoid: mask(() => false) },
    { pass: mask(c => !border(c) && c % 3 !== 0), avoid: mask(c => !border(c) && c % 3 === 0) },
    { pass: mask(c => c >= 33 && c <= 62), avoid: mask(c => c >= 65 && c <= 94) },
    { pass: mask(() => false), avoid: mask(() => false) },
    { pass: mask(() => draw() > 0.2), avoid: mask(() => draw() > 0.7) },
    { pass: mask(() => draw() > 0.6), avoid: mask(() => draw() > 0.4) },
  ];
  const visibility = [mask(() => false), mask(() => true), mask(c => c % 2 === 0)];
  const pairs = [[33,34],[33,65],[33,64],[33,66],[31,32],[63,32],[32,63],[33,35],[33,99],[528,594],[990,33],[33,33],[0,31],[0,1023],[1023,0]];
  const entries = [];
  for (let w = 0; w < worlds.length; w++) for (let flags = 0; flags < 8; flags++) {
    for (let v = 0; v < visibility.length; v++) for (const [from,to] of pairs) {
      const members = [from, 'n', from + (from < 990 ? 1 : -1), to, 528];
      // The source's occupancy index can differ from the Actor.all projection at a phase boundary.
      const occupied = mask(c => members.includes(c) && (w % 2 === 0 || c % 3 === 0));
      for (const method of ['find','flee']) entries.push({ method, from, to, flags, ...worlds[w], visible: visibility[v], occupied, members });
    }
  }
  // Explicit malformed runtime boundaries: failures are compared, not normalized away.
  for (const position of [-1,1024]) for (const flags of [0,1,2,4]) {
    entries.push({ method:'find', from:33, to:99, flags, ...worlds[0], visible:visibility[1], occupied:mask(() => false), members:[position] });
  }
  for (const length of [0,17,1023,1025]) for (const flags of [0,1]) {
    entries.push({ method:'flee', from:33, to:99, flags, pass:Array(length).fill(true), avoid:worlds[0].avoid,
      visible:visibility[0], occupied:mask(() => false), members:[] });
  }
  return entries;
}
function evaluate(e) {
  const events = []; let usedMask = '-'; const solver = new GridPathFinder(32,32);
  const pathfinder = {
    getStep(from,to,pass) { events.push('step'); usedMask=bits(pass); return solver.getStep(from,to,pass); },
    getStepBack(current,threat,pass) { events.push('back'); usedMask=bits(pass); return solver.getStepBack(current,threat,pass); },
  };
  const navigation = new GridNavigation(32,32,pathfinder);
  const actor = {
    flying: Boolean(e.flags & 1),
    hasAmok() { events.push('buff:Amok'); return Boolean(e.flags & 2); },
    hasRage() { events.push('buff:Rage'); return Boolean(e.flags & 4); },
  };
  const world = {
    avoid:e.avoid,
    hasCharacter(cell) {
      events.push(`char:${cell}`);
      if (e.occupied[cell] === undefined) throw new RangeError('Java chars[] bounds');
      return e.occupied[cell];
    },
    *characterPositions() { events.push('all'); for (const value of e.members) if (value !== 'n') yield value; },
  };
  let result;
  try { result = 's:' + navigation[e.method === 'find' ? 'findPath' : 'flee'](actor,e.from,e.to,e.pass,e.visible,world); }
  catch(error) { if (!(error instanceof RangeError)) throw error; result='error:array-bounds'; }
  return [result,events.join(','),usedMask].join('\t');
}

test('original navigation policy matches steps, prepared masks and short-circuit query order', (t) => {
  const reference = join(root,'tests/reference/navigation/NavigationReference.java');
  const path = join(root,'tests/reference/pathfinding/PathFinder.java');
  for (const [file,sha] of [[reference,'f469d5ad306e265f7745cf594d125fb50b5f8fef'],[path,'d58524776566aaf0d835200a6c797ba65a3d61fa']]) {
    const bytes=readFileSync(file);
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),sha);
  }
  const tmp=join(root,'tmp'); mkdirSync(tmp,{recursive:true}); const out=mkdtempSync(join(tmp,'navigation-oracle-'));
  t.after(() => rmSync(out,{recursive:true,force:true}));
  run('javac',['-proc:none','-encoding','UTF-8','-d',out,reference,path,join(root,'tools/port/oracle/navigation/NavigationOracle.java')]);
  const entries=fixtures();
  const input=entries.map(e => [e.method,e.from,e.to,e.flags,bits(e.pass),bits(e.avoid),bits(e.visible),bits(e.occupied),e.members.join(',')].join('|')).join('\n')+'\n';
  const expected=run('java',['-cp',out,'port.oracle.NavigationOracle'],{input}).trimEnd().split('\n');
  assert.equal(expected.length,entries.length); let failures=0;
  for(let i=0;i<entries.length;i++) {
    const e=entries[i];
    assert.equal(evaluate(e),expected[i],`case ${i}: ${e.method} ${e.from}->${e.to} flags=${e.flags}`);
    if(expected[i].startsWith('error:')) failures++;
  }
  t.diagnostic(`${entries.length} selected-original-method comparisons; ${failures} same failures; full masks and query order; not full Dungeon/Actor integration`);
});

function policyHost() {
  const events=[]; let observed=null;
  const solver={getStep(from,to,mask) { observed=Array.from(mask); events.push('step'); return to; },
    getStepBack(from,to,mask) { observed=Array.from(mask); events.push('back'); return from; }};
  const actor={flying:false,hasAmok:()=>false,hasRage:()=>false};
  const world={avoid:new Uint8Array(1024),hasCharacter:()=>false,characterPositions:()=>[]};
  return {navigation:new GridNavigation(32,32,solver),actor,world,events,get observed() {return observed;}};
}

test('an adjacent avoid cell is allowed without flight or buffs, and does not invoke the backend', () => {
  const h=policyHost(); h.world.avoid[34]=1;
  h.actor.hasAmok=()=>{throw new Error('Adjacent path must not query buffs');};
  assert.equal(h.navigation.findPath(h.actor,33,34,new Uint8Array(1024),new Uint8Array(1024),h.world),34);
  assert.deepEqual(h.events,[]);
});

test('Amok and Rage enable avoid for findPath, but not for flee', () => {
  const h=policyHost(); h.world.avoid[34]=1; h.actor.hasAmok=()=>true;
  const pass=new Uint8Array(1024),visible=new Uint8Array(1024);
  h.navigation.findPath(h.actor,33,99,pass,visible,h.world); assert.equal(h.observed[34],1);
  h.navigation.flee(h.actor,33,99,pass,visible,h.world); assert.equal(h.observed[34],0); assert.equal(h.observed[33],1);
});

test('only visible character positions block a general path; inputs remain unchanged', () => {
  const h=policyHost(); h.world.characterPositions=()=>[34,35];
  const pass=new Uint8Array(1024).fill(1),visible=new Uint8Array(1024); visible[34]=1;
  h.navigation.findPath(h.actor,33,99,pass,visible,h.world);
  assert.equal(h.observed[34],0); assert.equal(h.observed[35],1);
  assert.ok(pass.every(v=>v===1)); assert.equal(visible[34],1);
});

test('adjacency keeps the original flattened row behavior rather than a new geometric rule', () => {
  const h=policyHost(); const pass=new Uint8Array(1024).fill(1);
  assert.equal(h.navigation.findPath(h.actor,31,32,pass,new Uint8Array(1024).fill(1),h.world),32);
  assert.deepEqual(h.events,[]);
});

test('the real scheduler occupancy port blocks an adjacent invisible character without changing clocks', () => {
  const actor = position => ({character:{position,isMoving:false,buffs:()=>[]},act:()=>false,onAdd(){},onRemove(){}});
  const hero=actor(33),enemy=actor(34);
  const scheduler=new TurnScheduler(1024,new Set(),{hero:()=>hero,heroIsAlive:()=>true,addDuration(){}});
  scheduler.add(hero); scheduler.add(enemy);
  const navigation=new GridNavigation(32,32,new GridPathFinder(32,32));
  const world={avoid:new Uint8Array(1024),hasCharacter:cell=>scheduler.findChar(cell)!==null,
    *characterPositions(){for(const actor of scheduler.list()) if(actor.character!==null) yield actor.character.position;}};
  const view={flying:false,hasAmok:()=>false,hasRage:()=>false}; const before=scheduler.clockOf(hero);
  assert.equal(navigation.findPath(view,33,34,new Uint8Array(1024).fill(1),new Uint8Array(1024),world),-1);
  assert.deepEqual(scheduler.clockOf(hero),before);
  scheduler.freeCell(34);
  assert.equal(navigation.findPath(view,33,34,new Uint8Array(1024).fill(1),new Uint8Array(1024),world),34);
});
