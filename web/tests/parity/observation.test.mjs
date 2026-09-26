import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { method } from '../../../tools/port/oracle/character/source-methods.mjs';
import { RunObservation } from '../../src/modules/run/index.ts';
import { LevelExploration, LevelSight, GridShadowCaster, TerrainGrid, TERRAIN } from '../../src/modules/grid/index.ts';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const bits=a=>Array.from(a,Number).join('');
const flags=s=>Uint8Array.from(s,c=>Number(c==='1'));
function execute(command,args,input){const r=spawnSync(command,args,{encoding:'utf8',input,timeout:30000,maxBuffer:64*1024*1024});if(r.error)throw r.error;assert.equal(r.status,0,r.stderr);return r.stdout;}
function compile(t){
  const dir=join(root,'src/com/watabou/pixeldungeon');
  const hashes=[['Dungeon.java','961d04ca35a903486cc9bfd2e1386cf0c0c08813'],['utils/BArray.java','dec22b52f08c99a0b9b2fd3953b6169960726a5e']];
  for(const[path,sha]of hashes){const b=readFileSync(join(dir,path));assert.equal(createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'),sha);}
  const source=method(readFileSync(join(dir,'Dungeon.java'),'utf8'),'public static void observe()');
  const template=readFileSync(join(root,'tools/port/oracle/observation/ObservationOracle.java.tmpl'),'utf8');
  assert.equal(template.split('// ORIGINAL_OBSERVE').length,2);
  mkdirSync(join(root,'tmp'),{recursive:true});const out=mkdtempSync(join(root,'tmp/observation-oracle-'));t.after(()=>rmSync(out,{recursive:true,force:true}));
  writeFileSync(join(out,'ObservationOracle.java'),template.replace('// ORIGINAL_OBSERVE',source));
  execute('javac',['-proc:none','-encoding','UTF-8','-d',out,join(out,'ObservationOracle.java'),join(dir,'utils/BArray.java')]);
  return input=>execute('java',['-cp',out,'port.oracle.ObservationOracle'],input).trimEnd().split('\n');
}
function cases(){
  const entries=[];
  for(const v of [0,1,4,17,1024])for(const explored of [0,1,4,17,1024,1025])for(const f of [0,1,4,17,1023,1024,1025]){
    for(const old of [false,true]){
      const visible='10'.repeat(Math.ceil(v/2)).slice(0,v),visited=(old?'1':'0').repeat(explored);
      const mapped='01'.repeat(Math.ceil(explored/2)).slice(0,explored),mask='001'.repeat(Math.ceil(f/3)).slice(0,f);
      entries.push({visible,visited,mapped,ops:['n','u'+mask,'o'+mask,'a'+mask,'o'+'1'.repeat(f),'o'+'0'.repeat(f)]});
    }
  }
  return entries;
}
function actual(e){
  const memory=new LevelExploration(flags(e.visited),flags(e.mapped));let input,fail,after;const trace=[];
  const observer=new RunObservation(flags(e.visible),()=>{trace.push('after:'+bits(observer.visible)+':'+bits(memory.visited));if(after)throw new Error('after');});
  const level={updateHeroFieldOfView(){trace.push('fov');if(fail)throw new Error('update');return input;},rememberVisible:v=>memory.remember(v)};
  return e.ops.map(op=>{trace.length=0;fail=op[0]==='u';after=op[0]==='a';input=flags(op.slice(1));let result='ok';
    try{observer.observe(op[0]==='n'?null:level);}catch(error){result=error instanceof RangeError?'bounds':error.message;}
    return[result,bits(observer.visible),bits(memory.visited),bits(memory.mapped),trace.join(',')].join('|');}).join('\t');
}

test('Dungeon.observe and original BArray.or preserve visible/visited separation, ordering and partial errors',(t)=>{
  const oracle=compile(t),entries=cases();const expected=oracle(entries.map(e=>[e.visible,e.visited,e.mapped,e.ops.join(';')].join('|')).join('\n')+'\n');
  assert.equal(expected.length,entries.length);entries.forEach((e,i)=>assert.equal(actual(e),expected[i],`case ${i}`));
  t.diagnostic(`${entries.length} observation sequences / ${entries.reduce((n,e)=>n+e.ops.length,0)} original-Java checkpoints`);
});

test('no active level preserves the old view without calling rendering or sight',()=>{
  const observer=new RunObservation(Uint8Array.of(1,0),()=>{throw new Error('must not render');});observer.observe(null);assert.deepEqual(observer.snapshot(),Uint8Array.of(1,0));
});

test('failed arraycopy leaves visibility intact, but a later afterObserve failure retains committed visibility and exploration',()=>{
  const memory=new LevelExploration(new Uint8Array(3),new Uint8Array(3));
  const observer=new RunObservation(Uint8Array.of(1,0,0),()=>{throw new Error('after');});
  assert.throws(()=>observer.observe({updateHeroFieldOfView:()=>Uint8Array.of(0),rememberVisible:()=>assert.fail()}),RangeError);
  assert.deepEqual(observer.snapshot(),Uint8Array.of(1,0,0));
  assert.throws(()=>observer.observe({updateHeroFieldOfView:()=>Uint8Array.of(0,1,0),rememberVisible:v=>memory.remember(v)}),/after/);
  assert.deepEqual(memory.snapshot().visited,Uint8Array.of(0,1,0));assert.deepEqual(observer.snapshot(),Uint8Array.of(0,1,0));
});

test('mapped cells do not become visible or visited and snapshots do not mutate either owner',()=>{
  const memory=new LevelExploration(new Uint8Array(3),new Uint8Array(3));memory.mapCell(2);
  memory.remember(Uint8Array.of(1,0,0));const s=memory.snapshot();s.visited[1]=1;s.mapped[0]=1;
  assert.deepEqual(memory.snapshot(),{visited:Uint8Array.of(1,0,0),mapped:Uint8Array.of(0,0,1)});
});

test('real level sight can be reused for a monster without corrupting the hero view or exploration',()=>{
  const tiles=new Int32Array(1024).fill(TERRAIN.EMPTY),grid=new TerrainGrid(tiles);grid.buildFlagMaps();grid.cleanWalls();
  const sight=new LevelSight(new GridShadowCaster(32,32)),memory=new LevelExploration(new Uint8Array(1024),new Uint8Array(1024));
  let pos=528;const hero={get position(){return pos;},viewDistance:1,hasBlindness:()=>false,hasShadows:()=>false,isAlive:()=>true,
    mindVisionDistances:()=>[],hasMindVision:()=>false,isHero:()=>true,isHuntress:()=>false,hasAwareness:()=>false};
  const world={losBlocking:grid.mask('losBlocking'),discoverable:grid.mask('discoverable'),mobPositions:()=>[],heapPositions:()=>[]};
  let notifications=0;const observer=new RunObservation(new Uint8Array(1024),()=>notifications++);
  const level={updateHeroFieldOfView:()=>sight.update(hero,world),rememberVisible:v=>memory.remember(v)};
  observer.observe(level);const before=observer.snapshot();sight.update({...hero,position:33},world);
  assert.deepEqual(observer.snapshot(),before);pos=532;observer.observe(level);
  assert.equal(observer.visible[528],0);assert.equal(memory.visited[528],1);assert.equal(observer.visible[532],1);assert.equal(notifications,2);
});
