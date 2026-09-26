import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resourceHost } from '../support/resource-effects-host.mjs';
import { resourceFixtures } from '../support/resource-effects-fixtures.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const sources={
  "src/com/watabou/pixeldungeon/actors/buffs/Amok.java": "fa965e068570e919554af307257448d84327eb93",
  "src/com/watabou/pixeldungeon/actors/buffs/Awareness.java": "f8a13dd7c89cf33ce2027ac872a64327e95bb238",
  "src/com/watabou/pixeldungeon/actors/buffs/Barkskin.java": "af757297f5666a6dfe86cd9aff1d17ed24984649",
  "src/com/watabou/pixeldungeon/actors/buffs/Bleeding.java": "480cbb042a201a3b36af47ce2303f21d0ba3fbe7",
  "src/com/watabou/pixeldungeon/actors/buffs/Blindness.java": "242119366aa3e8c4354847ecf4e629d5db01bc31",
  "src/com/watabou/pixeldungeon/actors/buffs/Buff.java": "3d481d04c2ae5e5ddd45c920c56ba1afefffaef4",
  "src/com/watabou/pixeldungeon/actors/buffs/Burning.java": "e166a2bdbceff33dd8612d191ab601b511d79562",
  "src/com/watabou/pixeldungeon/actors/buffs/Charm.java": "42a19bde4c025f6d1eb9382aba58e96f6fc9ed40",
  "src/com/watabou/pixeldungeon/actors/buffs/Combo.java": "696acbd3a66c0560c106542d47e7d41604678d81",
  "src/com/watabou/pixeldungeon/actors/buffs/Cripple.java": "f5267e2baafba884904db11deb855770a7b2e562",
  "src/com/watabou/pixeldungeon/actors/buffs/FlavourBuff.java": "d653eb17a57b9aa6ad8ab844097e0db9e4770140",
  "src/com/watabou/pixeldungeon/actors/buffs/Frost.java": "61e2c7e69de5599b6c1ae759fad4a2fbad80142c",
  "src/com/watabou/pixeldungeon/actors/buffs/Fury.java": "8325afcdcf364277052dd751cdfeb52077e893c7",
  "src/com/watabou/pixeldungeon/actors/buffs/GasesImmunity.java": "f5fadacc2a1864d5dc451b0bd85e7f2a00f9a402",
  "src/com/watabou/pixeldungeon/actors/buffs/Hunger.java": "8c662e778cc3b59776218b0d537f7aa028dd1494",
  "src/com/watabou/pixeldungeon/actors/buffs/Invisibility.java": "635d1c39006b81645348adc3dd524ffeb6b356f5",
  "src/com/watabou/pixeldungeon/actors/buffs/Levitation.java": "4c0fd568855486327b3d287e97f7d0274f6d6776",
  "src/com/watabou/pixeldungeon/actors/buffs/Light.java": "3b0cf4b34bd4acd2bc6dd451a5a9498d3c181dbd",
  "src/com/watabou/pixeldungeon/actors/buffs/MindVision.java": "1c7e2857f076dbb38ae63e6e3bf50ad2c7ddaf1b",
  "src/com/watabou/pixeldungeon/actors/buffs/Ooze.java": "61fecc1eea6f26e56e9a640f1ab0a8c11532ec7d",
  "src/com/watabou/pixeldungeon/actors/buffs/Paralysis.java": "2d9da3efbae3eec8ade614691255eb5086e7a7cc",
  "src/com/watabou/pixeldungeon/actors/buffs/Poison.java": "d3e0d71cfdec60aed9ffd305fe79135b0a891139",
  "src/com/watabou/pixeldungeon/actors/buffs/Rage.java": "8617045be8100b5d5615e9dcc40e5c3434987021",
  "src/com/watabou/pixeldungeon/actors/buffs/Regeneration.java": "27949cd5ae62c6cdd66663269cc451291063749b",
  "src/com/watabou/pixeldungeon/actors/buffs/Roots.java": "19aff10f257ab1e1af5c3cc3df584668d96ef58e",
  "src/com/watabou/pixeldungeon/actors/buffs/Shadows.java": "be4abf66a9e08428a2d6ac30fe30e35ee677a271",
  "src/com/watabou/pixeldungeon/actors/buffs/Sleep.java": "e3d47074f472c68f846671d3fd75e6e32730e6f9",
  "src/com/watabou/pixeldungeon/actors/buffs/Slow.java": "5f3f1e9a38d68ef2f3eefee984b7121a46a7e6a4",
  "src/com/watabou/pixeldungeon/actors/buffs/SnipersMark.java": "5460eff61c0538b128419a0e8c623a49e26ab344",
  "src/com/watabou/pixeldungeon/actors/buffs/Speed.java": "d6a7e18bcb9c7e4192411b5c3b8a3f74d062d991",
  "src/com/watabou/pixeldungeon/actors/buffs/Terror.java": "8e762b66ef4c6c3f1ce156bd62a7a202f9008d93",
  "src/com/watabou/pixeldungeon/actors/buffs/Vertigo.java": "3775970e699847b9ca0f0c49a1afc65c8985366e",
  "src/com/watabou/pixeldungeon/actors/buffs/Weakness.java": "cda851f128f1a4da83ce73eb67cd6ec88155779a",
  "src/com/watabou/pixeldungeon/Assets.java": "c9c08cbc0c7ab2cd6f9ff50db58d92ac39bc8820",
  "src/com/watabou/pixeldungeon/ResultDescriptions.java": "7e70bb2a1fa993d1b373a81648c9b97f71b955bf",
  "tests/reference/random/Random.java": "cc6ce01ae51678da114ee1e0d26485717107704c"
};
function run(command,args,options={}){
 const r=spawnSync(command,args,{encoding:'utf8',timeout:30000,maxBuffer:64*1024*1024,...options});
 if(r.error)throw r.error;assert.equal(r.status,0,r.stderr);return r.stdout;
}
test('original resource, damage and thermal effects preserve ordered mutations, draws and Bundle fields',t=>{
 const files=[];let random;
 for(const [path,sha] of Object.entries(sources)){
  const full=join(root,path),bytes=readFileSync(full);assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),sha,path);
  if(path.endsWith('/Random.java'))random=bytes.toString('utf8');else files.push(full);
 }
 const oracle=join(root,'tools/port/oracle/resource-effects');mkdirSync(join(root,'tmp'),{recursive:true});
 const out=mkdtempSync(join(root,'tmp/resource-effects-oracle-'));t.after(()=>rmSync(out,{recursive:true,force:true}));
 const randomFile=join(out,'Random.java');writeFileSync(randomFile,random.replaceAll('Math.random()','port.oracle.ResourceOracle.random()'));
 run('javac',['-proc:none','-encoding','UTF-8','-d',out,...files,...readdirSync(join(oracle,'stubs')).filter(n=>n.endsWith('.java')).map(n=>join(oracle,'stubs',n)),randomFile,join(oracle,'ResourceOracle.java')]);
 const fixtures=resourceFixtures();const expected=run('java',['-cp',out,'port.oracle.ResourceOracle'],{input:fixtures.map(e=>e.tape.join(',')+'|'+e.commands.join(';')).join('\n')+'\n'}).trimEnd().split('\n');
 assert.equal(expected.length,fixtures.length);let checkpoints=0;
 fixtures.forEach((e,i)=>{const h=resourceHost(e.tape),rows=expected[i].split('\t');assert.equal(rows.length,e.commands.length);
  e.commands.forEach((command,j)=>{assert.equal(h.step(command),rows[j],`scenario ${i}, step ${j} ${command}: ${e.commands.join(';')}`);checkpoints++;});});
 t.diagnostic(`${fixtures.length} sequences / ${checkpoints} original-Java checkpoints; full pinned Buff classes with test-only actor/item/world ports`);
});
