import { CharacterBuffs } from '../../src/modules/actors/index.ts';
import { readFileSync } from 'node:fs';
const labels=JSON.parse(readFileSync(new URL('../../src/modules/actors/assets/buff-labels.en.json',import.meta.url),'utf8'));
export const kinds=['Buff','Poison','Amok','Slow','MindVision','Paralysis','Terror','Roots','Cripple','Bleeding','Vertigo','Sleep','Burning','Levitation','Frost','Invisibility','Shadows','Light','Charm','ChildPoison','ChildBurning'];
export function collectionHost(input){
  const members=new Set(), trace=[];
  let position=33,invisible=input.invisible,sprite=input.sprite,collection;
  const event=text=>{trace.push(text);if(input.failAt>0&&trace.length===input.failAt)throw new Error('injected');};
  const ids=values=>Array.from(values,b=>b.key).join(',');
  const objects=input.kinds.map((kind,key)=>({kind,key,object:key+10,detach(){
    event('detach:'+key);
    if((input.hooks&4)&&key===0&&objects.length>1)collection.remove(objects[1]);
    collection.remove(this);
  }}));
  const isInstance=(b,k)=>k==='Buff'||b.kind===k||b.kind==='Shadows'&&k==='Invisibility'||b.kind==='ChildPoison'&&k==='Poison'||b.kind==='ChildBurning'&&k==='Burning';
  const needSprite=()=>{if(!sprite)throw new TypeError('Original null sprite');};
  // Original filtered java.util.HashSet: test-owned unique hashes 0..7, no collisions/resizes.
  const selection=()=>{const selected=new Set();return{add:b=>selected.add(b),delete:b=>selected.delete(b),
    *[Symbol.iterator](){yield* Array.from(selected).sort((a,b)=>a.key-b.key);}};};
  collection=new CharacterBuffs(members,selection,{isInstance,charmObject:b=>b.object},{
    add(b){event('actor+:'+b.key+':'+ids(members));if(input.hooks&1)position++;},
    remove(b){event('actor-:'+b.key+':'+ids(members));if(input.hooks&2)invisible--;},
  },{position:()=>position,invisibleCount:()=>invisible},{
    available:()=>sprite,
    poisonSplash(pos,count){event('center:'+pos);event('burst:'+count);},
    status(tone,key){needSprite();event('status:'+tone+':'+labels[key]);},
    addState(state){needSprite();event('state+:'+state);},
    removeState(state){needSprite();event('state-:'+state);},idle(){needSprite();event('idle');},
  });
  function execute(op){const [action,arg]=op.split(',');switch(action){
    case 'add':collection.add(objects[Number(arg)]);return 'void';
    case 'remove':collection.remove(objects[Number(arg)]);return 'void';
    case 'find':{const b=collection.find(arg);return b===null?'null':'id:'+b.key;}
    case 'filter':return 'ids:'+ids(collection.matching(arg));
    case 'removeType':collection.removeMatching(arg);return 'void';
    case 'all':return 'ids:'+ids(collection.all());
    case 'update':collection.updateSpriteState();return 'void';
    case 'detachAll':collection.detachAll();return 'void';
    case 'charm':return String(collection.isCharmedBy(()=>{event('id:'+arg);return Number(arg);}));
    case 'sprite':sprite=arg==='1';return 'void';
    case 'invisible':invisible=Number(arg);return 'void';
    default:throw new Error('Unknown command '+action);
  }}
  return {collection,objects,members,trace,execute,
    checkpoint(op){trace.length=0;let result;
      try{result=execute(op);}catch(e){if(e instanceof TypeError)result='error:null';else if(e.message==='injected')result='error:injected';else throw e;}
      return [result,ids(members),position,invisible,trace.join(',')].join('~');
    }};
}
export function collectionFixtures(){
  const rows=[];
  for(const kind of kinds)for(const sprite of [false,true])for(const invisible of [-1,0,1,2])for(const hooks of [0,3]){
    const ops=['find,Buff','charm,10','add,1','add,0','add,0','all','find,'+kind,'filter,Buff','update','charm,10','remove,0','remove,0','add,0','removeType,Buff','add,0','add,1','detachAll','all'];
    rows.push({kinds:[kind,kind],ops,sprite,invisible,hooks,failAt:0});
  }
  const special=['Shadows','Invisibility','Charm','ChildPoison','ChildBurning','Light'];
  rows.push({kinds:special,ops:['add,4','add,3','add,0','add,1','add,2','add,5','find,Invisibility','filter,Invisibility','update','removeType,Invisibility','detachAll'],sprite:true,invisible:0,hooks:4,failAt:0});
  for(let failAt=1;failAt<=10;failAt++)rows.push({kinds:['Poison','Burning','Shadows','Paralysis','Light'],ops:['add,0','add,1','add,2','add,3','add,4','update','removeType,Buff','detachAll'],sprite:true,invisible:0,hooks:3,failAt});
  let seed=0x42554646;const draw=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  for(let n=0;n<128;n++){
    const ks=Array.from({length:6},()=>kinds[draw()%kinds.length]);
    const ops=Array.from({length:32},()=>{
      const d=draw(),k=ks[draw()%ks.length],i=draw()%ks.length;
      return ['add,'+i,'remove,'+i,'find,'+k,'filter,'+k,'removeType,'+k,'update','detachAll','charm,'+(10+i),'sprite,'+(d%2),'invisible,'+(d%3-1)][d%10];
    });rows.push({kinds:ks,ops,sprite:true,invisible:n%3,hooks:n%8,failAt:0});
  }
  return rows;
}
