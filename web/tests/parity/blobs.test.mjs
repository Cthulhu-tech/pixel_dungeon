import test from 'node:test';
import assert from 'node:assert/strict';
import { BlobField } from '../../src/modules/effects/index.ts';
import { TurnScheduler } from '../../src/modules/turns/index.ts';
import { TerrainGrid, TERRAIN } from '../../src/modules/grid/index.ts';
import { compileBlobOracle, blobDigest } from '../support/blob-oracle.mjs';
const bits=fn=>Array.from({length:1024},(_,i)=>fn(i)?'1':'0').join('');
function cases(){
  const entries=[];
  const masks=[bits(()=>false),bits(()=>true),bits(i=>i%32===16),bits(i=>i%3===0),bits(i=>i<32||i>=992||i%32===0||i%32===31)];
  for(const solid of masks)for(const cell of [0,31,32,33,496,528,529,990,991,992,1023])for(const amount of [1,50,2147483647,-1]){
    entries.push({solid,ops:[`s,${cell},${amount}`,'w','a','w','s,560,200','a','a',`c,${cell}`,'a','w']});
  }
  for(const solid of [bits(()=>false),bits(i=>i%2===0)])for(const start of [-2147483648,-1,0,31,33,528,1023,1024,2147483647]){
    for(const size of ['none','0','16','32','33'])entries.push({solid,ops:['s,528,50',`r,${start},7:-2:0:40,${size}`,'w','a','r,0,10:20,none','r,0,10:20,none','w']});
  }
  for(const length of [0,1,33,528,1023,1025])entries.push({solid:'0'.repeat(length),ops:['a','s,528,200','a','w','b,'+'0'.repeat(1024),'a','w']});
  for(const cell of [-1,1024,2147483647])entries.push({solid:bits(()=>false),ops:[`s,${cell},50`,`c,${cell}`,'s,528,100','w','a']});
  entries.push({solid:bits(()=>false),ops:['s,528,2147483647','s,529,2147483647','w','a','r,none,,16','w','r,none,,none']});
  return entries;
}
function execute(e){
  let time=0,solid=Uint8Array.from(e.solid,Number);
  const field=new BlobField(32,32,()=>solid,{spend(_,value){time=Math.fround(time+value);}});
  return e.ops.map(command=>{const [op,...args]=command.split(',');let result='ok';
    try{switch(op){
      case 's':field.seed(+args[0],+args[1]);break;case 'c':field.clear(+args[0]);break;
      case 'a':result='act:'+field.act();break;
      case 'w':{const data=field.storeOwnState();result='save:'+(data===null?'null':data.start+':'+Array.from(data.cur).join(','));break;}
      case 'r':field.restoreOwnState(args[0]==='none'?null:{start:+args[0],cur:Int32Array.from(args[1]?args[1].split(':').map(Number):[])},args[2]==='none'?null:+args[2]);break;
      case 'b':solid=Uint8Array.from(args[0],Number);break;default:throw new Error(op);
    }}catch(error){if(!(error instanceof RangeError))throw error;result='bounds';}
    return result+'|'+blobDigest(field.snapshot(),time);
  }).join('\t');
}

test('full original Blob class matches diffusion, volume, buffer swaps and own save fields at every checkpoint',(t)=>{
  const oracle=compileBlobOracle(t),entries=cases();const expected=oracle(entries.map(e=>e.solid+'|'+e.ops.join(';')).join('\n')+'\n');
  assert.equal(expected.length,entries.length);entries.forEach((e,i)=>assert.equal(execute(e),expected[i],`case ${i}`));
  t.diagnostic(`${entries.length} full-Blob Java sequences / ${entries.reduce((n,e)=>n+e.ops.length,0)} checkpoints; real source save/resize and complete current/off buffers`);
});

test('a gas tick spreads only to open cardinal cells and spends exactly one logical tick',()=>{
  const tiles=new Int32Array(1024).fill(TERRAIN.EMPTY);tiles[529]=TERRAIN.WALL;const grid=new TerrainGrid(tiles);grid.buildFlagMaps();
  let time=0;const field=new BlobField(32,32,()=>grid.mask('solid'),{spend(_,value){time+=value;}});field.seed(528,50);field.act();
  assert.equal(time,1);assert.equal(field.concentration(528),11);assert.equal(field.concentration(529),0);
  assert.equal(field.concentration(496),9);assert.equal(field.concentration(560),9);assert.equal(field.concentration(495),0);
});

test('non-positive source volume still spends a tick but skips evolution and swapping',()=>{
  let time=0;const field=new BlobField(32,32,()=>{throw new Error('must not evolve');},{spend(_,v){time+=v;}});
  field.seed(528,-1);const before=field.snapshot();assert.equal(field.act(),true);assert.deepEqual(field.snapshot(),before);assert.equal(time,1);
});

test('border values retain source double-buffer history instead of an invented boundary clear',()=>{
  const field=new BlobField(32,32,()=>new Uint8Array(1024),{spend(){}});field.seed(0,100);field.seed(528,200);field.act();assert.equal(field.concentration(0),0);
  field.act();assert.equal(field.concentration(0),100);assert.ok(field.volume>0);
});

test('own-state stores only positive bounding range; repeated restore adds volume and does not silently clear old cells',()=>{
  const field=new BlobField(32,32,()=>new Uint8Array(1024),{spend(){}});field.seed(4,20);field.seed(9,40);
  const saved=field.storeOwnState();assert.equal(saved.start,4);assert.deepEqual(saved.cur,Int32Array.of(20,0,0,0,0,40));
  field.restoreOwnState(saved,null);assert.equal(field.volume,120);saved.cur[0]=999;assert.equal(field.concentration(4),20);
  field.clear(4);assert.equal(field.volume,100);assert.equal(field.concentration(4),0);
});

test('real scheduler advances gas with the same actor clock; there is no independent frame loop',()=>{
  let scheduler;const field=new BlobField(32,32,()=>new Uint8Array(1024),{spend:(actor,t)=>scheduler.spend(actor,t)});
  const hero={character:{position:33,isMoving:false,buffs:()=>[]},act:()=>false,onAdd(){},onRemove(){}};
  scheduler=new TurnScheduler(1024,new Set(),{hero:()=>hero,heroIsAlive:()=>true,addDuration(){}});
  scheduler.add(hero);scheduler.add(field);field.seed(528,100);scheduler.process();assert.equal(scheduler.currentActor,hero);
  scheduler.spend(hero,2.5);scheduler.next(hero);scheduler.process();
  assert.equal(scheduler.currentActor,hero);assert.equal(scheduler.clockOf(field).time,3);assert.equal(scheduler.now,2.5);assert.ok(field.volume<100);
});
