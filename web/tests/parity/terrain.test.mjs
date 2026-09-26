import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TERRAIN, TerrainGrid, terrainFlags, discoverTerrain, GridDoors } from '../../src/modules/grid/index.ts';
import { compileLevelOracle, terrainDigest, root } from '../support/level-oracle.mjs';
const map = tile => Array(1024).fill(tile);
function fixtures(){
  const result=[];let seed=0x54455252;
  const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  // Every table slot, including unused IDs and all water variants.
  for(let tile=0;tile<256;tile++)result.push({map:map(tile),ops:['build','clean','water,528','destroy,528','clean','build']});
  for(let i=0;i<80;i++){
    const tiles=map(0).map(()=>next()%64);
    result.push({map:tiles,ops:['build','clean',`set,${next()%1024},${next()%256}`,
      `destroy,${33+next()%958}`,'water,528','clean','build']});
  }
  for(const cell of [-2147483648,-1,0,31,32,33,527,528,991,992,1023,1024,2147483647]){
    result.push({map:map(1),ops:['build','clean',`set,${cell},5`,`set,${cell},256`,`destroy,${cell}`,`water,${cell}`]});
  }
  for(const length of [0,1,1023,1025])result.push({map:Array(length).fill(1),ops:['build','clean',`set,${length-1},63`,'build','clean']});
  for(const tile of [-2147483648,-1,256,2147483647]){
    const tiles=map(1);tiles[42]=tile;result.push({map:tiles,ops:['build','clean','set,42,1','build','clean']});
  }
  return result;
}
function execute(grid,command){
  const [name,...args]=command.split(','),a=args.map(Number);let value='ok';
  try{switch(name){
    case 'build':grid.buildFlagMaps();break;case 'clean':grid.cleanWalls();break;
    case 'set':grid.set(...a);break;case 'destroy':grid.destroy(...a);break;
    case 'water':value=`value:${grid.waterTile(...a)}`;break;default:throw new Error(name);
  }}catch(e){if(!(e instanceof RangeError))throw e;value='bounds';}
  return `${value}:${terrainDigest(grid)}`;
}

test('original Terrain tables and Level state mutations match at every checkpoint',(t)=>{
  const oracle=compileLevelOracle(t),data=oracle.data();
  assert.deepEqual(JSON.parse(readFileSync(join(root,'web/src/modules/grid/assets/terrain.json'),'utf8')),data);
  assert.deepEqual(TERRAIN,data.constants);
  for(let id=0;id<256;id++){
    assert.equal(terrainFlags(id),data.flags[id]);
    assert.equal(discoverTerrain(id),data.discoveries[id]??id);
  }
  for(const id of [-2147483648,-1,256,2147483647])assert.equal(discoverTerrain(id),id);
  const cases=fixtures();const expected=oracle.evaluate('terrain',cases.map(e=>[e.map.join(','),e.ops.join(';')].join('|')).join('\n')+'\n');
  assert.equal(expected.length,cases.length);let checkpoints=0;
  cases.forEach((e,i)=>{const grid=new TerrainGrid(Int32Array.from(e.map)),rows=expected[i].split('\t');assert.equal(rows.length,e.ops.length);
    e.ops.forEach((op,j)=>{assert.equal(execute(grid,op),rows[j],`case ${i} op ${j}: ${op}`);checkpoints++;});});
  t.diagnostic(`${cases.length} level sequences / ${checkpoints} original-Java checkpoints; 256 table entries; full map and nine masks, including partial error states`);
});

test('build closes boundary masks, while Level.set restores raw terrain flags on that same cell',()=>{
  const grid=new TerrainGrid(new Int32Array(1024).fill(TERRAIN.EMPTY));grid.buildFlagMaps();
  assert.equal(grid.mask('passable')[0],0);grid.set(0,TERRAIN.EMPTY);assert.equal(grid.mask('passable')[0],1);
});

test('water flag intentionally differs between Level.set and buildFlagMaps on unused terrain IDs',()=>{
  const grid=new TerrainGrid(new Int32Array(1024).fill(TERRAIN.EMPTY));grid.buildFlagMaps();
  grid.set(528,64);assert.equal(grid.mask('water')[528],1);grid.buildFlagMaps();assert.equal(grid.mask('water')[528],0);
});

test('an invalid terrain assignment mutates map before throwing and does not invent new mask values',()=>{
  const grid=new TerrainGrid(new Int32Array(1024).fill(TERRAIN.EMPTY));grid.buildFlagMaps();
  assert.throws(()=>grid.set(528,256),RangeError);assert.equal(grid.tileAt(528),256);assert.equal(grid.mask('passable')[528],1);
});

test('water stitching and pit borders preserve original directional semantics',()=>{
  const tiles=new Int32Array(1024).fill(TERRAIN.EMPTY);tiles[528]=TERRAIN.WATER;tiles[496]=TERRAIN.WALL;tiles[529]=TERRAIN.DOOR;
  const grid=new TerrainGrid(tiles);grid.buildFlagMaps();assert.equal(grid.tileAt(528),TERRAIN.WATER_TILES+1+2);
  grid.set(560,TERRAIN.CHASM);grid.buildFlagMaps();assert.equal(grid.tileAt(560),TERRAIN.CHASM_WATER);
});

test('snapshots are detached and door operations update the actual terrain owner',()=>{
  const grid=new TerrainGrid(new Int32Array(1024).fill(TERRAIN.WALL));grid.buildFlagMaps();grid.cleanWalls();
  const copy=grid.snapshot();copy.map[528]=1;copy.flags.passable[528]=1;assert.equal(grid.tileAt(528),TERRAIN.WALL);
  const events=[];const doors=new GridDoors({setDoor:(cell,open)=>grid.set(cell,open?TERRAIN.OPEN_DOOR:TERRAIN.DOOR),
    updateMap:cell=>events.push(['map',cell]),observe:()=>events.push(['observe',grid.mask('losBlocking')[528]]),
    isVisible:()=>true,playOpening:()=>events.push(['sound']),hasHeap:()=>false});
  doors.enter(528);assert.equal(grid.tileAt(528),TERRAIN.OPEN_DOOR);assert.deepEqual(events,[['map',528],['observe',0],['sound']]);
  doors.leave(528);assert.equal(grid.mask('losBlocking')[528],1);
});
