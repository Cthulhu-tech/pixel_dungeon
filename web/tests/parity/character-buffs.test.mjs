import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { method } from '../../../tools/port/oracle/character/source-methods.mjs';
import { collectionHost, collectionFixtures } from '../support/character-buffs-host.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const signatures=['public HashSet<Buff> buffs()','public <T extends Buff> HashSet<T> buffs( Class<T> c )',
  'public <T extends Buff> T buff( Class<T> c )','public boolean isCharmedBy( Char ch )',
  'public void add( Buff buff )','public void remove( Buff buff )','public void remove( Class<? extends Buff> buffClass )',
  'protected void onRemove()','public void updateSpriteState()'];
function run(command,args,options={}){
  const result=spawnSync(command,args,{encoding:'utf8',timeout:30000,maxBuffer:32*1024*1024,...options});
  if(result.error)throw result.error;assert.equal(result.status,0,result.stderr);return result.stdout;
}
test('nine original Char collection methods match membership, inheritance, callbacks and presentation phases',(t)=>{
  const bytes=readFileSync(join(root,'src/com/watabou/pixeldungeon/actors/Char.java'));
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),'65bb59224b2574caa7939cc030d65ad68e31a9fd');
  const template=readFileSync(join(root,'tools/port/oracle/character-buffs/CollectionOracle.java.tmpl'),'utf8');
  assert.equal(template.split('// ORIGINAL_CHAR_METHODS').length,2);
  const java=template.replace('// ORIGINAL_CHAR_METHODS',signatures.map(s=>method(bytes.toString('utf8'),s)).join('\n'));
  mkdirSync(join(root,'tmp'),{recursive:true});const out=mkdtempSync(join(root,'tmp/collection-oracle-'));
  t.after(()=>rmSync(out,{recursive:true,force:true}));writeFileSync(join(out,'CollectionOracle.java'),java);
  run('javac',['-proc:none','-encoding','UTF-8','-d',out,join(out,'CollectionOracle.java')]);
  const fixtures=collectionFixtures();
  const input=fixtures.map(e=>[e.kinds.join(','),e.ops.join(';'),Number(e.sprite),e.invisible,e.hooks,e.failAt].join('|')).join('\n')+'\n';
  const expected=run('java',['-cp',out,'port.oracle.CollectionOracle'],{input}).trimEnd().split('\n');
  assert.equal(expected.length,fixtures.length);let checkpoints=0;
  fixtures.forEach((e,i)=>{const host=collectionHost(e),rows=expected[i].split('\t');assert.equal(rows.length,e.ops.length);
    e.ops.forEach((op,j)=>{assert.equal(host.checkpoint(op),rows[j],`scenario ${i}, operation ${j} ${op}, ${e.kinds}`);checkpoints++;});});
  t.diagnostic(`${fixtures.length} scenarios / ${checkpoints} original-Java checkpoints, nine unchanged extracted methods; collection order is a controlled input`);
});

test('find uses original member order but a filtered HashSet can have a different order',()=>{
  const h=collectionHost({kinds:['Shadows','Invisibility','Shadows'],sprite:true,invisible:2,hooks:0,failAt:0});
  h.execute('add,2');h.execute('add,0');h.execute('add,1');
  assert.equal(h.collection.find('Invisibility'),h.objects[2]);
  assert.deepEqual(h.collection.matching('Invisibility'),[h.objects[0],h.objects[1],h.objects[2]]);
  const snapshot=h.collection.all();snapshot.length=0;assert.equal(h.collection.all().length,3);
});

test('duplicate add repeats status, and removing a non-member still invokes original Actor.remove',()=>{
  const h=collectionHost({kinds:['Poison'],sprite:true,invisible:0,hooks:0,failAt:0});
  h.execute('add,0');h.trace.length=0;h.execute('add,0');
  assert.deepEqual(h.trace,['actor+:0:0','center:33','burst:5','status:negative:poisoned']);
  h.execute('remove,0');h.trace.length=0;h.execute('remove,0');assert.deepEqual(h.trace,['actor-:0:']);
});

test('Shadows inherits invisibility but suppresses its label; Light only enters via sprite restoration',()=>{
  const h=collectionHost({kinds:['Shadows','Light'],sprite:true,invisible:0,hooks:0,failAt:0});
  h.execute('add,0');assert.ok(!h.trace.some(s=>s.startsWith('status:')));
  h.trace.length=0;h.execute('add,1');assert.deepEqual(h.trace,['actor+:1:0,1']);
  h.trace.length=0;h.execute('update');assert.deepEqual(h.trace,['state+:invisible','state+:illuminated']);
});

test('onRemove iterates its original snapshot even when an earlier detach removes a later member',()=>{
  const h=collectionHost({kinds:['Poison','Burning'],sprite:true,invisible:0,hooks:4,failAt:0});
  h.execute('add,0');h.execute('add,1');h.trace.length=0;h.execute('detachAll');
  assert.deepEqual(h.trace.filter(s=>s.startsWith('detach:')),['detach:0','detach:1']);
  assert.equal(h.trace.filter(s=>s.startsWith('actor-:1:')).length,2);
});
