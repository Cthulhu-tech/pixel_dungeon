import * as E from '../../src/modules/effects/index.ts';
import { CharacterStatus } from '../../src/modules/actors/index.ts';
export const statusNames=['Cripple','Slow','Speed','Vertigo','Amok','Rage','Sleep','MindVision','Awareness','Blindness','Light','Paralysis','Roots','Levitation','Invisibility','Shadows'];
export function floatBits(n){const view=new DataView(new ArrayBuffer(4));view.setFloat32(0,n);return Number.isNaN(n)?2143289344:view.getUint32(0);}
export function fromBits(n){const view=new DataView(new ArrayBuffer(4));view.setUint32(0,Number(n));return view.getFloat32(0);}
export function statusHost(){
  const objects=[],events=[],times=new Map();let level=8,enemies=0,failAt=0;
  const key=b=>objects.indexOf(b), members=t=>Array.from(t.members,b=>key(b)).join(',');
  const flags=t=>[Number(t.status.paralysed),Number(t.status.rooted),Number(t.status.flying),t.status.invisible,t.status.viewDistance].join(',');
  const both=()=>targets.map(flags).join('/');
  const event=s=>{events.push(s);if(failAt>0&&events.length===failAt)throw new Error('injected');};
  const matches=(b,c)=>b.classId===c||c==='Buff'||c==='FlavourBuff'&&b instanceof E.FlavourBuff||c==='Invisibility'&&b instanceof E.Invisibility;
  const targets=Array.from({length:2},(_,index)=>({index,status:new CharacterStatus(),alive:true,members:new Set(),blocked:new Set(),
    isImmuneTo(c){event('immunities:'+index);return this.blocked.has(c);},
    addBuff(b){this.members.add(b);event('add:'+index+':'+key(b)+':'+flags(this));},
    removeBuff(b){this.members.delete(b);event('remove:'+index+':'+key(b)+':'+flags(this));},
    findBuff(c){event('find:'+index+':'+c);for(const b of this.members)if(matches(b,c))return b;return null;},
  }));
  const clock={
    spend(b,t){times.set(b,Math.fround((times.get(b)??0)+Math.fround(t)));event('spend:'+key(b)+':'+floatBits(t));},
    postpone(b,t){times.set(b,Math.max(times.get(b)??0,Math.fround(t)));event('postpone:'+key(b)+':'+floatBits(t));},
    deactivate(b){times.set(b,Math.fround(3.4028234663852886e38));event('inactive:'+key(b));},
  };
  const observe={observe(){event('observe:'+both());}};
  const paralysis={setParalysed:(t,v)=>t.status.setParalysed(v)};
  const roots={isFlying:t=>t.status.flying,setRooted:(t,v)=>t.status.setRooted(v)};
  const levitation={setFlying:(t,v)=>t.status.setFlying(v),press:t=>event('press:33:'+flags(t)+':'+members(t))};
  const counter={invisible:t=>t.status.invisible,setInvisible:(t,v)=>t.status.setInvisible(v)};
  const visibleEnemies=()=>{event('enemies');return enemies;};
  const light={...observe,levelViewDistance:()=>level,setViewDistance:(t,v)=>t.status.setViewDistance(v)};
  const shadow={...counter,...observe,isAlive:t=>{event('alive:'+t.index);return t.alive;},visibleEnemies,meldSound:()=>event('sound:snd_meld.mp3:'+both())};
  const resistance={resistance:t=>t.findBuff('Resistance')};
  function create(name){
    switch(name){
      case 'Paralysis':return new E.Paralysis(clock,paralysis);
      case 'Roots':return new E.Roots(clock,roots);
      case 'Levitation':return new E.Levitation(clock,levitation);
      case 'Invisibility':return new E.Invisibility(clock,counter);
      case 'Shadows':return new E.Shadows(clock,shadow);
      case 'Light':return new E.Light(clock,light);
      case 'MindVision':return new E.MindVision(clock,observe);
      case 'Awareness':return new E.Awareness(clock,observe);
      case 'Blindness':return new E.Blindness(clock,observe);
      case 'Frost':return new E.FlavourBuff('Frost',clock); // query neighbor only, not claimed implemented.
      default:{const Type=E[name];if(!statusNames.includes(name)||typeof Type!=='function')throw new Error('Unknown status '+name);return new Type(clock);}
    }
  }
  function execute(cmd){const a=cmd.split(':');switch(a[0]){
    case 'new':{const b=create(a[1]);objects.push(b);times.set(b,0);return String(key(b));}
    case 'attach':return String(objects[Number(a[1])].attachTo(targets[Number(a[2])]));
    case 'detach':objects[Number(a[1])].detach();return 'void';
    case 'act':return String(objects[Number(a[1])].act());
    case 'flag':{const t=targets[Number(a[1])],s=t.status;switch(a[2]){
      case 'paralysed':s.setParalysed(a[3]==='1');break;
      case 'rooted':s.setRooted(a[3]==='1');break;
      case 'flying':s.setFlying(a[3]==='1');break;
      case 'alive':t.alive=a[3]==='1';break;
      case 'invisible':s.setInvisible(Number(a[3]));break;
      case 'viewDistance':s.setViewDistance(Number(a[3]));break;
    }return 'void';}
    case 'immune':{const t=targets[Number(a[1])];a[3]==='1'?t.blocked.add(a[2]):t.blocked.delete(a[2]);return 'void';}
    case 'level':level=a[1]==='null'?null:Number(a[1]);return 'void';
    case 'enemies':enemies=Number(a[1]);return 'void';
    case 'fail':failAt=Number(a[1]);return 'void';
    case 'unfreeze':E.Paralysis.unfreeze(targets[Number(a[1])],paralysis);return 'void';
    case 'dispel':E.Invisibility.dispel({hero:()=>targets[0],visibleEnemies});return 'void';
    case 'prolong':objects[Number(a[1])].prolong();return 'void';
    case 'own':return String(floatBits(objects[Number(a[1])].ownState().left));
    case 'restore':objects[Number(a[1])].restoreOwnState({left:fromBits(a[2])});return 'void';
    case 'duration':{
      const target=targets[Number(a[2])];for(const b of target.members)if(b.classId==='Resistance')target.members.delete(b);
      if(a[3]!=='null')target.members.add({classId:'Resistance',durationFactor(){event('factor');return fromBits(a[3]);}});
      return String(floatBits(E[a[1]].duration(target,resistance)));
    }
    case 'info':{const info=E.statusInfo(objects[Number(a[1])].classId);return [info.icon,info.title??'null',info.duration===undefined?'null':floatBits(info.duration)].join(',');}
    default:throw new Error('Unknown command '+cmd);
  }}
  return {objects,targets,times,events,create,clock,execute,ports:{observe,paralysis,roots,levitation,counter,light,shadow},
    step(cmd){events.length=0;let result;try{result=execute(cmd);}catch(e){if(e instanceof TypeError)result='error:null';else if(e.message==='injected')result='error:injected';else throw e;}
      const records=objects.map(b=>[(b.target===null?-1:b.target.index),floatBits(times.get(b)??0)].join(',')).join('/');
      return [result,both(),targets.map(members).join('/'),records,events.join(';')].join('~');
    }};
}
export function statusFixtures(){
  const scenarios=[];
  for(const name of statusNames)for(const target of [0,1])for(const immune of [false,true])for(const flight of [false,true]){
    const other=1-target;
    scenarios.push([`new:${name}`,'info:0',`flag:${target}:flying:${Number(flight)}`,`immune:${target}:${name}:${Number(immune)}`,
      `attach:0:${target}`,`attach:0:${target}`,'act:0','detach:0',`attach:0:${other}`,'detach:0','detach:0']);
  }
  for(const name of statusNames)for(let fail=1;fail<=5;fail++)scenarios.push([`new:${name}`,`fail:${fail}`,'attach:0:0','detach:0','act:0','fail:0','attach:0:1','detach:0']);
  for(const level of ['null',0,2,4,8,32])scenarios.push(['new:Light',`level:${level}`,'attach:0:0','level:3','detach:0','level:null','attach:0:1','detach:0']);
  scenarios.push(['new:Paralysis','new:Paralysis','new:Frost','attach:0:0','attach:1:0','attach:2:0','detach:0','detach:1','unfreeze:0','detach:2','unfreeze:0']);
  scenarios.push(['new:Roots','new:Roots','new:Levitation','attach:0:0','attach:1:0','attach:2:0','detach:2','detach:1']);
  for(const count of [-2147483648,-1,0,2147483647])scenarios.push(['new:Invisibility','new:Shadows',`flag:0:invisible:${count}`,'attach:0:0','attach:1:0','enemies:0','dispel','enemies:1','dispel','dispel','dispel','detach:0']);
  for(const left of [-Infinity,-1,0,1,2,3,1e-45,0.99999994,16777216,Infinity,NaN])for(const visible of [0,1])for(const alive of [0,1]){
    scenarios.push(['new:Shadows','attach:0:0',`restore:0:${floatBits(left)}`,'own:0',`flag:0:alive:${alive}`,`enemies:${visible}`,'act:0','own:0','act:0','own:0','prolong:0','own:0']);
  }
  for(const name of ['Slow','Vertigo','Paralysis'])for(const factor of [null,0,-1,0.1,0.33333334,1,1e-45,3.4028235e38,Infinity,NaN]){
    scenarios.push([`duration:${name}:0:${factor===null?'null':floatBits(factor)}`]);
  }
  let seed=0x53544154;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  for(let n=0;n<96;n++){
    const commands=['new:Roots','new:Levitation','new:Paralysis','new:Invisibility','new:Shadows','new:Light','new:MindVision'];
    for(let j=0;j<32;j++){
      const action=next()%10,k=next()%7,target=next()%2;
      commands.push([`attach:${k}:${target}`,`detach:${k}`,`act:${k}`,`flag:${target}:alive:${next()%2}`,`enemies:${next()%3}`,`level:${next()%9}`,`flag:${target}:flying:${next()%2}`,'dispel',`unfreeze:${target}`,'prolong:4'][action]);
    }scenarios.push(commands);
  }
  return scenarios;
}
