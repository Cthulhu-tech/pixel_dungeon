import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const source='src/com/watabou/pixeldungeon/';
function run(command,args,input){const r=spawnSync(command,args,{encoding:'utf8',input,timeout:30000,maxBuffer:64*1024*1024});if(r.error)throw r.error;assert.equal(r.status,0,r.stderr);return r.stdout;}
export function compileBlobOracle(t){
  const originals=[['actors/blobs/Blob.java','d53cbdec9e0915375e25a53efebb8ead610bf70c'],['utils/BArray.java','dec22b52f08c99a0b9b2fd3953b6169960726a5e']];
  for(const[path,sha]of originals){const b=readFileSync(join(root,source,path));assert.equal(createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex'),sha);}
  mkdirSync(join(root,'tmp'),{recursive:true});const out=mkdtempSync(join(root,'tmp/blob-oracle-'));t.after(()=>rmSync(out,{recursive:true,force:true}));
  const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);
  const paths=walk(join(root,'tools/port/oracle/blobs/stubs'));
  run('javac',['-proc:none','-encoding','UTF-8','-d',out,...originals.map(([p])=>join(root,source,p)),...paths,join(root,'tools/port/oracle/blobs/BlobOracle.java')]);
  return input=>run('java',['-cp',out,'port.oracle.BlobOracle'],input).trimEnd().split('\n');
}
export function blobDigest(state,time){const b=new DataView(new ArrayBuffer(4));b.setFloat32(0,time);return createHash('sha256').update([b.getUint32(0).toString(),state.volume,Array.from(state.cur).join(','),Array.from(state.off).join(',')].join('|')).digest('hex');}
