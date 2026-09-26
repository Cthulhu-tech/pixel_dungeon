import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { statusHost, statusFixtures } from '../support/status-effects-host.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const sources={
  "Buff": "3d481d04c2ae5e5ddd45c920c56ba1afefffaef4",
  "FlavourBuff": "d653eb17a57b9aa6ad8ab844097e0db9e4770140",
  "Cripple": "f5267e2baafba884904db11deb855770a7b2e562",
  "Slow": "5f3f1e9a38d68ef2f3eefee984b7121a46a7e6a4",
  "Speed": "d6a7e18bcb9c7e4192411b5c3b8a3f74d062d991",
  "Vertigo": "3775970e699847b9ca0f0c49a1afc65c8985366e",
  "Amok": "fa965e068570e919554af307257448d84327eb93",
  "Rage": "8617045be8100b5d5615e9dcc40e5c3434987021",
  "Sleep": "e3d47074f472c68f846671d3fd75e6e32730e6f9",
  "MindVision": "1c7e2857f076dbb38ae63e6e3bf50ad2c7ddaf1b",
  "Awareness": "f8a13dd7c89cf33ce2027ac872a64327e95bb238",
  "Blindness": "242119366aa3e8c4354847ecf4e629d5db01bc31",
  "Light": "3b0cf4b34bd4acd2bc6dd451a5a9498d3c181dbd",
  "Paralysis": "2d9da3efbae3eec8ade614691255eb5086e7a7cc",
  "Roots": "19aff10f257ab1e1af5c3cc3df584668d96ef58e",
  "Levitation": "4c0fd568855486327b3d287e97f7d0274f6d6776",
  "Invisibility": "635d1c39006b81645348adc3dd524ffeb6b356f5",
  "Shadows": "be4abf66a9e08428a2d6ac30fe30e35ee677a271"
};
function run(command,args,options={}){
  const r=spawnSync(command,args,{encoding:'utf8',timeout:30000,maxBuffer:64*1024*1024,...options});
  if(r.error)throw r.error;assert.equal(r.status,0,r.stderr);return r.stdout;
}
test('sixteen original status classes preserve flag, target, clock, observation and own-state phases',t=>{
  const files=Object.entries(sources).map(([name,sha])=>{
    const p=join(root,'src/com/watabou/pixeldungeon/actors/buffs',name+'.java'),bytes=readFileSync(p);
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),sha);return p;
  });
  const oracle=join(root,'tools/port/oracle/status-effects');
  mkdirSync(join(root,'tmp'),{recursive:true});const out=mkdtempSync(join(root,'tmp/status-oracle-'));
  t.after(()=>rmSync(out,{recursive:true,force:true}));
  run('javac',['-proc:none','-encoding','UTF-8','-d',out,...files,...readdirSync(join(oracle,'stubs')).filter(n=>n.endsWith('.java')).map(n=>join(oracle,'stubs',n)),join(oracle,'StatusOracle.java')]);
  const fixtures=statusFixtures();
  const expected=run('java',['-cp',out,'port.oracle.StatusOracle'],{input:fixtures.map(s=>s.join(';')).join('\n')+'\n'}).trimEnd().split('\n');
  assert.equal(expected.length,fixtures.length);let checkpoints=0;
  fixtures.forEach((commands,i)=>{const h=statusHost(),rows=expected[i].split('\t');assert.equal(rows.length,commands.length);
    commands.forEach((cmd,j)=>{assert.equal(h.step(cmd),rows[j],`scenario ${i}, ${commands.join(';')}, step ${j} ${cmd}`);checkpoints++;});});
  t.diagnostic(`${fixtures.length} sequences / ${checkpoints} original-Java checkpoints; original full effect classes, explicit Char/Level/clock neighbors`);
});
