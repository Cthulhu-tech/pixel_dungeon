import { resourceNames } from './resource-effects-host.mjs';
import { floatBits } from './status-effects-host.mjs';
export function resourceFixtures(){
  const scenarios=[];
  const add=(commands,draw=.25)=>scenarios.push({commands,tape:Array(128).fill(draw)});
  for(const name of resourceNames)for(const target of [0,1,2,3])for(const health of [0,1,10]){
    const commands=[`new:${name}`,'info:0',`flag:${target}:HP:${health}`,`attach:0:${target}`];
    if(name==='Poison')commands.push('set:0:'+floatBits(5));
    if(name==='Bleeding')commands.push('set:0:5');
    if(name==='Barkskin')commands.push('raise:0:5','bark:0');
    if(name==='Burning')commands.push(`reignite:0:${target}`);
    if(name==='Hunger')commands.push('restore:0:level:f:'+floatBits(355));
    if(['Charm','SnipersMark','Terror'].includes(name))commands.push('field:0:object:123');
    if(name==='Combo')commands.push('combo:0:10','combo:0:10','combo:0:10');
    commands.push('own:0','act:0','act:0','info:0','detach:0','own:0');add(commands);
  }
  for(const name of ['Poison','Burning','Hunger'])for(const left of [-Infinity,-1,-0,0,1e-45,.99999994,1,2,5,10,259,260,350,355,359,360,361,16777216,Infinity,NaN]){
    const field=name==='Hunger'?'level':'left';
    for(const draw of [0,.29999999,.3,.5,1-2**-53])add([`new:${name}`,'attach:0:0',`restore:0:${field}:f:${floatBits(left)}`,'own:0','act:0','own:0','act:0','info:0','death:0'],draw);
  }
  for(const level of [-2147483648,-10,-1,0,1,2,3,10,2147483647])for(const ht of [0,1,4,100,-1])for(const draw of [0,.5,1-2**-53]){
    add(['new:Bleeding','attach:0:0',`flag:0:HT:${ht}`,`set:0:${level}`,'act:0','own:0'],draw);
  }
  for(const hp of [-1,0,1,3,4,5,16777217,2147483647])for(const ht of [-1,0,1,10,16777216,2147483647]){
    add(['new:Fury','attach:0:0',`flag:0:HP:${hp}`,`flag:0:HT:${ht}`,'act:0']);
  }
  for(const value of [-2147483648,-1,0,1,3,2147483647]){
    add(['new:Barkskin','attach:0:0',`raise:0:${value}`,'bark:0','raise:0:2','bark:0','act:0','act:0','bark:0','own:0']);
    for(const damage of [-2147483648,-1,0,10,100,2147483647])add(['new:Combo','attach:0:0',`field:0:count:${value}`,`combo:0:${damage}`,'own:0','act:0']);
  }
  for(const name of ['SnipersMark','Charm','Terror'])for(const object of [-2147483648,-1,0,99,2147483647]){
    add([`new:${name}`,`field:0:object:${object}`,'own:0','field:0:object:0',`restore:0:object:i:${object}`,'own:0','attach:0:0','detach:0']);
  }
  for(const t of [-Infinity,-1,0,9.999999,10,11,Infinity,NaN])add(['new:Terror','attach:0:0',`time:0:${floatBits(t)}`,'recover:0','own:0']);
  for(const effect of ['Poison','Charm','Frost','Weakness','Burning'])for(const factor of [-Infinity,-1,0,1e-45,.1,.33333334,1,1e20,Infinity,NaN]){
    add(['new:Resistance',`field:0:factor:${floatBits(factor)}`,'attach:0:0',`duration:${effect}:${['Poison','Charm'].includes(effect)?'durationFactor':'duration'}:0`]);
  }
  for(const bonus of [-2147483648,-1000,-100,-10,-1,0,1,5,10,100,1000,2147483647]){
    add(['new:Regeneration','new:Rejuvenation',`field:1:level:${bonus}`,'attach:0:0','attach:1:0','flag:0:HP:5','act:0','own:0','act:0']);
    add(['new:Hunger','new:Satiety',`field:1:level:${bonus}`,'attach:0:0','attach:1:0','restore:0:level:f:'+floatBits(250),'act:0','own:0']);
  }
  for(const energy of [-Infinity,-1,0,1,259,360,1000,Infinity,NaN])for(const level of [0,259,360,400,NaN]){
    add(['new:Hunger',`restore:0:level:f:${floatBits(level)}`,`satisfy:0:${floatBits(energy)}`,'own:0','starving:0','info:0']);
  }
  for(const hp of [1,2])for(const paralysis of [0,1])for(const rogue of [0,1])for(const shadows of [false,true]){
    const commands=['new:Hunger','attach:0:0',`flag:0:HP:${hp}`,`flag:0:paralysed:${paralysis}`,`flag:0:rogue:${rogue}`,'restore:0:level:f:'+floatBits(360)];
    if(shadows)commands.push('new:Shadows','attach:1:0');commands.push('act:0','own:0');add(commands,.1);
  }
  for(const target of [0,2,3])for(const item of ['null','Item','Scroll','MysteryMeat'])for(const collect of [0,1])for(const wet of [0,1])for(const fire of [0,1]){
    const commands=['new:Burning',`attach:0:${target}`,`reignite:0:${target}`,`item:${target}:${item}`,`terrain:${target}:${wet}:${fire}`];
    if(target!==2)commands.push(`collect:${target}:${collect}`);commands.push('act:0','own:0','act:0');add(commands,.1);
  }
  for(const target of [0,1,3])for(const item of ['null','Item','Scroll','MysteryMeat'])for(const collect of [0,1]){
    const commands=['new:Frost','new:Burning',`attach:1:${target}`,`flag:${target}:paralysed:0`];
    if(target!==1)commands.push(`item:${target}:${item}`,`collect:${target}:${collect}`);
    commands.push(`attach:0:${target}`,'own:0','detach:0');add(commands);
  }
  add(['new:Paralysis','new:Frost','attach:0:0','attach:1:0','detach:1','detach:0']);
  for(const name of ['Hunger','Poison','Burning','Ooze','Bleeding'])for(const target of [0,1,2,3]){
    const cmds=[`new:${name}`,`attach:0:${target}`,`flag:${target}:HP:1`,'doom:1'];
    if(name==='Bleeding')cmds.push('set:0:3');if(name==='Poison')cmds.push('set:0:'+floatBits(5));
    if(name==='Burning')cmds.push(`reignite:0:${target}`);if(name==='Hunger')cmds.push('restore:0:level:f:'+floatBits(360));
    cmds.push('act:0','act:0');add(cmds,.1);
  }
  for(const name of resourceNames)for(let fail=1;fail<=9;fail++){
    const cmds=[`new:${name}`,'attach:0:0'];
    if(name==='Burning')cmds.push('reignite:0:0','item:0:MysteryMeat','terrain:0:0:1','collect:0:0');
    if(name==='Poison')cmds.push('set:0:'+floatBits(5));if(name==='Bleeding')cmds.push('set:0:5');
    if(name==='Hunger')cmds.push('restore:0:level:f:'+floatBits(355));
    cmds.push(`fail:${fail}`,'act:0','detach:0','fail:0','own:0');add(cmds,.1);
  }
  for(const target of [0,1])for(const name of ['Frost','Weakness','Poison','Burning'])add([`new:${name}`,`immune:${target}:${name}:1`,`attach:0:${target}`,'act:0','detach:0']);
  for(const wet of [0,1])add(['new:Ooze','attach:0:0','flag:0:HP:0',`terrain:0:${wet}:0`,'act:0','act:0']);
  add(['new:Hunger','new:Regeneration','attach:0:0','attach:1:0','flag:0:HP:5','restore:0:level:f:'+floatBits(360),'act:1','satisfy:0:'+floatBits(100),'act:1']);
  return scenarios;
}
