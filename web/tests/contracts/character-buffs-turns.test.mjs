import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterBuffs, CharacterHealth, CharacterTime } from '../../src/modules/actors/index.ts';
import { Buff, FlavourBuff, BuffOperations } from '../../src/modules/effects/index.ts';
import { TurnScheduler } from '../../src/modules/turns/index.ts';

function host(){
  const events=[], members=new Set();let collection;
  const actor={character:{position:33,isMoving:false,buffs:()=>collection.all()},act:()=>false,onAdd(){},onRemove(){collection.detachAll();}};
  const scheduler=new TurnScheduler(1024,new Set(),{hero:()=>actor,heroIsAlive:()=>true,addDuration(){}});
  const target={isImmuneTo:()=>false,addBuff:b=>collection.add(b),removeBuff:b=>collection.remove(b),findBuff:c=>collection.find(c)};
  collection=new CharacterBuffs(members,()=>new Set(),{isInstance:(b,k)=>k==='Buff'||b.classId===k,charmObject:()=>0},{
    add:b=>scheduler.add(b),remove:b=>{events.push(['remove',b.classId]);scheduler.remove(b);},
  },{position:()=>33,invisibleCount:()=>0},{available:()=>true,poisonSplash:(p,n)=>events.push(['splash',p,n]),
    status:(t,k)=>events.push(['status',t,k]),addState:s=>events.push(['state+',s]),removeState:s=>events.push(['state-',s]),idle:()=>events.push(['idle'])});
  const clock={deactivate:b=>scheduler.deactivate(b),spend:(b,t)=>scheduler.spend(b,t),postpone:(b,t)=>scheduler.postpone(b,t)};
  const ops=new BuffOperations({catchesAsJavaException:()=>false,reportCaught(){throw new Error('Unexpected caught failure');}});
  scheduler.add(actor);
  return {actor,scheduler,target,collection,clock,ops,events};
}
test('the real Buff target, character collection and scheduler have one shared membership lifecycle',()=>{
  const h=host();const buff=new FlavourBuff('Poison',h.clock);
  assert.equal(buff.attachTo(h.target),true);assert.equal(buff.target,h.target);
  assert.equal(h.collection.find('Poison'),buff);assert.equal(h.scheduler.has(buff),true);
  h.scheduler.spend(buff,7);h.events.length=0;h.collection.add(buff);
  assert.equal(h.scheduler.clockOf(buff).time,7);assert.equal(h.collection.all().length,1);
  assert.deepEqual(h.events,[['splash',33,5],['status','negative','poisoned']]);
  buff.act();assert.equal(h.scheduler.has(buff),false);assert.equal(h.collection.find('Poison'),null);
  assert.equal(buff.target,h.target);
});
test('health destruction detaches actual attached effects before freeing the character cell',()=>{
  const h=host();const a=new Buff('Burning',h.clock),b=new FlavourBuff('Frost',h.clock);
  a.attachTo(h.target);b.attachTo(h.target);
  const health=new CharacterHealth({HP:10,HT:10},{
    removeActor(){assert.equal(health.current,0);h.scheduler.remove(h.actor);},
    freeCell(){assert.equal(h.collection.all().length,0);assert.equal(h.scheduler.has(a),false);assert.equal(h.scheduler.has(b),false);h.scheduler.freeCell(33);},
  });
  health.destroy();assert.equal(h.scheduler.findChar(33),null);assert.equal(h.scheduler.has(h.actor),false);
  assert.deepEqual(h.collection.all(),[]);
});
test('damage detaches a real Frost instance before health mutation without creating a second effect store',()=>{
  const h=host();const frost=new FlavourBuff('Frost',h.clock);frost.attachTo(h.target);
  const health=new CharacterHealth({HP:10,HT:10},{
    intTo:()=>{throw new Error('Unexpected draw');},intRange:()=>{throw new Error('Unexpected draw');},
    detachFrost(){h.ops.detachMatching(h.target,'Frost');assert.equal(health.current,10);},
    isImmune:()=>false,isResistant:()=>false,hasParalysis:()=>h.target.findBuff('Paralysis')!==null,
    detachParalysis:()=>h.ops.detachMatching(h.target,'Paralysis'),isVisible:()=>true,
    paralysisBroken(){},showDamage(){},removeActor(){throw new Error('Not dead');},freeCell(){},showDeath(){},
  });
  health.damage(1,{classId:'test-hit',isCharacter:true});assert.equal(health.current,9);
  assert.equal(h.collection.find('Frost'),null);assert.equal(h.scheduler.has(frost),false);
});
test('CharacterTime reads real attached effects and affects only the character clock',()=>{
  const h=host();const slow=new FlavourBuff('Slow',h.clock),speed=new FlavourBuff('Speed',h.clock);
  const time=new CharacterTime({hasCripple:()=>h.target.findBuff('Cripple')!==null,
    hasSlow:()=>h.target.findBuff('Slow')!==null,hasSpeed:()=>h.target.findBuff('Speed')!==null,
    spend:n=>h.scheduler.spend(h.actor,n)});
  slow.attachTo(h.target);time.spend(1);assert.equal(h.scheduler.clockOf(h.actor).time,2);
  speed.attachTo(h.target);time.spend(1);assert.equal(h.scheduler.clockOf(h.actor).time,3);
  slow.detach();time.spend(1);assert.equal(h.scheduler.clockOf(h.actor).time,3.5);
  assert.equal(h.scheduler.clockOf(speed).time,0);assert.equal(h.scheduler.now,0);
});
