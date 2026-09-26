import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { entry, encode, evaluate, bits } from '../support/character-host.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
let output;
function run(command,args,options={}) {
  const result=spawnSync(command,args,{encoding:'utf8',timeout:30000,maxBuffer:96*1024*1024,...options});
  if(result.error)throw result.error;
  assert.equal(result.status,0,`${command}: ${result.stderr}`);return result.stdout;
}
before(()=>{
  const bytes=readFileSync(join(root,'tests/reference/random/Random.java'));
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),'cc6ce01ae51678da114ee1e0d26485717107704c');
  const scratch=join(root,'tmp');mkdirSync(scratch,{recursive:true});output=mkdtempSync(join(scratch,'character-oracle-'));
  // Instrument only the external primitive, leaving the entire Random wrapper unchanged.
  const random=bytes.toString('utf8').replaceAll('Math.random()', 'port.oracle.CharacterOracle.draw()');
  writeFileSync(join(output,'Random.java'),random);
  run('javac',['-proc:none','-encoding','UTF-8','-d',output,join(output,'Random.java'),
    join(root,'tests/reference/character/CharReference.java'),join(root,'tools/port/oracle/character/CharacterOracle.java')]);
});
after(()=>{if(output)rmSync(output,{recursive:true,force:true});});
function compare(t,entries) {
  const expected=run('java',['-cp',output,'port.oracle.CharacterOracle'],{input:entries.map(encode).join('\n')+'\n'}).trimEnd().split('\n');
  assert.equal(expected.length,entries.length);
  let errors=0;
  entries.forEach((e,i)=>{assert.equal(evaluate(e),expected[i],`case ${i}: ${encode(e)}`);if(expected[i].startsWith('error:'))errors++;});
  t.diagnostic(`${entries.length} selected-Java-method cases; ${errors} same failures; complete ordered trace and draw consumption`);
}
function tape(n) {
  const patterns=[ [0], [0.5], [0.9999999999999999], [0.1,0.9,0.4,0,0.8,0.5] ];
  return Array.from({length:64},(_,i)=>patterns[n%patterns.length][i%patterns[n%patterns.length].length]);
}
test('Char.hit: float32 accuracy, magic multiplier, ties and primitive draw order',t=>{
  const entries=[];const values=[-2147483648,-7,-1,0,1,10,16777217,2147483647];
  for(const accuracy of values)for(const defense of values)for(const flags of [0,4096])for(let i=0;i<4;i++)
    entries.push(entry({mode:'hit',accuracy,defense,flags,draws:tape(i)}));
  for(const draws of [[],[0]])for(const flags of [0,4096])entries.push(entry({mode:'hit',flags,draws}));
  compare(t,entries);
});
test('Char.attack: sniper, procs, death overrides, visibility, shared effect draws and failure phases',t=>{
  const entries=[];let n=0;
  const rolls=[0,1,10,21,-2147483648,2147483647,-7],armors=[-3,0,1,5,2147483647];
  for(let role=0;role<4;role++)for(let visible=0;visible<4;visible++)for(let sniper=0;sniper<4;sniper++)
    for(let deathMode=0;deathMode<3;deathMode++)for(const flags of [0,1,2,3,4,7,128,256,384,1031,2048]){
      entries.push(entry({mode:n%3===0?'attack-twice':'attack',role,visible,sniper,deathMode,flags,
        roll:rolls[n%rolls.length],armor:armors[n%armors.length],attackBonus:[-3,0,4][n%3],
        defenseBonus:[0,20,-4,2147483647][n%4],defense:[0,10,20][n%3],draws:tape(n)}));n++;
    }
  for(const ht of [-2147483648,-4,-3,-1,0,1,2,3,4,5,19,20,21,2147483647])
    for(const afterHT of ['n',0,3,20])for(const roll of [0,1,6,100])
      entries.push(entry({role:2,ht,afterHT,roll,draws:tape(0)}));
  for(let length=0;length<8;length++)entries.push(entry({role:2,flags:2054,draws:Array(length).fill(0)}));
  compare(t,entries);
});
test('Char.damage/destroy/die: exact classes, resistance, paralysis, overflow and already-dead early return',t=>{
  const entries=[];let n=0;
  for(const hp of [-2147483648,-1,0,1,2,10,2147483647])for(const ht of [-3,0,1,20,2147483647])
    for(const roll of [-2147483648,-5,0,1,5,2147483647])for(const flags of [0,1,2,3,4,5,6,7,8,12,512,513,516,519,1031,2054]){
      entries.push(entry({mode:n%4===0?'damage-sequence':'damage',hp,ht,roll,flags,visible:n%4,
        deathMode:n%3,draws:tape(n)}));n++;
    }
  for(const mode of ['destroy','die'])for(const hp of [-3,0,1,20])for(let deathMode=0;deathMode<3;deathMode++)
    entries.push(entry({mode,hp,deathMode}));
  compare(t,entries);
});
test('Char.speed/spend: Cripple, Slow, Speed and float32 scheduling including subnormals',t=>{
  const entries=[];
  const floats=[bits(0),bits(-0),1,0x007fffff,bits(0.5),bits(1),bits(1/3),bits(-2),bits(1e30),0x7f7fffff,0x7f800000,0xff800000,0x7fc00000];
  for(const base of floats)for(const time of floats)for(const flags of [0,16,32,48,64,80,96,112])
    entries.push(entry({mode:'time',base,time,flags}));
  compare(t,entries);
});
