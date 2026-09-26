import test from 'node:test';
import assert from 'node:assert/strict';
import { TurnScheduler } from '../../src/modules/turns/index.ts';
import { Buff,FlavourBuff,BuffOperations } from '../../src/modules/effects/index.ts';
import { movementHost } from '../support/movement-host.mjs';
const environment={hero:()=>null,heroIsAlive:()=>true,addDuration(){}};
const position=cell=>({character:{position:cell,isMoving:false,buffs:()=>[]},act:()=>false,onAdd(){},onRemove(){}});
function movement(flags=0){return movementHost({method:'M',from:528,to:529,flags,roll:0,oldTerrain:1,newTerrain:1,mask:0,heap:0,visible:0,observeMode:0,failure:'none'});}
test('position belongs to movement; base Char.move leaves scheduler occupancy untouched until its next rebuild',()=>{
  const h=movement(),scheduler=new TurnScheduler(1024,new Set(),environment);
  const actor={character:{get position(){return h.movement.position;},isMoving:false,buffs:()=>[]},act:()=>false,onAdd(){},onRemove(){}};
  scheduler.add(actor);scheduler.process();const before=scheduler.clockOf(actor);
  h.movement.move(529);
  assert.equal(h.movement.position,529);assert.equal(scheduler.currentActor,actor);assert.deepEqual(scheduler.clockOf(actor),before);
  assert.equal(scheduler.findChar(528),actor);assert.equal(scheduler.findChar(529),null);
  scheduler.next(actor);scheduler.process();assert.equal(scheduler.findChar(528),null);assert.equal(scheduler.findChar(529),actor);
});
test('real scheduler occupancy cancels a Vertigo step, without consuming or resuming a turn',()=>{
  const h=movement(1),scheduler=new TurnScheduler(1024,new Set(),environment),enemy=position(529);
  scheduler.add(enemy);h.world.hasCharacter=cell=>scheduler.findChar(cell)!==null;
  h.movement.move(529);assert.equal(h.movement.position,528);assert.deepEqual(scheduler.clockOf(enemy),{time:0,id:0});
});
function effects(){
  const scheduler=new TurnScheduler(1024,new Set(),environment),members=[];
  const target={isImmuneTo:()=>false,addBuff(buff){members.push(buff);scheduler.add(buff);},
    removeBuff(buff){const i=members.indexOf(buff);if(i>=0)members.splice(i,1);scheduler.remove(buff);},
    findBuff:classId=>members.find(b=>b.classId===classId)??null};
  const operations=new BuffOperations({catchesAsJavaException:()=>false,reportCaught(){throw new Error('Unexpected caught failure');}});
  const factory={classId:'flavour',create:()=>new FlavourBuff('flavour',scheduler)};
  return {scheduler,members,target,operations,factory};
}
test('flavour expiry removes the actual scheduler participant while a base buff becomes inactive',()=>{
  const h=effects(),base=new Buff('base',h.scheduler);base.attachTo(h.target);
  const flavour=h.operations.appendFor(h.target,h.factory,4);assert.equal(h.scheduler.clockOf(flavour).time,4);
  h.scheduler.process();assert.equal(h.scheduler.has(flavour),false);assert.equal(flavour.target,h.target);
  assert.equal(h.scheduler.has(base),true);assert.equal(h.scheduler.clockOf(base).time,Math.fround(3.4028234663852886e38));
  assert.deepEqual(h.members,[base]);assert.equal(h.scheduler.currentActor,null);
});
test('append/affect/prolong use the actual scheduler clock and do not create an independent timer',()=>{
  const h=effects(),blocker=position(100);h.scheduler.add(blocker);h.scheduler.spend(blocker,10);h.scheduler.process();
  const buff=h.operations.appendFor(h.target,h.factory,3);assert.equal(h.scheduler.clockOf(buff).time,13);
  assert.equal(h.operations.affectFor(h.target,h.factory,2),buff);assert.equal(h.scheduler.clockOf(buff).time,15);
  h.operations.prolong(h.target,h.factory,4);assert.equal(h.scheduler.clockOf(buff).time,15);
  h.operations.prolong(h.target,h.factory,8);assert.equal(h.scheduler.clockOf(buff).time,18);
  assert.equal(h.scheduler.now,10);assert.equal(h.scheduler.currentActor,blocker);
});
