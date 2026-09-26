import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Diagnostic only: never changes application pins or accepts an incompatible build.
const root=fileURLToPath(new URL('../../',import.meta.url));
const scratch=join(root,'tmp');mkdirSync(scratch,{recursive:true});
const compiler=fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
const cases=[
  {name:'phaser-4.0.0',dependencies:{phaser:'4.0.0'},code:"import Phaser from 'phaser'; export const scene = new Phaser.Scene('probe');"},
  {name:'phaser-4.1.0',dependencies:{phaser:'4.1.0'},code:"import Phaser from 'phaser'; export const scene = new Phaser.Scene('probe');"},
  {name:'phaser-4.2.1',dependencies:{phaser:'4.2.1'},code:"import Phaser from 'phaser'; export const scene = new Phaser.Scene('probe');"},
];
async function latest(name,major){
  const response=await fetch('https://registry.npmjs.org/'+encodeURIComponent(name)+'/latest',{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`${name}: HTTP ${response.status}`);
  const data=await response.json();
  if(data.name!==name||typeof data.version!=='string'||!data.version.startsWith(major+'.'))throw new Error(`${name}: unexpected latest identity/major`);
  return data.version;
}
const discovery=[];
for(const [name,major] of [['xstate',5],['phaser4-rex-plugins',4]]){
  try{
    const version=await latest(name,major);discovery.push({name,version});
    cases.push(name==='xstate'?
      {name:'xstate-'+version,dependencies:{xstate:version},code:"import { createMachine } from 'xstate'; export const machine = createMachine({initial:'ready',states:{ready:{}}});"}:
      {name:'rex-full-'+version,dependencies:{phaser:'4.2.1',[name]:version},code:"import Phaser from 'phaser'; import RexUI from 'phaser4-rex-plugins/templates/ui/ui-plugin.js'; export const plugin = RexUI; export const scene = new Phaser.Scene('probe');"});
  }catch(error){discovery.push({name,error:String(error)});}
}
const results=[];
for(const entry of cases){
  const host=mkdtempSync(join(scratch,'types-probe-'));
  try{
    writeFileSync(join(host,'package.json'),JSON.stringify({private:true,type:'module',dependencies:entry.dependencies},null,2)+'\n');
    writeFileSync(join(host,'probe.ts'),entry.code+'\n');
    writeFileSync(join(host,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'Bundler',lib:['ES2022','DOM'],types:[],strict:true,exactOptionalPropertyTypes:true,noUncheckedIndexedAccess:true,noEmit:true},files:['probe.ts']},null,2)+'\n');
    const install=spawnSync('npm',['install','--ignore-scripts','--no-audit','--no-fund'],{cwd:host,encoding:'utf8',timeout:180000,env:{...process.env,PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:'1'}});
    if(install.error||install.status!==0){results.push({name:entry.name,dependencies:entry.dependencies,installation:'FAILED',error:String(install.error??install.stderr)});continue;}
    const check=spawnSync(process.execPath,[compiler,'-p',join(host,'tsconfig.json')],{cwd:host,encoding:'utf8',timeout:30000});
    if(check.error)throw check.error;
    results.push({name:entry.name,dependencies:entry.dependencies,installation:'PASS',typecheckExit:check.status,diagnostics:check.stdout.replaceAll(host,'<probe>'),stderr:check.stderr});
  }catch(error){results.push({name:entry.name,error:String(error)});}finally{rmSync(host,{recursive:true,force:true});}
}
const report={scope:'DIAGNOSTIC_ONLY_NOT_APPLICATION_ACCEPTANCE',applicationPinsChanged:false,discovery,results};
writeFileSync(join(scratch,'dependency-type-probe.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(results.some(r=>r.error||r.installation==='FAILED')||discovery.some(r=>r.error))process.exitCode=1;
