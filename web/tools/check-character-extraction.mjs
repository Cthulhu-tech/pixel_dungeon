import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=fileURLToPath(new URL('../../',import.meta.url));
const scratch=join(root,'tmp');mkdirSync(scratch,{recursive:true});
const host=mkdtempSync(join(scratch,'character-extraction-'));
function compile(){
  const result=spawnSync('tsc',['-p',join(host,'tsconfig.json')],{encoding:'utf8',timeout:30000});
  if(result.error)throw result.error;return result;
}
try {
  for(const path of ['modules/actors','modules/combat','types/actors','types/combat'])
    cpSync(join(root,'web/src',path),join(host,'src',path),{recursive:true});
  writeFileSync(join(host,'tsconfig.json'),JSON.stringify({compilerOptions:{
    target:'ES2022',module:'ESNext',moduleResolution:'Bundler',lib:['ES2022'],types:[],
    strict:true,noUncheckedIndexedAccess:true,exactOptionalPropertyTypes:true,noImplicitOverride:true,
    allowImportingTsExtensions:true,verbatimModuleSyntax:true,noEmit:true},include:['src']},null,2)+'\n');
  const result=compile();
  if(result.status!==0)throw new Error(result.stdout+result.stderr);
  // Negative control: unrelated project globals must not secretly supply these contracts.
  rmSync(join(host,'src/types/combat'),{recursive:true});
  const negative=compile();
  if(negative.status===0 || !negative.stdout.includes('PDCombat'))throw new Error('Missing owner declaration was not detected');
  console.log('Character/combat extraction PASS; missing declarations rejected; no DOM/framework/global project context');
} finally {rmSync(host,{recursive:true,force:true});}
