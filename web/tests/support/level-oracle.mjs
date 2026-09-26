import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { method } from '../../../tools/port/oracle/character/source-methods.mjs';
export const root = fileURLToPath(new URL('../../../', import.meta.url));
const original = 'src/com/watabou/pixeldungeon/';
export const flagNames = ['passable','losBlocking','flamable','secret','solid','avoid','water','pit','discoverable'];
export const bits = values => Array.from(values, Number).join('');
export function run(command, args, options = {}) {
  const result = spawnSync(command,args,{encoding:'utf8',timeout:30000,maxBuffer:64*1024*1024,...options});
  if(result.error)throw result.error;assert.equal(result.status,0,result.stdout+result.stderr);return result.stdout;
}
function readPinned(path,hash){
  const bytes=readFileSync(join(root,original,path));
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),hash,path);
  return bytes.toString('utf8');
}
export function compileLevelOracle(t) {
  const level=readPinned('levels/Level.java','c92488406814f6fb270c77799213200b8a72decb');
  readPinned('levels/Terrain.java','24e0f646968cca87bf9e41e2efb83adf08304f35');
  readPinned('mechanics/ShadowCaster.java','566fc3b7725ec80d773b2571df4b7491e16b1ba0');
  const painter=readPinned('levels/painters/Painter.java','fd0d43b1658b6e994e9ae8f0de17a78ee713e023');
  const signatures=['private void buildFlagMaps()','private int getWaterTile( int pos )',
    'public void destroy( int pos )','private void cleanWalls()',
    'public static void set( int cell, int terrain )',
    'public boolean[] updateFieldOfView( Char c )','public static int distance( int a, int b )'];
  const constants=['WIDTH','HEIGHT','LENGTH','NEIGHBOURS4','NEIGHBOURS8','NEIGHBOURS9'].map(name=>{
    const found=level.match(new RegExp(`public static final int(?:\\[\\])?\\s+${name}\\s*=[^;]+;`));
    assert.ok(found,name);return found[0];
  }).join('\n');
  let template=readFileSync(join(root,'tools/port/oracle/level/Level.java.tmpl'),'utf8');
  for(const [marker,contents]of[
    ['// ORIGINAL_LEVEL_CONSTANTS',constants],
    ['// ORIGINAL_LEVEL_METHODS',signatures.map(s=>method(level,s)).join('\n')],
    ['// ORIGINAL_PAINTER_METHOD',method(painter,'public static void set( Level level, int cell, int value )')],
  ]){assert.equal(template.split(marker).length,2);template=template.replace(marker,contents);}
  mkdirSync(join(root,'tmp'),{recursive:true});const out=mkdtempSync(join(root,'tmp/level-oracle-'));
  t.after(()=>rmSync(out,{recursive:true,force:true}));writeFileSync(join(out,'Level.java'),template);
  run('javac',['-proc:none','-encoding','UTF-8','-d',out,join(out,'Level.java'),
    join(root,original,'levels/Terrain.java'),join(root,original,'mechanics/ShadowCaster.java'),
    join(root,'tools/port/oracle/terrain/TerrainData.java')]);
  return {evaluate(mode,input){return run('java',['-cp',out,'com.watabou.pixeldungeon.levels.Level',mode],{input}).trimEnd().split('\n');},
    data(){return JSON.parse(run('java',['-cp',out,'port.oracle.TerrainData']));}};
}
export function terrainDigest(grid){const s=grid.snapshot();return createHash('sha256').update([Array.from(s.map).join(','),...flagNames.map(k=>bits(s.flags[k]))].join('|')).digest('hex');}
