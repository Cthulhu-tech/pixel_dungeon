import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Diagnostic only. Published records choose candidates; application pins never change here.
const root=fileURLToPath(new URL('../../',import.meta.url));
const scratch=join(root,'tmp');mkdirSync(scratch,{recursive:true});
const compiler=fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
const cases=[],discovery=[];
async function versions(name,major){
  const response=await fetch('https://registry.npmjs.org/'+encodeURIComponent(name),{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`${name}: HTTP ${response.status}`);
  const data=await response.json();
  if(data.name!==name||!data.versions)throw new Error(`${name}: missing package identity/versions`);
  return Object.keys(data.versions).filter(v=>new RegExp(`^${major}\\.\\d+\\.\\d+$`).test(v))
    .sort((a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);return y[1]-x[1]||y[2]-x[2];});
}
try {
  const published=await versions('xstate',5);
  const candidates=[33,32,30,25,20,19,18,11,5,0].map(minor=>published.find(v=>Number(v.split('.')[1])===minor)).filter(Boolean);
  discovery.push({name:'xstate',candidates});
  for(const version of candidates)cases.push({name:'xstate-'+version,dependencies:{xstate:version},
    code:"import { createMachine, createActor } from 'xstate'; export const actor = createActor(createMachine({initial:'ready',states:{ready:{}}}));"});
} catch(error){discovery.push({name:'xstate',error:String(error)});}
try {
  const published=await versions('phaser4-rex-plugins',4);
  const candidates=[2,1,0].map(minor=>published.find(v=>Number(v.split('.')[1])===minor)).filter(Boolean);
  discovery.push({name:'phaser4-rex-plugins',candidates});
  const imports={full:'templates/ui/ui-plugin.js',label:'templates/ui/label/Label.js',button:'plugins/button.js'};
  for(const version of candidates)for(const [part,path] of Object.entries(imports))cases.push({
    name:`phaser4.1-rex${version}-${part}`,dependencies:{phaser:'4.1.0','phaser4-rex-plugins':version},
    code:`import Phaser from 'phaser'; import Component from 'phaser4-rex-plugins/${path}'; export const component=Component; export const scene=new Phaser.Scene('probe');`,
  });
} catch(error){discovery.push({name:'phaser4-rex-plugins',error:String(error)});}
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
