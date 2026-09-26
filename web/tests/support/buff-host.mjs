import { Buff,FlavourBuff,BuffOperations } from '../../src/modules/effects/index.ts';
const bits=value=>{if(Number.isNaN(value))return 2143289344;const b=new DataView(new ArrayBuffer(4));b.setFloat32(0,value);return b.getInt32(0);};
class JavaException extends Error {}
class JavaFatal extends Error {}
export function buffHost(flags=0,initialNow=0) {
  let now=Math.fround(initialNow);const all=[],ids=new Map(),times=new Map(),events=[],caught=[];
  const event=value=>events.push(value),id=buff=>ids.get(buff);
  const clock={
    spend(buff,duration){const d=Math.fround(duration);event(`spend:${id(buff)}:${bits(d)}`);times.set(buff,Math.fround(times.get(buff)+d));},
    postpone(buff,duration){const d=Math.fround(duration);event(`postpone:${id(buff)}:${bits(d)}`);const target=Math.fround(now+d);if(times.get(buff)<target)times.set(buff,target);},
    deactivate(buff){event(`deactivate:${id(buff)}`);times.set(buff,Math.fround(3.4028234663852886e38));},
  };
  const register=buff=>{ids.set(buff,all.length);all.push(buff);times.set(buff,0);event(`create:${id(buff)}`);return buff;};
  const targets=[0,1].map(targetId=>({
    id:targetId,members:[],
    isImmuneTo(classId){event(`immune:${targetId}`);return Boolean(flags&(1<<targetId))&&classId==='probe';},
    addBuff(buff){
      event(`add:${targetId}:${id(buff)}:${buff.target.id}`);
      if(!this.members.includes(buff)){this.members.push(buff);times.set(buff,Math.fround(times.get(buff)+now));}
      if(flags&4)throw new JavaException('append');if(flags&8)throw new JavaFatal('fatal');
    },
    removeBuff(buff){event(`remove:${targetId}:${id(buff)}`);const i=this.members.indexOf(buff);if(i>=0)this.members.splice(i,1);},
    findBuff(classId){event(`find:${targetId}`);return this.members.find(b=>b.classId===classId)??null;},
  }));
  const factory={classId:'probe',create(){const b=register(new FlavourBuff('probe',clock));if(flags&16)throw new JavaException('constructor');if(flags&32)throw new JavaFatal('fatal');return b;}};
  const operations=new BuffOperations({catchesAsJavaException:e=>e instanceof JavaException,reportCaught:e=>caught.push(e)});
  const get=index=>{const b=all[index];if(b===undefined)throw new RangeError('bounds');return b;};
  function execute(action) {
    const [method,nText,dText]=action.split(':'),n=Number(nText),duration=Math.fround(Number(dText));let result;
    switch(method){
      case 'append':result=operations.append(targets[n],factory);break;
      case 'appendFor':result=operations.appendFor(targets[n],factory,duration);break;
      case 'affect':result=operations.affect(targets[n],factory);break;
      case 'affectFor':result=operations.affectFor(targets[n],factory,duration);break;
      case 'prolong':result=operations.prolong(targets[n],factory,duration);break;
      case 'detach':operations.detach(n<0?null:get(n));return 'void';
      case 'detachMatching':operations.detachMatching(targets[n],factory.classId);return 'void';
      case 'attach':return String(get(n).attachTo(targets[Number(dText)]));
      case 'act':return String(get(n).act());
      case 'base':result=register(new Buff('base',clock));break;
      case 'now':now=duration;return 'void';
      default:throw new Error('Unknown action');
    }
    return result===null?'null':String(id(result));
  }
  function checkpoint(){
    const state=all.map(b=>`${id(b)}:${b.target===null?-1:b.target.id}:${bits(times.get(b))}`).join(',');
    const members=targets.map(t=>t.members.map(id).join(',')).join('/');
    return [state,members,events.join(',')].join('|');
  }
  function step(action){
    events.length=0;let result;
    try{result=execute(action);}
    catch(e){if(e instanceof JavaFatal)result='error:fatal';else if(e instanceof JavaException)result='error:exception';else if(e instanceof RangeError)result='error:bounds';else if(e instanceof TypeError)result='error:null';else throw e;}
    return result+'|'+checkpoint();
  }
  return {step,execute,all,targets,times,caught,events,factory,operations};
}
export function buffCases(){
  const result=[];
  for(const flags of [0,1,2,3,4,8,16,32])for(const now of [0,0.1,16777216])
    for(const duration of ['0','1','-1','0.1','1.401298464324817e-45','Infinity','NaN']) {
      result.push({flags,now,actions:[`appendFor:0:${duration}`,'affectFor:0:2','prolong:0:9','append:0','detachMatching:0','detachMatching:0','detachMatching:0','detach:-1']});
      result.push({flags,now,actions:['base:0','act:0','attach:0:0','act:0','detach:0','detach:0','attach:0:1','act:0']});
      result.push({flags,now,actions:[`prolong:0:${duration}`,'now:0:50',`prolong:0:${duration}`,`affectFor:0:${duration}`,'act:0','appendFor:1:0','attach:0:1','detach:0']});
    }
  return result;
}
