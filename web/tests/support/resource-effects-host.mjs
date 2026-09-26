import * as E from '../../src/modules/effects/index.ts';
import { JavaRandom } from '../../src/modules/compatibility/index.ts';
import { resultDescription } from '../../src/modules/run/index.ts';
import messages from '../../src/modules/effects/assets/effect-messages.en.json' with { type: 'json' };
import { floatBits,fromBits } from './status-effects-host.mjs';
export const resourceNames=['Poison','Bleeding','Barkskin','Fury','Ooze','Regeneration','GasesImmunity','SnipersMark','Charm','Terror','Weakness','Combo','Hunger','Frost','Burning'];
export function resourceHost(tape){
  const objects=[],events=[],times=new Map(),diagnostics=[],water=new Uint8Array(1024),flammable=new Uint8Array(1024);
  let draws=0,now=0,enemies=0,failAt=0,doom=false;
  const key=b=>{let i=objects.indexOf(b);if(i<0){objects.push(b);i=objects.length-1;}return i;};
  const flags=t=>[t.HP,t.HT,Number(t.paralysed),Number(t.rooted),Number(t.flying),t.invisible,t.viewDistance].join(',');
  const both=()=>targets.map(flags).join('/');
  const event=text=>{events.push(text);if(failAt>0&&events.length===failAt)throw new Error('injected');};
  const isHero=t=>t.kind==='Hero';
  const hero=t=>{if(!isHero(t))throw new Error('cast');return t;};
  const matches=(b,c)=>b.classId===c||c==='Buff'||c==='FlavourBuff'&&b instanceof E.FlavourBuff||c==='Invisibility'&&b instanceof E.Invisibility;
  const targets=['Hero','Char','Thief','Hero'].map((kind,index)=>({index,kind,HP:10,HT:10,pos:33,paralysed:false,rooted:false,flying:false,invisible:0,viewDistance:8,sprite:true,weakened:false,rogue:false,item:null,accept:true,
    members:new Set(),blocked:new Set(),
    isImmuneTo(c){event('immunities:'+index);return this.blocked.has(c);},
    addBuff(b){this.members.add(b);event('add:'+index+':'+key(b)+':'+flags(this));},
    removeBuff(b){this.members.delete(b);event('remove:'+index+':'+key(b)+':'+flags(this));},
    findBuff(c){event('find:'+index+':'+c);for(const b of this.members)if(matches(b,c))return b;return null;},
    filtered(c){event('filter:'+index+':'+c);return Array.from(this.members).filter(b=>matches(b,c));},
  }));
  function own(b){
    if(typeof b.ownState!=='function')return '';
    return Object.entries(b.ownState()).sort(([a],[z])=>a.localeCompare(z)).map(([name,n])=>
      name+':'+(name==='left'||b.classId==='Hunger'?'f'+floatBits(n):'i'+n)).join(',');
  }
  const ownAll=()=>objects.map(own).join('/');
  const clock={
    spend(b,t){times.set(b,Math.fround((times.get(b)??0)+Math.fround(t)));event('spend:'+key(b)+':'+floatBits(t));},
    postpone(b,t){times.set(b,Math.max(times.get(b)??0,Math.fround(now+Math.fround(t))));event('postpone:'+key(b)+':'+floatBits(t));},
    deactivate(b){times.set(b,Math.fround(3.4028234663852886e38));event('inactive:'+key(b));},
  };
  const random=new JavaRandom({nextDouble(){event('rng:'+draws);if(draws>=tape.length)throw new Error('tape');return tape[draws++];}});
  const vitals={
    isAlive(t){event('alive:'+t.index);return t.HP>0;},hp:t=>t.HP,ht:t=>t.HT,
    damage(t,n,source){event('damage:'+t.index+':'+n+':'+key(source));t.HP=(t.HP-n)|0;if(doom&&isHero(t)&&t.HP<=0&&typeof source.onDeath==='function')source.onDeath();},
  };
  const death={badge:c=>event('badge:'+c),fail:c=>event('fail:'+resultDescription(c.toUpperCase()).replace('%d','17')),
    deathMessage:c=>event('negative:'+messages[c].replace('%s',E.statusInfo(c).title))};
  const terrain=(mask,t)=>{if(t.pos<0||t.pos>=1024)throw new RangeError('bounds');return Boolean(mask[t.pos]);};
  const weak={requireHero:t=>{hero(t);},setWeakened:(t,v)=>{hero(t).weakened=v;},discharge:t=>event('discharge:'+hero(t).index)};
  const para={setParalysed:(t,v)=>{t.paralysed=v;}};
  const observe={observe:()=>event('observe:'+both())};
  const light={...observe,levelViewDistance:()=>8,setViewDistance:(t,v)=>{t.viewDistance=v;}};
  const counter={invisible:t=>t.invisible,setInvisible:(t,v)=>{t.invisible=v;}};
  const resistance={resistance:t=>t.findBuff('Resistance')};
  const itemKind=i=>i===null?'null':i.classId;
  const food={isHero,randomUnequipped(t){event('item:'+hero(t).index);return t.item;},
    isMysteryMeat:i=>i!==null&&i.classId==='MysteryMeat',isScroll:i=>i!==null&&i.classId==='Scroll',
    detachOne(t,item){event('detachItem:'+hero(t).index+':'+itemKind(item));t.item=null;return item;},
    createFood(kind){event('food:'+kind);return {classId:kind};},
    collectFood(t,item){event('collect:'+hero(t).index+':'+itemKind(item));if(t.accept){t.item=item;return true;}return false;},
    dropFood(t,item){event('drop:'+t.pos+':'+itemKind(item));return {playDrop:()=>event('dropPlayback')};},
  };
  const operations=new E.BuffOperations({catchesAsJavaException:e=>e instanceof Error,reportCaught:e=>diagnostics.push(e)});
  const burning={...vitals,...death,...food,
    prolongLight:(t,d)=>operations.prolong(t,{classId:'Light',create:()=>new E.Light(clock,light)},d),
    intBetween:(a,b)=>random.intBetween(a,b),float:()=>random.float(),
    itemName(item){event('itemName:'+itemKind(item));return itemKind(item);},burnsMessage:s=>event('warning:'+messages.burns.replace('%s',s)),
    burnFx:t=>event('burnFX:'+t.pos),isThief:t=>t.kind==='Thief',thiefItem:t=>t.item,
    clearThiefItem:t=>{t.item=null;},stolenScrollBurst(t,n){event('emitter:'+t.index);event('burst:'+t.index+':'+n);},
    isFlammable:t=>terrain(flammable,t),spreadFire(t,n){event('seed:'+t.pos+':'+n+':Fire');event('addBlob');},
    isWater:t=>terrain(water,t),isFlying:t=>t.flying,
  };
  const hunger={...vitals,...death,requireHero:t=>{hero(t);},isRogue:t=>hero(t).rogue,paralysed:t=>t.paralysed,
    satietyLevels:t=>t.filtered('Satiety').map(b=>b.level),float:()=>random.float(),
    hungerMessage:s=>event((s==='hungry'?'warning:':'negative:')+messages[s]),interrupt:t=>event('interrupt:'+hero(t).index+':'+ownAll()),refreshHero:()=>event('refresh:'+ownAll()),
  };
  const bleeding={...vitals,...death,intBetween:(a,b)=>random.intBetween(a,b),
    spriteVisible:t=>t.sprite,spriteCenter(t){event('center:'+t.index);return {x:12.5,y:19.25};},
    bloodColor(t){event('blood:'+t.index);return 123456;},splash:(p,d,c,col,n)=>event(['splash',floatBits(p.x),floatBits(p.y),floatBits(d),floatBits(c),col,n].join(':')),isHero:t=>t===targets[0],
  };
  const regen={...vitals,heroIsStarving(t){hero(t);event('starving:'+t.index);return t.findBuff('Hunger')?.isStarving()??false;},
    addHp:(t,n)=>{t.HP=(t.HP+n)|0;},rejuvenationLevels:t=>t.filtered('Rejuvenation').map(b=>b.level)};
  function create(name){switch(name){
    case 'Poison':return new E.Poison(clock,{...vitals,...death});
    case 'Bleeding':return new E.Bleeding(clock,bleeding);
    case 'Barkskin':return new E.Barkskin(clock,vitals);
    case 'Fury':return new E.Fury(clock,vitals);
    case 'Ooze':return new E.Ooze(clock,{...vitals,...death,isHero:t=>t===targets[0],isWater:t=>terrain(water,t)});
    case 'Regeneration':return new E.Regeneration(clock,regen);
    case 'Hunger':return new E.Hunger(clock,hunger);
    case 'Weakness':return new E.Weakness(clock,weak);
    case 'Combo':return new E.Combo(clock,{validate:n=>event('comboBadge:'+n),message:n=>event('positive:'+messages.combo.replace('%d',n))});
    case 'Frost':return new E.Frost(clock,{...food,...para});
    case 'Burning':return new E.Burning(clock,burning);
    case 'Paralysis':return new E.Paralysis(clock,para);
    case 'Light':return new E.Light(clock,light);
    case 'Shadows':return new E.Shadows(clock,{...vitals,...counter,...observe,visibleEnemies:()=>{event('enemies');return enemies;},meldSound:()=>event('sound:snd_meld.mp3')});
    case 'Roots':return new E.Roots(clock,{isFlying:t=>t.flying,setRooted:(t,v)=>{t.rooted=v;}});
    case 'Resistance':{const b=new E.Buff(name,clock);b.factor=0;b.durationFactor=()=>{event('factor');return b.factor;};return b;}
    case 'Satiety':case 'Rejuvenation':{const b=new E.Buff(name,clock);b.level=0;return b;}
    default:{const Type=E[name];if(!resourceNames.includes(name)||typeof Type!=='function')throw new Error('Unknown resource '+name);return new Type(clock);}
  }}
  function execute(cmd){const a=cmd.split(':');switch(a[0]){
    case 'new':return String(key(create(a[1])));
    case 'attach':return String(objects[+a[1]].attachTo(targets[+a[2]]));
    case 'detach':objects[+a[1]].detach();return 'void';
    case 'act':return String(objects[+a[1]].act());
    case 'flag':{const t=targets[+a[1]],name=a[2];if(name==='rogue')hero(t);t[name]=['HP','HT','pos','invisible'].includes(name)?Number(a[3]):a[3]==='1';return 'void';}
    case 'immune':{const t=targets[+a[1]];a[3]==='1'?t.blocked.add(a[2]):t.blocked.delete(a[2]);return 'void';}
    case 'terrain':{const t=targets[+a[1]];terrain(water,t);water[t.pos]=Number(a[2]);flammable[t.pos]=Number(a[3]);return 'void';}
    case 'item':targets[+a[1]].item=a[2]==='null'?null:{classId:a[2]};return 'void';
    case 'collect':hero(targets[+a[1]]).accept=a[2]==='1';return 'void';
    case 'enemies':enemies=+a[1];return 'void';
    case 'fail':failAt=+a[1];return 'void';
    case 'doom':doom=a[1]==='1';return 'void';
    case 'now':now=fromBits(a[1]);return 'void';
    case 'own':return own(objects[+a[1]]);
    case 'restore':{const b=objects[+a[1]];b.restoreOwnState({...b.ownState(),[a[2]]:a[3]==='f'?fromBits(a[4]):+a[4]});return 'void';}
    case 'field':objects[+a[1]][a[2]]=a[2]==='factor'?fromBits(a[3]):+a[3];return 'void';
    case 'time':times.set(objects[+a[1]],fromBits(a[2]));return 'void';
    case 'set':{const b=objects[+a[1]];b.set(b instanceof E.Poison?fromBits(a[2]):+a[2]);return 'void';}
    case 'raise':objects[+a[1]].raiseLevel(+a[2]);return 'void';
    case 'bark':return String(objects[+a[1]].level());
    case 'satisfy':objects[+a[1]].satisfy(fromBits(a[2]));return 'void';
    case 'starving':return String(objects[+a[1]].isStarving());
    case 'reignite':objects[+a[1]].reignite(targets[+a[2]],resistance);return 'void';
    case 'combo':return String(objects[+a[1]].hit(null,+a[2]));
    case 'recover':E.Terror.recover(targets[+a[1]],{cooldown(b){event('cooldown:'+key(b));return Math.fround((times.get(b)??0)-now);}});return 'void';
    case 'death':objects[+a[1]].onDeath();return 'void';
    case 'duration':return String(floatBits(E[a[1]][a[2]](targets[+a[3]],resistance)));
    case 'info':{const b=objects[+a[1]];if(b instanceof E.Hunger)return b.icon()+','+messages[b.titleKey()];const i=E.statusInfo(b.classId);return i.icon+','+(i.title??'null');}
    default:throw new Error('Unknown command '+cmd);
  }}
  return {objects,targets,events,times,clock,create,execute,diagnostics,
    step(cmd){events.length=0;let result;try{result=execute(cmd);}catch(e){
      if(['cast','injected','tape'].includes(e.message))result='error:'+e.message;
      else if(e instanceof TypeError)result='error:null';else if(e instanceof RangeError)result=e.message.includes('division')?'error:division':'error:bounds';else throw e;
    }
    const ts=targets.map(t=>{
      const extra=isHero(t)?[Number(t.weakened),t.rogue?'ROGUE':'WARRIOR',itemKind(t.item),Number(t.accept)].join(','):t.kind==='Thief'?itemKind(t.item):'-';
      return flags(t)+','+t.pos+','+Number(t.sprite)+';'+extra+';'+Array.from(t.members,b=>key(b)).join(',');
    }).join('/');
    const bs=objects.map(b=>{
      const extra=b instanceof E.Barkskin?'b'+b.level():b instanceof E.Combo?'c'+b.count:b instanceof E.Ooze?'d'+b.damage:b.classId==='Resistance'?'r'+floatBits(b.factor):b.classId==='Satiety'?'s'+b.level:b.classId==='Rejuvenation'?'j'+b.level:'-';
      return [b.classId,b.target===null?-1:b.target.index,floatBits(times.get(b)??0),own(b),extra].join(',');
    }).join('/');
    return [result,ts,bs,draws,events.join(';')].join('~');
  }};
}
