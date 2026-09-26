import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Explicit diagnostic, NOT acceptance or a silent package downgrade.
const root=fileURLToPath(new URL('../../',import.meta.url));
const scratch=join(root,'tmp');mkdirSync(scratch,{recursive:true});
const compiler=fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
const results=[],discovery=[];
try {
  const response=await fetch('https://registry.npmjs.org/xstate',{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`xstate: HTTP ${response.status}`);
  const metadata=await response.json();
  if(metadata.name!=='xstate'||!metadata.versions)throw new Error('Missing xstate version identity');
  const versions=Object.keys(metadata.versions).filter(v=>/^4\.\d+\.\d+$/.test(v))
    .sort((a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);return y[1]-x[1]||y[2]-x[2];});
  const candidates=[...new Set(versions.map(v=>v.split('.')[1]))].slice(0,2).map(minor=>versions.find(v=>v.split('.')[1]===minor));
  discovery.push({name:'xstate',major:4,candidates});
  for(const version of candidates){
    const host=mkdtempSync(join(scratch,'types-probe-'));
    try{
      const dependencies={phaser:'4.1.0','phaser4-rex-plugins':'4.2.0',xstate:version};
      writeFileSync(join(host,'package.json'),JSON.stringify({private:true,type:'module',dependencies},null,2)+'\n');
      writeFileSync(join(host,'probe.ts'),"import Phaser from 'phaser';\nimport Button from 'phaser4-rex-plugins/plugins/button.js';\nimport {createMachine,interpret} from 'xstate';\nexport const service=interpret(createMachine({initial:'ready',states:{ready:{}}}));\nexport const component=Button;\nexport const scene=new Phaser.Scene('probe');\n");
      writeFileSync(join(host,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'Bundler',lib:['ES2022','DOM'],types:[],strict:true,exactOptionalPropertyTypes:true,noUncheckedIndexedAccess:true,noEmit:true},files:['probe.ts']},null,2)+'\n');
      const install=spawnSync('npm',['install','--ignore-scripts','--no-audit','--no-fund'],{cwd:host,encoding:'utf8',timeout:180000,env:{...process.env,PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:'1'}});
      if(install.error||install.status!==0)throw new Error(String(install.error??install.stderr));
      const check=spawnSync(process.execPath,[compiler,'-p',join(host,'tsconfig.json')],{cwd:host,encoding:'utf8',timeout:30000});
      if(check.error)throw check.error;
      const row={name:'phaser4.1-rexbutton-xstate'+version,dependencies,typecheckExit:check.status,diagnostics:check.stdout.replaceAll(host,'<probe>'),stderr:check.stderr};
      if(check.status===0){
        const archive=join(scratch,'compatible-probe-inputs.tar.gz');
        const tar=spawnSync('tar',['-czf',archive,'node_modules','package-lock.json','package.json','probe.ts','tsconfig.json'],{cwd:host,encoding:'utf8',timeout:30000});
        if(tar.error||tar.status!==0)throw new Error(String(tar.error??tar.stderr));
        row.archiveSha256=createHash('sha256').update(readFileSync(archive)).digest('hex');
        results.push(row);break;
      }
      results.push(row);
    }catch(error){results.push({version,error:String(error)});}finally{rmSync(host,{recursive:true,force:true});}
  }
}catch(error){discovery.push({error:String(error)});}
const report={scope:'DIAGNOSTIC_ONLY_NOT_APPLICATION_ACCEPTANCE',applicationPinsChanged:false,discovery,results};
writeFileSync(join(scratch,'dependency-type-probe.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(results.some(r=>r.error)||discovery.some(r=>r.error))process.exitCode=1;
