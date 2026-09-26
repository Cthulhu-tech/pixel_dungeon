import test from 'node:test';
import assert from 'node:assert/strict';
import { LevelSight, GridShadowCaster, TerrainGrid, TERRAIN } from '../../src/modules/grid/index.ts';
import { compileLevelOracle, bits } from '../support/level-oracle.mjs';
const mask=fn=>Uint8Array.from({length:1024},(_,i)=>Number(fn(i)));
function host(e){
  const events=[];const caster=new GridShadowCaster(32,32);
  const sight=new LevelSight({castShadow(...args){events.push('cast');caster.castShadow(...args);}});
  const actor={position:e.pos,viewDistance:e.radius,
    hasBlindness:()=>{events.push('buff:Blindness');return Boolean(e.flags&1);},
    hasShadows:()=>{events.push('buff:Shadows');return Boolean(e.flags&2);},
    isAlive:()=>{events.push('alive');return Boolean(e.flags&4);},
    mindVisionDistances:()=>{events.push('buffs:MindVision');return e.distances;},
    hasMindVision:()=>{events.push('buff:MindVision');return Boolean(e.flags&32);},
    isHero:()=>Boolean(e.flags&8),isHuntress:()=>Boolean(e.flags&16),
    hasAwareness:()=>{events.push('buff:Awareness');return Boolean(e.flags&64);},
  };
  const world={losBlocking:e.blockers,discoverable:e.discoverable,
    mobPositions:()=>{events.push('mobs');return e.mobs;},heapPositions:()=>{events.push('heaps');return e.heaps;}};
  if(e.warm){sight.update({...actor,position:528,viewDistance:8,hasBlindness:()=>false,hasShadows:()=>false,
    isAlive:()=>true,mindVisionDistances:()=>[],hasMindVision:()=>false,isHero:()=>false,hasAwareness:()=>false},world);events.length=0;}
  return{sight,actor,world,events};
}
function basic(){return{pos:528,radius:8,flags:4,distances:[],mobs:[33,530,990],heaps:[560],blockers:mask(()=>false),discoverable:mask(()=>true),warm:false};}
function fixtures(){
  const result=[],worlds=[mask(()=>false),mask(()=>true),mask(i=>i%32===16),mask(i=>i<32||i>=992||i%32===0||i%32===31),mask(i=>(i*31+i%7)%13<5)];
  for(let w=0;w<worlds.length;w++)for(let flags=0;flags<128;flags++)for(const radius of [0,3,8,9]){
    const e=basic();Object.assign(e,{pos:[33,528,990,31][flags%4],radius,flags,blockers:worlds[w],
      discoverable:mask(i=>w%2===0||i%3!==0),distances:[[],[1],[2],[3,8]][(flags>>2)%4],warm:flags%2===1});result.push(e);
  }
  for(const pos of [-1,1024,2147483647])for(const flags of [4,5,36,68])result.push({...basic(),pos,flags});
  for(const distance of [-10,0,1,8,33,2147483647])for(const flags of [4,5,36])result.push({...basic(),flags,distances:[distance]});
  for(const pos of [-1,0,31,992,1023,1024]){
    result.push({...basic(),flags:36,mobs:[pos]});result.push({...basic(),flags:68,heaps:[pos]});
  }
  for(const length of [0,1023])for(const flags of [4,5,36])result.push({...basic(),flags,discoverable:new Uint8Array(length),distances:[2]});
  return result;
}
function serialize(e){return[e.pos,e.radius,e.flags,e.distances.join(','),e.mobs.join(','),e.heaps.join(','),bits(e.blockers),bits(e.discoverable),Number(e.warm)].join('|');}
function evaluate(e){const h=host(e);let result='ok';try{h.sight.update(h.actor,h.world);}catch(error){if(!(error instanceof RangeError))throw error;result=error.message.includes('fromIndex > toIndex')?'illegal-range':'bounds';}return[result,bits(h.sight.snapshot()),h.events.join(',')].join('|');}

test('Level.updateFieldOfView matches original Java with actual ShadowCaster, special senses and query order',(t)=>{
  const oracle=compileLevelOracle(t),cases=fixtures(),expected=oracle.evaluate('sight',cases.map(serialize).join('\n')+'\n');
  assert.equal(expected.length,cases.length);cases.forEach((e,i)=>assert.equal(evaluate(e),expected[i],`case ${i}: pos ${e.pos}, flags ${e.flags}, radius ${e.radius}`));
  t.diagnostic(`${cases.length} original-Level sight cases; all 1024 output cells and ordered queries; actual original ShadowCaster compiled unchanged`);
});

test('blindness short-circuits Shadows and shadow casting, but dead actors retain the local discoverable sense',()=>{
  const h=host({...basic(),flags:1});h.sight.update(h.actor,h.world);
  assert.ok(!h.events.includes('buff:Shadows'));assert.ok(!h.events.includes('cast'));assert.equal(h.sight.snapshot().reduce((a,b)=>a+b),9);
});

test('MindVision masks the whole cast by discoverable before revealing creatures',()=>{
  const h=host({...basic(),flags:36,distances:[2],discoverable:mask(()=>false),mobs:[530],heaps:[]});h.sight.update(h.actor,h.world);
  assert.equal(h.sight.snapshot()[528],0);assert.equal(h.sight.snapshot()[530],1);assert.equal(h.sight.snapshot().reduce((a,b)=>a+b),9);
});

test('Huntress senses only distance-two mobs, awareness reveals heaps, and subsequent casts replace the shared result',()=>{
  const h=host({...basic(),flags:4|8|16|64,radius:0,mobs:[530,534],heaps:[560]});
  const borrow=h.sight.update(h.actor,h.world),copy=h.sight.snapshot();assert.equal(borrow[530],1);assert.equal(borrow[534],0);assert.equal(borrow[560],1);
  h.actor.hasAwareness=()=>false;h.actor.isHuntress=()=>false;h.sight.update(h.actor,h.world);
  assert.equal(borrow[530],0);assert.equal(copy[530],1);
});

test('sensing reads missing discoverable entries even when the visibility bit is false (Java &=)',()=>{
  const h=host({...basic(),flags:5,discoverable:new Uint8Array(1)});assert.throws(()=>h.sight.update(h.actor,h.world),RangeError);
});

test('doors and terrain masks drive the real caster without a second world state',()=>{
  const tiles=new Int32Array(1024).fill(TERRAIN.WALL);for(let x=1;x<31;x++)tiles[16*32+x]=TERRAIN.EMPTY;tiles[16*32+17]=TERRAIN.DOOR;
  const grid=new TerrainGrid(tiles);grid.buildFlagMaps();grid.cleanWalls();
  const h=host(basic());h.world.losBlocking=grid.mask('losBlocking');h.world.discoverable=grid.mask('discoverable');
  h.sight.update(h.actor,h.world);assert.equal(h.sight.snapshot()[530],0);
  grid.set(529,TERRAIN.OPEN_DOOR);h.sight.update(h.actor,h.world);assert.equal(h.sight.snapshot()[530],1);
});
