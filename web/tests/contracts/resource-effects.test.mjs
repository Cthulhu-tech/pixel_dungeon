import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../src/modules/effects/index.ts';
import { CharacterHealth } from '../../src/modules/actors/index.ts';
import { integratedStatuses } from '../support/status-integration-host.mjs';
import { resourceHost } from '../support/resource-effects-host.mjs';
import { floatBits } from '../support/status-effects-host.mjs';

function combatPort(h){return {isAlive:()=>h.health.isAlive(),hp:()=>h.health.current,ht:()=>h.health.maximum,
  damage(_t,n,source){h.health.damage(n,{classId:source.classId,isCharacter:false});},
  badge:c=>h.events.push({type:'badge',cause:c}),fail:c=>h.events.push({type:'fail',cause:c}),deathMessage:c=>h.events.push({type:'deathMessage',cause:c})};}

test('Poison ticks through actual health and turn owners, expires and saves only its own duration',()=>{
 const h=integratedStatuses(),poison=new E.Poison(h.clock,combatPort(h));poison.set(3);poison.attachTo(h.target);
 poison.act();assert.equal(h.health.current,8);assert.equal(h.scheduler.clockOf(poison).time,1);assert.deepEqual(poison.ownState(),{left:2});
 poison.act();poison.act();assert.equal(h.health.current,6);assert.equal(h.scheduler.has(poison),false);
 const copy=new E.Poison(h.clock,combatPort(h));copy.restoreOwnState({left:2});assert.deepEqual(copy.ownState(),{left:2});
});
test('Regeneration uses a direct health-owner increment, without damage callbacks or a second timer',()=>{
 const h=integratedStatuses();h.health.damage(4,{classId:'test',isCharacter:false});h.events.length=0;
 const regeneration=new E.Regeneration(h.clock,{...combatPort(h),heroIsStarving:()=>false,
   addHp:(_t,n)=>h.health.addCurrent(n),rejuvenationLevels:()=>[1,2]});regeneration.attachTo(h.target);regeneration.act();
 assert.equal(h.health.current,7);assert.equal(h.scheduler.clockOf(regeneration).time,Math.fround(10/Math.pow(1.2,3)));
 assert.equal(h.events.some(e=>e.type==='damage'),false);
 h.health.destroy();regeneration.act();assert.equal(h.scheduler.clockOf(regeneration).time,Math.fround(3.4028234663852886e38));
});
test('direct HP increments preserve signed overflow and do not clamp or detach effects',()=>{
 const health=new CharacterHealth({HP:2147483647,HT:10},{detachFrost(){throw new Error('Not damage');}});
 health.addCurrent(1);assert.equal(health.current,-2147483648);health.addCurrent(-1);assert.equal(health.current,2147483647);
});
test('real Frost interrupts Burning and preserves Paralysis until the last freeze is removed',()=>{
 const h=integratedStatuses(),burning=new E.Burning(h.clock,{...combatPort(h)}),paralysis=new E.Paralysis(h.clock,h.ports.paralysis);
 burning.attachTo(h.target);paralysis.attachTo(h.target);
 const operations=[];const frost=new E.Frost(h.clock,{...h.ports.paralysis,isHero:()=>true,
   randomUnequipped(){operations.push('choose');return {classId:'MysteryMeat'};},isMysteryMeat:i=>i?.classId==='MysteryMeat',
   detachOne(_t,item){operations.push('detach');return item;},createFood(kind){operations.push(kind);return {classId:kind};},
   collectFood(){operations.push('collect');return false;},dropFood(){operations.push('drop');return {playDrop(){operations.push('play');}}},
 });
 frost.attachTo(h.target);assert.equal(h.scheduler.has(burning),false);assert.equal(h.status.paralysed,true);
 assert.deepEqual(operations,['choose','detach','FrozenCarpaccio','collect','drop','play']);
 frost.detach();assert.equal(h.status.paralysed,true);paralysis.detach();assert.equal(h.status.paralysed,false);
});
test('Hunger threshold observation sees the old level during interrupt and the new level during UI refresh',()=>{
 const h=integratedStatuses(),seen=[];let hunger;
 const port={...combatPort(h),requireHero(){},isRogue:()=>true,paralysed:()=>h.status.paralysed,satietyLevels:()=>[],float:()=>0,
   hungerMessage:s=>seen.push([s,hunger.ownState().level]),interrupt:()=>seen.push(['interrupt',hunger.ownState().level]),refreshHero:()=>seen.push(['refresh',hunger.ownState().level])};
 hunger=new E.Hunger(h.clock,port);hunger.attachTo(h.target);hunger.restoreOwnState({level:355});hunger.act();
 assert.deepEqual(seen,[['starving',355],['interrupt',355],['refresh',365]]);
 assert.equal(h.scheduler.clockOf(hunger).time,12);assert.equal(hunger.isStarving(),true);
 hunger.satisfy(100);assert.equal(hunger.ownState().level,265);
});
test('starvation checks its random draw first and does not kill a paralysed one-HP target',()=>{
 const h=resourceHost([0]);h.execute('new:Hunger');h.execute('attach:0:0');h.execute('restore:0:level:f:'+floatBits(360));
 h.execute('flag:0:HP:1');h.execute('flag:0:paralysed:1');h.events.length=0;h.execute('act:0');
 assert.equal(h.targets[0].HP,1);assert.equal(h.events.filter(e=>e.startsWith('rng:')).length,1);assert.ok(!h.events.some(e=>e.startsWith('damage:')));
});
test('Burning retains its dead-target tail and can detach twice, but does not consume an expiry draw at zero duration',()=>{
 const h=resourceHost([]);h.execute('new:Burning');h.execute('attach:0:0');h.execute('flag:0:HP:0');h.execute('terrain:0:0:1');h.events.length=0;
 h.execute('act:0');assert.equal(h.events.filter(e=>e.startsWith('remove:')).length,2);
 assert.ok(h.events.includes('seed:33:4:Fire'));assert.ok(h.events.some(e=>e.startsWith('spend:')));assert.ok(!h.events.some(e=>e.startsWith('rng:')));
});
test('Bleeding evaluates splash inputs before a source divide-by-zero and does not charge a tick after failure',()=>{
 const h=resourceHost([.5]);h.execute('new:Bleeding');h.execute('attach:0:0');h.execute('set:0:5');h.execute('flag:0:HT:0');h.events.length=0;
 assert.throws(()=>h.execute('act:0'),/division by zero/);assert.ok(h.events.includes('center:0'));assert.ok(h.events.includes('blood:0'));
 assert.ok(!h.events.some(e=>e.startsWith('spend:')));assert.equal(h.targets[0].HP,7);
});
test('Terror recover removes through the character owner instead of calling a overridden detach',()=>{
 const h=integratedStatuses(),terror=new E.Terror(h.clock);terror.attachTo(h.target);
 terror.detach=()=>{throw new Error('Source recover must call target.remove');};
 E.Terror.recover(h.target,{cooldown:b=>h.scheduler.cooldown(b)});assert.equal(h.scheduler.has(terror),false);
});
test('Barkskin and Combo have runtime counters but do not invent own saved fields',()=>{
 const h=integratedStatuses(),bark=new E.Barkskin(h.clock,combatPort(h)),combo=new E.Combo(h.clock,{validate(){},message(){}});
 bark.raiseLevel(4);bark.raiseLevel(2);assert.equal(bark.level(),4);assert.equal('ownState' in bark,false);
 assert.equal(combo.hit(null,10),0);assert.equal(combo.hit(null,10),0);assert.equal(combo.hit(null,10),2);assert.equal('ownState' in combo,false);
});
test('gas immunity stores exact original source-class IDs, not a blanket immunity category',()=>{
 assert.deepEqual(E.GasesImmunity.IMMUNITIES,['Paralysis','ToxicGas','Vertigo']);assert.equal(E.GasesImmunity.IMMUNITIES.includes('Burning'),false);
});
