import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync,mkdtempSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { movementCases,encodeMovement,evaluateMovement,movementHost } from '../support/movement-host.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
function run(command,args,options={}) {
  const result=spawnSync(command,args,{encoding:'utf8',timeout:30000,maxBuffer:32*1024*1024,...options});
  if(result.error)throw result.error;
  assert.equal(result.status,0,result.stderr);return result.stdout;
}
test('selected original move/distance/door methods match results, partial mutations and ordered effects',t=>{
  const temp=join(root,'tmp');mkdirSync(temp,{recursive:true});const out=mkdtempSync(join(temp,'movement-oracle-'));
  t.after(()=>rmSync(out,{recursive:true,force:true}));
  run('javac',['-proc:none','-encoding','UTF-8','-d',out,join(root,'tests/reference/movement/MovementReference.java'),join(root,'tools/port/oracle/movement/MovementOracle.java')]);
  const cases=movementCases();const expected=run('java',['-cp',out,'port.oracle.MovementOracle'],{input:cases.map(encodeMovement).join('\n')+'\n'}).trimEnd().split('\n');
  assert.equal(expected.length,cases.length);
  for(let i=0;i<cases.length;i++)assert.equal(evaluateMovement(cases[i]),expected[i],`case ${i}: ${encodeMovement(cases[i])}`);
  t.diagnostic(`${cases.length} selected-Java-method comparisons; fixed random choices and test-only Level ports; not full Hero.move/Level.set`);
});
function base(change={}){return {method:'M',from:528,to:529,flags:0,roll:0,oldTerrain:1,newTerrain:1,mask:0,heap:0,visible:0,observeMode:0,failure:'none',...change};}
test('ordinary base movement is not a new passability validator and does not spend or resume a turn',()=>{
  const h=movementHost(base({mask:3}));h.movement.move(529);
  assert.equal(h.movement.position,529);assert.deepEqual(h.events,['buff']);
});
test('blocked Vertigo cancels before touching the old open door or sprite visibility',()=>{
  const h=movementHost(base({flags:1,mask:2,oldTerrain:6}));h.movement.move(529);
  assert.equal(h.movement.position,528);assert.equal(h.map[528],6);assert.equal(h.spriteVisible,true);
  assert.deepEqual(h.events,['buff','random:8']);
});
test('door observation sees the old position on leave and the new position on enter',()=>{
  const h=movementHost(base({flags:2,oldTerrain:6,newTerrain:5,observeMode:1}));h.movement.move(529);
  assert.deepEqual(h.events,['buff','heap:528','set:528:5','update:528','observe:528','set:529:6','update:529','observe:529','sound:open']);
  assert.equal(h.spriteVisible,true);
});
test('a heap holds the previous door open and the hero sprite does not inherit the visibility mask',()=>{
  const h=movementHost(base({flags:4,oldTerrain:6,heap:1}));h.movement.move(529);
  assert.equal(h.map[528],6);assert.equal(h.spriteVisible,true);assert.deepEqual(h.events,['buff','heap:528']);
});
test('enter checks visibility after observe and preserves mutations before a presentation failure',()=>{
  const h=movementHost(base({method:'E',newTerrain:5,observeMode:1,failure:'sound'}));
  assert.throws(()=>h.doors.enter(529),/injected/);assert.equal(h.map[529],6);assert.equal(h.visible[529],true);
  assert.deepEqual(h.events,['set:529:6','update:529','observe:528','sound:open']);
});
