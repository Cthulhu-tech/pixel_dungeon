import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatResolver } from '../../src/modules/combat/index.ts';
import { CharacterHealth, CharacterTime } from '../../src/modules/actors/index.ts';
import { entry, evaluate } from '../support/character-host.mjs';
function healthPorts(events){
  return {intTo:()=>{throw new Error('Unexpected RNG');},intRange:()=>{throw new Error('Unexpected RNG');},
    detachFrost:()=>events.push('frost'),isImmune:()=>false,isResistant:()=>false,hasParalysis:()=>false,
    detachParalysis(){},isVisible:()=>false,paralysisBroken(){},showDamage:(n,tone)=>events.push([n,tone]),
    removeActor:()=>events.push('remove'),freeCell:()=>events.push('free'),showDeath:()=>events.push('death')};
}
test('health snapshot is a projection, not a second mutable HP owner',()=>{
  const events=[];const health=new CharacterHealth({HP:10,HT:10},healthPorts(events));
  const snapshot=health.snapshot();snapshot.HP=999;
  assert.equal(health.current,10);health.damage(3,{classId:'poison',isCharacter:false});
  assert.equal(health.current,7);assert.equal(snapshot.HP,999);
});
test('base death removes occupancy after setting HP=0, and later damage does not repeat death',()=>{
  const events=[];const p=healthPorts(events);let health;
  p.removeActor=()=>events.push(['remove',health.current]);
  health=new CharacterHealth({HP:2,HT:10},p);
  health.damage(3,{classId:'rat',isCharacter:true});
  assert.deepEqual(events,['frost',[3,'negative'],['remove',0],'free','death']);
  const before=events.slice();health.damage(5,{classId:'rat',isCharacter:true});assert.deepEqual(events,before);
});
test('resistance matches the exact class ID, not a broad effect category',()=>{
  const events=[];const p=healthPorts(events);p.isImmune=id=>id==='effect.Poison';
  const health=new CharacterHealth({HP:10,HT:10},p);
  health.damage(3,{classId:'effect.StrongPoison',isCharacter:false});assert.equal(health.current,7);
  health.damage(3,{classId:'effect.Poison',isCharacter:false});assert.equal(health.current,7);
});
test('zero damage still breaks Frost; dead targets return before buff work',()=>{
  const events=[];const h=new CharacterHealth({HP:5,HT:10},healthPorts(events));
  h.damage(0,{classId:'environment',isCharacter:false});assert.deepEqual(events,['frost']);
  const dead=new CharacterHealth({HP:0,HT:10},healthPorts(events));dead.damage(0,{classId:'environment',isCharacter:false});
  assert.deepEqual(events,['frost']);
});
test('an unobserved hit has no sound draw but keeps blood/flash and alive query',()=>{
  const trace=evaluate(entry({visible:0})).split('|').at(-1);
  assert.ok(!trace.includes('sound:'));assert.ok(trace.includes('blood:B:A:5;flash:B;alive:B'));
});
test('ranged sniper skips armor sampling but not accuracy rolls or damage procs',()=>{
  const trace=evaluate(entry({sniper:3})).split('|').at(-1);
  assert.ok(!trace.includes('dr:B'));assert.ok(trace.startsWith('attack-skill:A:B;draw:0;defense-skill:B:A;draw:1;'));
  assert.ok(trace.includes('attack-proc:A:5;defense-proc:B:5;damage:B:5:A'));
});
test('the zero-quarter-health division fails after damage and interruption, before blood',()=>{
  const result=evaluate(entry({role:2,ht:3}));
  assert.ok(result.startsWith('error:divide-zero|'));assert.ok(result.includes('interrupt:B'));assert.ok(!result.includes('blood:'));
});
test('speed calculation does not spend time; Slow and Speed cancel without independent timers',()=>{
  const events=[];const clock=new CharacterTime({hasCripple:()=>true,hasSlow:()=>true,hasSpeed:()=>true,spend:n=>events.push(n)});
  assert.equal(clock.speed(1),0.5);assert.deepEqual(events,[]);clock.spend(1);assert.deepEqual(events,[1]);
});
test('hit ties succeed and always evaluate both skills even when they are zero',()=>{
  const order=[];const resolver=new CombatResolver({floatTo:max=>{order.push(['draw',max]);return 0;},floatBetween(){throw Error('unexpected');},intRange(){throw Error('unexpected');}});
  const a={attackSkill:b=>{order.push('attack');return 0;}},b={defenseSkill:a=>{order.push('defense');return 0;}};
  assert.equal(resolver.hit(a,b,false),true);assert.deepEqual(order,['attack',['draw',0],'defense',['draw',0]]);
});
