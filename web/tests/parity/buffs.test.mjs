import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync,mkdirSync,mkdtempSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buffHost,buffCases } from '../support/buff-host.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
function run(command,args,options={}){const r=spawnSync(command,args,{encoding:'utf8',timeout:30000,maxBuffer:32*1024*1024,...options});if(r.error)throw r.error;assert.equal(r.status,0,r.stderr);return r.stdout;}
test('original full Buff/FlavourBuff classes match attachment, helpers, errors and expiry at every checkpoint',t=>{
  const paths=['Buff.java','FlavourBuff.java'].map(name=>join(root,'src/com/watabou/pixeldungeon/actors/buffs',name));
  for(const [path,sha] of paths.map((p,i)=>[p,['3d481d04c2ae5e5ddd45c920c56ba1afefffaef4','d653eb17a57b9aa6ad8ab844097e0db9e4770140'][i]])){
    const bytes=readFileSync(path);assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),sha);
  }
  const tmp=join(root,'tmp');mkdirSync(tmp,{recursive:true});const out=mkdtempSync(join(tmp,'buff-oracle-'));t.after(()=>rmSync(out,{recursive:true,force:true}));
  const oracle=join(root,'tools/port/oracle/buffs');
  run('javac',['-proc:none','-encoding','UTF-8','-d',out,...paths,...['Actor','Char','BuffIndicator'].map(n=>join(oracle,'stubs',n+'.java')),join(oracle,'BuffOracle.java')]);
  const cases=buffCases(),input=cases.map(e=>[e.flags,e.now,e.actions.join(';')].join('|')).join('\n')+'\n';
  const expected=run('java',['-cp',out,'port.oracle.BuffOracle'],{input}).trimEnd().split('\n');let index=0;
  for(const e of cases){const host=buffHost(e.flags,e.now);for(const action of e.actions){assert.equal(host.step(action),expected[index],`checkpoint ${index}; flags=${e.flags}; now=${e.now}; ${action}`);index++;}}
  assert.equal(index,expected.length);t.diagnostic(`${cases.length} sequences / ${index} original-Java checkpoints; target/clock are explicit test ports, UI icon excluded`);
});
test('immunity rejects attach, but original append still returns the detached instance and duration spends on it',()=>{
  const h=buffHost(1);h.execute('appendFor:0:3');assert.equal(h.all[0].target,null);assert.equal(h.times.get(h.all[0]),3);assert.equal(h.targets[0].members.length,0);
});
test('affect reuses an existing object, append creates another, detachMatching removes only the first match',()=>{
  const h=buffHost();assert.equal(h.execute('append:0'),'0');assert.equal(h.execute('affect:0'),'0');assert.equal(h.execute('append:0'),'1');
  h.execute('detachMatching:0');assert.deepEqual(h.targets[0].members,[h.all[1]]);assert.equal(h.all[0].target,h.targets[0]);
});
test('spend is additive but prolong uses max(current, now + duration)',()=>{
  const h=buffHost(0,10);h.execute('appendFor:0:5');h.execute('affectFor:0:2');assert.equal(h.times.get(h.all[0]),17);
  h.execute('prolong:0:3');assert.equal(h.times.get(h.all[0]),17);h.execute('prolong:0:9');assert.equal(h.times.get(h.all[0]),19);
});
test('caught Java exceptions are reported and return null; fatal errors are rethrown; partial attach is not rolled back',()=>{
  const h=buffHost(4);assert.equal(h.execute('append:0'),'null');assert.equal(h.caught.length,1);assert.equal(h.targets[0].members[0],h.all[0]);
  const fatal=buffHost(8);assert.throws(()=>fatal.execute('append:0'),/fatal/);assert.equal(fatal.caught.length,0);
});
test('unattached detach fails and repeated attached detach calls the same target again',()=>{
  const h=buffHost();h.execute('base:0');assert.throws(()=>h.execute('detach:0'),TypeError);h.execute('attach:0:0');h.events.length=0;
  h.execute('detach:0');h.execute('detach:0');assert.deepEqual(h.events,['remove:0:0','remove:0:0']);
});
