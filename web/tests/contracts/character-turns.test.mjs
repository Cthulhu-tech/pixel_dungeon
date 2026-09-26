import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterHealth, CharacterTime } from '../../src/modules/actors/index.ts';
import { CombatResolver } from '../../src/modules/combat/index.ts';
import { TurnScheduler } from '../../src/modules/turns/index.ts';
function session(){
  const trace=[];
  const participant=position=>({character:{position,isMoving:false,buffs:()=>[]},act:()=>false,onAdd(){},onRemove(){}});
  const hero=participant(33),enemy=participant(34);
  const turns=new TurnScheduler(1024,new Set(),{hero:()=>hero,heroIsAlive:()=>true,addDuration(){}});
  turns.restoreClock(enemy,{time:2,id:7});turns.add(hero);turns.add(enemy);
  let health;
  enemy.onRemove=()=>trace.push(['remove-hook',health.current,turns.findChar(34)===enemy]);
  const services={intTo:()=>0,intRange:()=>0,detachFrost:()=>trace.push('frost'),
    isImmune:()=>false,isResistant:()=>false,hasParalysis:()=>false,detachParalysis(){},
    isVisible:()=>false,paralysisBroken(){},showDamage:(amount,tone)=>trace.push(['damage',amount,tone]),
    removeActor:()=>turns.remove(enemy),freeCell:()=>turns.freeCell(enemy.character.position),
    showDeath:()=>trace.push(['death-frame',turns.findChar(34)])};
  health=new CharacterHealth({HP:2,HT:10},services);
  return {hero,enemy,turns,health,trace};
}
test('base death removes the real scheduler participant/id and frees its cell exactly once',()=>{
  const h=session();assert.equal(h.turns.findById(7),h.enemy);
  h.health.damage(3,{classId:'hero',isCharacter:true});
  assert.equal(h.turns.has(h.enemy),false);assert.equal(h.turns.findChar(34),null);assert.equal(h.turns.findById(7),null);
  assert.deepEqual(h.trace,['frost',['damage',3,'negative'],['remove-hook',0,true],['death-frame',null]]);
  h.health.damage(3,{classId:'hero',isCharacter:true});assert.equal(h.trace.length,4);
  assert.equal(h.turns.has(h.hero),true);
});
test('Slow/Speed advance the real actor clock without touching scheduler now or other actors',()=>{
  const h=session();let slow=true,speed=false;
  const timing=new CharacterTime({hasCripple:()=>false,hasSlow:()=>slow,hasSpeed:()=>speed,
    spend:amount=>h.turns.spend(h.hero,amount)});
  timing.spend(0.75);assert.equal(h.turns.clockOf(h.hero).time,1.5);
  speed=true;timing.spend(0.75);assert.equal(h.turns.clockOf(h.hero).time,2.25);
  slow=false;timing.spend(0.75);assert.equal(h.turns.clockOf(h.hero).time,2.625);
  assert.equal(h.turns.clockOf(h.enemy).time,2);assert.equal(h.turns.now,0);
});
test('an attack uses the actual health owner and scheduler without charging or resuming a turn implicitly',()=>{
  const h=session();h.turns.process();assert.equal(h.turns.currentActor,h.hero);
  const attacker={key:'hero',position:33,maximumHealth:20,attackSkill:()=>1,isRangedSniper:()=>false,
    damageRoll:()=>3,attackProc:(_,n)=>n};
  const defender={key:'rat',position:34,maximumHealth:10,defenseSkill:()=>0,damageReduction:()=>0,
    defenseProc:(_,n)=>n,damage:(n,src)=>h.health.damage(n,{classId:src.key,isCharacter:true}),
    isAlive:()=>h.health.isAlive(),defenseVerb:()=>{throw Error('Unexpected miss');}};
  const world={hero:attacker,isVisible:()=>false,interruptHero(){throw Error('Not attacking hero');},
    heroHasKillerGlyph:()=>false,isBoss:()=>false,fail(){throw Error('Not hero death');},emit:e=>h.trace.push(e.kind)};
  const resolver=new CombatResolver({floatTo:max=>Math.fround(max*0.5),intRange:()=>0,floatBetween(){throw Error('Invisible hit');}});
  assert.equal(resolver.attack(attacker,defender,world),true);
  assert.equal(h.health.current,0);assert.equal(h.turns.findChar(34),null);
  assert.equal(h.turns.currentActor,h.hero);assert.equal(h.turns.clockOf(h.hero).time,0);
  assert.deepEqual(h.trace.slice(-2),['blood','flash']);
});
