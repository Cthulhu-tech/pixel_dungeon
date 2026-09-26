import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterStatus } from '../../src/modules/actors/index.ts';
import * as E from '../../src/modules/effects/index.ts';
import { integratedStatuses } from '../support/status-integration-host.mjs';

test('status flags have one owner, detached snapshots and original signed invisibility arithmetic',()=>{
  const state=new CharacterStatus();assert.deepEqual(state.snapshot(),{paralysed:false,rooted:false,flying:false,invisible:0,viewDistance:8});
  const view=state.snapshot();view.flying=true;assert.equal(state.flying,false);
  state.setInvisible(2147483648);assert.equal(state.invisible,-2147483648);
  state.setInvisible(-1);assert.equal(state.invisible,-1);
});
test('Paralysis keeps the flag while another freeze effect remains and removes membership before unfreeze',()=>{
  const h=integratedStatuses(),a=new E.Paralysis(h.clock,h.ports.paralysis),b=new E.Paralysis(h.clock,h.ports.paralysis);
  a.attachTo(h.target);b.attachTo(h.target);assert.equal(h.status.paralysed,true);
  a.detach();assert.equal(h.status.paralysed,true);assert.equal(h.scheduler.has(a),false);
  b.detach();assert.equal(h.status.paralysed,false);
  const removals=h.events.filter(e=>e.type==='state-');assert.ok(removals.every(e=>e.flags.paralysed));
});
test('Levitation removes only the first Roots and triggers the landing cell before its own removal',()=>{
  const h=integratedStatuses(),first=new E.Roots(h.clock,h.ports.roots),second=new E.Roots(h.clock,h.ports.roots),flight=new E.Levitation(h.clock,h.ports.levitation);
  first.attachTo(h.target);second.attachTo(h.target);flight.attachTo(h.target);
  assert.equal(h.status.flying,true);assert.equal(h.status.rooted,false);
  assert.equal(h.scheduler.has(first),false);assert.equal(h.scheduler.has(second),true);
  const rejected=new E.Roots(h.clock,h.ports.roots);assert.equal(rejected.attachTo(h.target),false);assert.equal(rejected.target,null);
  flight.detach();const press=h.events.find(e=>e.type==='press');
  assert.equal(press.flags.flying,false);assert.ok(press.effects.includes('Levitation'));
  assert.equal(h.scheduler.has(flight),false);
});
test('Invisibility changes the counter after attach visuals and before removal, without clamping repeated detach',()=>{
  const h=integratedStatuses(),a=new E.Invisibility(h.clock,h.ports.counter),b=new E.Shadows(h.clock,h.ports.shadows);
  a.attachTo(h.target);b.attachTo(h.target);assert.equal(h.status.invisible,2);
  const add=h.events.filter(e=>e.type==='state+'&&e.details[0]==='invisible');
  assert.deepEqual(add.map(e=>e.flags.invisible),[0,1]);
  a.detach();assert.equal(h.status.invisible,1);
  assert.equal(h.events.filter(e=>e.type==='state-').length,0);
  b.detach();assert.equal(h.status.invisible,0);a.detach();assert.equal(h.status.invisible,-1);
});
test('Light removal restores the current floor radius and observes before the buff is removed',()=>{
  const h=integratedStatuses(),light=new E.Light(h.clock,h.ports.light);
  h.setLevel(2);light.attachTo(h.target);assert.equal(h.status.viewDistance,4);
  h.setLevel(6);h.events.length=0;light.detach();
  assert.equal(h.status.viewDistance,6);const observation=h.events.find(e=>e.type==='observe');
  assert.ok(observation.effects.includes('Light'));assert.equal(h.scheduler.has(light),false);
});
test('Shadows spends two actor ticks, persists only left as its own field, and cancels on visible enemies',()=>{
  const h=integratedStatuses(),buff=new E.Shadows(h.clock,h.ports.shadows);buff.attachTo(h.target);buff.prolong();
  assert.deepEqual(buff.ownState(),{left:2});buff.act();assert.equal(h.scheduler.clockOf(buff).time,2);assert.equal(h.scheduler.has(buff),true);
  buff.act();assert.equal(h.scheduler.clockOf(buff).time,4);assert.equal(h.scheduler.has(buff),false);
  buff.restoreOwnState({left:9});buff.attachTo(h.target);h.setEnemies(1);buff.act();
  assert.equal(h.scheduler.has(buff),false);assert.deepEqual(buff.ownState(),{left:8});
});
test('level press failure preserves the exact intermediate landing state instead of inventing rollback',()=>{
  const h=integratedStatuses(),flight=new E.Levitation(h.clock,{...h.ports.levitation,press(){throw new Error('trap failure');}});
  flight.attachTo(h.target);assert.throws(()=>flight.detach(),/trap failure/);
  assert.equal(h.status.flying,false);assert.equal(h.scheduler.has(flight),true);assert.equal(h.collection.find('Levitation'),flight);
});
test('unfreeze short-circuits Frost lookup and duration queries resistance once',()=>{
  const queries=[],target={findBuff(id){queries.push(id);return {};}};
  E.Paralysis.unfreeze(target,{setParalysed(){throw new Error('Still paralysed');}});
  assert.deepEqual(queries,['Paralysis']);let calls=0;
  assert.equal(E.Slow.duration(target,{resistance(){calls++;return {durationFactor:()=>0.33333334};}}),Math.fround(Math.fround(0.33333334)*10));
  assert.equal(calls,1);
});
