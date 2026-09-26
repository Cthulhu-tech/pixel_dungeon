import { CombatResolver } from '../../src/modules/combat/index.ts';
import { CharacterHealth, CharacterTime } from '../../src/modules/actors/index.ts';
import { JavaRandom } from '../../src/modules/compatibility/index.ts';

export const bits = value => {
  if (Number.isNaN(value)) return 0x7fc00000;
  const v=new DataView(new ArrayBuffer(4));v.setFloat32(0,value);return v.getUint32(0);
};
export const fromBits = value => {const v=new DataView(new ArrayBuffer(4));v.setUint32(0,value);return v.getFloat32(0);};
export function entry(overrides={}) {
  return {mode:'attack',role:0,visible:3,accuracy:10,defense:0,armor:0,roll:5,
    attackBonus:0,defenseBonus:0,hp:20,ht:20,flags:0,sniper:0,deathMode:0,afterHT:'n',
    base:bits(1),time:bits(1),draws:Array(64).fill(0.5),...overrides};
}
export function encode(e) {
  return [e.mode,e.role,e.visible,e.accuracy,e.defense,e.armor,e.roll,e.attackBonus,e.defenseBonus,
    e.hp,e.ht,e.flags,e.sniper,e.deathMode,e.afterHT,e.base,e.time,e.draws.join(',')].join('|');
}
export function evaluate(e) {
  const events=[];let used=0,spent=0,paralysis=Boolean(e.flags&4),frost=Boolean(e.flags&8);
  const raw=()=>{if(used>=e.draws.length)throw new RangeError('draw-exhausted');events.push(`draw:${used}`);return e.draws[used++];};
  const event=s=>{events.push(s);if(e.flags&2048 && (s.startsWith('log:hit')||s.startsWith('blood:')||s.startsWith('status:')))raw();};
  const random=new JavaRandom({nextDouble:raw});
  const services={
    intTo:max=>random.intTo(max),intRange:(min,max)=>random.intRange(min,max),
    detachFrost(){event('detach:B:Frost');frost=false;},
    isImmune(){event('immune:B');return Boolean(e.flags&1)&&!(e.flags&1024);},
    isResistant(){event('resist:B');return Boolean(e.flags&2)&&!(e.flags&1024);},
    hasParalysis(){event('buff:B:Paralysis');return paralysis;},
    detachParalysis(){event('detach:B:Paralysis');paralysis=false;},
    isVisible:()=>Boolean(e.visible&2),paralysisBroken:()=>event('log:paralysis:B'),
    showDamage:(n,tone)=>event(`status:B:${tone==='warning'?1:2}:${n}`),
    removeActor:()=>event(`remove:B:${health.current}`),freeCell:()=>event('free:2'),showDeath:()=>event('sprite-die:B'),
  };
  class ProbeHealth extends CharacterHealth {
    updateMaximum(value){this.ht=value;}
    die(source){
      event(`die:B:${source.label}`);
      if(e.deathMode===1){this.hp=this.ht;event('revive:B');return;}
      if(e.deathMode===2)return;
      super.die(source);
    }
  }
  const health=new ProbeHealth({HP:e.hp,HT:e.ht},services);
  const sourceFor=a=>({classId:'probe',isCharacter:true,label:a.key});
  const damage=(n,src)=>{event(`damage:B:${n}:${src.label}`);if(e.afterHT!=='n')health.updateMaximum(e.afterHT);health.damage(n,src);};
  const a={key:'A',position:1,maximumHealth:20,
    attackSkill(target){event(`attack-skill:A:${target.key}`);return e.accuracy;},
    isRangedSniper:()=>e.sniper===3,
    damageRoll(){event('roll:A');return e.roll;},
    attackProc(target,n){event(`attack-proc:A:${n}`);return (n+e.attackBonus)|0;},
  };
  const b={key:'B',position:2,get maximumHealth(){return health.maximum;},
    defenseSkill(attacker){event(`defense-skill:B:${attacker.key}`);return e.defense;},
    damageReduction(){event('dr:B');return e.armor;},
    defenseProc(attacker,n){event(`defense-proc:B:${n}`);return (n-e.defenseBonus)|0;},
    damage:(n,source)=>damage(n,sourceFor(source)),
    isAlive(){event('alive:B');return health.isAlive();},
    defenseVerb(){event('defense-verb:B');return 'dodged';},
  };
  const world={hero:e.role===1?a:e.role===2?b:e.role===3?{key:'C'}:null,
    isVisible:pos=>Boolean(e.visible&(pos===1?1:2)),interruptHero:()=>event(`interrupt:${world.hero.key}`),
    heroHasKillerGlyph:()=>Boolean(e.flags&128),
    isBoss(attacker){event(`boss:${attacker.key}`);return Boolean(e.flags&256);},
    fail(reason,attacker){if(reason==='mob')event(`indefinite:${attacker.key}`);event(`fail:${reason}:${reason==='mob'?'a ':''}${attacker.key}:3`);},
    emit(x){
      switch(x.kind){
        case 'hit':event(`log:hit:${x.attacker}:${x.defender}`);break;
        case 'hit-sound':event(`sound:hit:${bits(x.pitch)}`);break;
        case 'shake':event(`shake:${x.intensity}:${bits(x.duration)}`);break;
        case 'blood':event(`center:${x.attacker}`);event(`blood:${x.defender}:${x.attacker}:${x.damage}`);break;
        case 'flash':event(`flash:${x.defender}`);break;
        case 'hero-killed':event(`log:killed:${x.attacker}`);break;
        case 'defeated':event(`log:defeat:${x.attacker}:${x.defender}`);break;
        case 'defense-status':event(`status:${x.defender}:0:${x.verb}`);break;
        case 'miss':event(`log:${x.playerAttack?'you-missed':'other-missed'}:${x.defender}:${x.verb}${x.playerAttack?'':':'+x.attacker}`);break;
        case 'miss-sound':event('sound:miss');break;
        default:throw new Error(`Unhandled effect ${x.kind}`);
      }
    },
  };
  const timing=new CharacterTime({
    hasCripple(){event('buff:B:Cripple');return Boolean(e.flags&16);},
    hasSlow(){event('buff:B:Slow');return Boolean(e.flags&32);},
    hasSpeed(){event('buff:B:Speed');return Boolean(e.flags&64);},
    spend(n){spent=Math.fround(spent+n);event(`spend:${bits(spent)}`);},
  });
  const resolver=new CombatResolver(random);let result='void';
  const source=e.flags&512?sourceFor(a):{classId:'effect',isCharacter:false,label:'effect'};
  try {
    switch(e.mode){
      case 'hit':result=String(resolver.hit(a,b,Boolean(e.flags&4096)));break;
      case 'attack':result=String(resolver.attack(a,b,world));break;
      case 'attack-twice':result=resolver.attack(a,b,world)+','+resolver.attack(a,b,world);break;
      case 'damage':damage(e.roll,source);break;
      case 'damage-sequence':damage(e.roll,source);damage(e.roll,source);damage(e.roll,source);break;
      case 'destroy':health.destroy();break;
      case 'die':health.die(source);break;
      case 'time':result=String(bits(timing.speed(fromBits(e.base))));timing.spend(fromBits(e.time));timing.spend(fromBits(e.time));break;
      default:throw new Error(`Unknown fixture mode: ${e.mode}`);
    }
  }catch(error){
    if(!(error instanceof RangeError))throw error;
    if(error.message==='Java integer division by zero')result='error:divide-zero';
    else if(error.message==='draw-exhausted')result='error:draw-exhausted';
    else throw error;
  }
  return [result,health.current,health.maximum,Number(paralysis),Number(frost),used,bits(spent),events.join(';')].join('|');
}
