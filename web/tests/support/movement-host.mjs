import { CharacterMovement } from '../../src/modules/actors/CharacterMovement.ts';
import { GridDoors } from '../../src/modules/grid/GridDoors.ts';
import { gridAdjacent, gridDistance, gridNeighbours8 } from '../../src/modules/grid/geometry.ts';

export function movementHost(e) {
  const events=[];
  const event=message=>{events.push(message); if(e.failure!=='none'&&message.startsWith(e.failure+':')) throw new Error('injected');};
  const at=(array,index)=>{if(array[index]===undefined)throw new RangeError('bounds');return array[index];};
  const map=Array(1024).fill(1), visible=Array(1024).fill(Boolean(e.visible));
  if(e.from>=0&&e.from<1024)map[e.from]=e.oldTerrain;
  if(e.to>=0&&e.to<1024)map[e.to]=e.newTerrain;
  let movement;
  const doors=new GridDoors({
    hasHeap(cell){event(`heap:${cell}`);return Boolean(e.heap);},
    setDoor(cell,open){const value=open?6:5;event(`set:${cell}:${value}`);at(map,cell);map[cell]=value;},
    updateMap(cell){event(`update:${cell}`);},
    observe(){event(`observe:${movement.position}`);if(e.observeMode!==0)visible.fill(e.observeMode===1);},
    isVisible:cell=>at(visible,cell),playOpening(){event('sound:open');},
  });
  const neighbours=gridNeighbours8(32);
  const geometry={adjacent:(a,b)=>gridAdjacent(a,b,32),distance:(a,b)=>gridDistance(a,b,32),neighbourOffset:i=>at(neighbours,i)};
  const world={
    isPassable(cell){at(map,cell);return e.mask===0||e.mask===3;},
    isAvoid(cell){at(map,cell);return e.mask===1||e.mask===4;},
    hasCharacter(cell){event(`query:${cell}`);at(map,cell);return e.mask===3||e.mask===4;},
    isOpenDoor:cell=>at(map,cell)===6,isClosedDoor:cell=>at(map,cell)===5,
    leaveDoor:cell=>doors.leave(cell),enterDoor:cell=>doors.enter(cell),isVisible:cell=>at(visible,cell),
  };
  let spriteVisible=true;
  movement=new CharacterMovement(e.from,geometry,{
    flying:Boolean(e.flags&2),isHero:Boolean(e.flags&4),hasVertigo(){event('buff');return Boolean(e.flags&1);},
  },world,{setVisible(value){spriteVisible=value;}},{intTo(max){event(`random:${max}`);return e.roll;}});
  return {movement,doors,world,events,map,visible,get spriteVisible(){return spriteVisible;}};
}
export function evaluateMovement(e) {
  if(e.method==='G')return `${gridAdjacent(e.from,e.to,32)}|${gridDistance(e.from,e.to,32)}`;
  const h=movementHost(e);let outcome='ok';
  try { if(e.method==='M')h.movement.move(e.to);else h.doors[e.method==='E'?'enter':'leave'](e.to); }
  catch(error){if(error instanceof RangeError)outcome='bounds';else if(error.message==='injected')outcome='injected';else throw error;}
  const hash=h.map.reduce((value,cell)=>(Math.imul(value,31)+cell)|0,1);
  return [outcome,h.movement.position,h.spriteVisible,hash,h.visible[0],h.events.join(',')].join('|');
}
export function movementCases() {
  const cases=[];
  const base={method:'M',from:528,to:529,flags:0,roll:0,oldTerrain:1,newTerrain:1,mask:0,heap:0,visible:0,observeMode:0,failure:'none'};
  const add=change=>cases.push({...base,...change});
  // Every direction and status combination; passable/avoid/occupied and both door states.
  for(const flags of [0,1,2,3,4,5,6,7])for(let roll=0;roll<8;roll++)for(let mask=0;mask<5;mask++)
    for(const [oldTerrain,newTerrain,heap] of [[1,1,0],[6,5,0],[6,5,1]])
      add({flags,roll,mask,oldTerrain,newTerrain,heap,observeMode:roll%3,visible:roll%2});
  // Teleport-like base moves, equal endpoints, row wrap and invalid array boundaries.
  for(const [from,to] of [[31,32],[32,31],[528,528],[528,900],[0,1],[1023,1022],[-1,33],[33,-1],[33,1024]])
    for(const flags of [0,1,2,3,4,5,6,7])for(const roll of [-1,0,3,7,8])add({from,to,flags,roll,oldTerrain:6,newTerrain:5});
  for(const method of ['M','E','L'])for(const failure of ['none','set','update','observe','sound','heap','query'])
    for(const heap of [0,1])for(const observeMode of [0,1,2])
      add({method,failure,heap,observeMode,flags:3,oldTerrain:6,newTerrain:5,visible:1});
  const cells=[-2147483648,-2147483647,-1025,-33,-32,-31,-1,0,1,31,32,33,1023,1024,2147483646,2147483647];
  for(const from of cells)for(const to of cells)add({method:'G',from,to});
  return cases;
}
export function encodeMovement(e) {
  return [e.method,e.from,e.to,e.flags,e.roll,e.oldTerrain,e.newTerrain,e.mask,e.heap,e.visible,e.observeMode,e.failure].join('|');
}
