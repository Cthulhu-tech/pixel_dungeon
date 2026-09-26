import { CharacterBuffs, CharacterStatus, CharacterHealth } from '../../src/modules/actors/index.ts';
import * as E from '../../src/modules/effects/index.ts';
import { TurnScheduler } from '../../src/modules/turns/index.ts';

/** Real domain owners. Presentation/level are observable test ports, never production replacements. */
export function integratedStatuses(){
  const events=[],status=new CharacterStatus();let collection,health,level=8,enemies=0;
  const target={isImmuneTo:()=>false,addBuff:b=>collection.add(b),removeBuff:b=>collection.remove(b),findBuff:c=>collection.find(c)};
  const actor={character:{position:33,isMoving:false,buffs:()=>collection.all()},act:()=>false,onAdd(){},onRemove(){collection.detachAll();}};
  const scheduler=new TurnScheduler(1024,new Set(),{hero:()=>actor,heroIsAlive:()=>health.isAlive(),addDuration(){}});
  const snapshot=()=>({flags:status.snapshot(),effects:collection.all().map(b=>b.classId),HP:health.current});
  const record=(type,...details)=>events.push({type,details,...snapshot()});
  collection=new CharacterBuffs(new Set(),()=>new Set(),{
    isInstance:(b,c)=>b.classId===c||c==='Buff'||c==='FlavourBuff'&&b instanceof E.FlavourBuff||c==='Invisibility'&&b instanceof E.Invisibility,
    charmObject:()=>{throw new Error('Charm not involved in this integration');},
  },{add:b=>scheduler.add(b),remove:b=>scheduler.remove(b)},
  {position:()=>33,invisibleCount:()=>status.invisible},{available:()=>true,
    status:(tone,label)=>record('status',tone,label),poisonSplash:(cell,n)=>record('splash',cell,n),
    addState:state=>record('state+',state),removeState:state=>record('state-',state),idle:()=>record('idle')});
  const clock={spend:(b,t)=>scheduler.spend(b,t),postpone:(b,t)=>scheduler.postpone(b,t),deactivate:b=>scheduler.deactivate(b)};
  const paralysis={setParalysed:(_t,v)=>status.setParalysed(v)};
  const roots={isFlying:()=>status.flying,setRooted:(_t,v)=>status.setRooted(v)};
  const levitation={setFlying:(_t,v)=>status.setFlying(v),press:()=>record('press')};
  const counter={invisible:()=>status.invisible,setInvisible:(_t,v)=>status.setInvisible(v)};
  const observe={observe:()=>record('observe')};
  const light={...observe,levelViewDistance:()=>level,setViewDistance:(_t,v)=>status.setViewDistance(v)};
  const shadows={...counter,...observe,meldSound:()=>record('meld'),isAlive:()=>health.isAlive(),visibleEnemies:()=>enemies};
  health=new CharacterHealth({HP:10,HT:10},{intTo:()=>0,intRange:()=>0,
    detachFrost(){collection.find('Frost')?.detach();},isImmune:()=>false,isResistant:()=>false,
    hasParalysis:()=>collection.find('Paralysis')!==null,detachParalysis:()=>collection.find('Paralysis')?.detach(),
    isVisible:()=>true,paralysisBroken:()=>record('paralysis-broken'),showDamage:()=>record('damage'),
    removeActor:()=>scheduler.remove(actor),freeCell:()=>scheduler.freeCell(33),showDeath:()=>record('death')});
  scheduler.add(actor);
  return {actor,target,status,collection,scheduler,clock,health,events,snapshot,
    ports:{paralysis,roots,levitation,counter,observe,light,shadows},
    setLevel:v=>{level=v;},setEnemies:v=>{enemies=v;}};
}
