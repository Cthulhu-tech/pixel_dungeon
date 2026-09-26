import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const web = fileURLToPath(new URL('../', import.meta.url));
const temporary = fileURLToPath(new URL('../../tmp/', import.meta.url));
const compiler = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
mkdirSync(temporary, { recursive: true });
const host = mkdtempSync(join(temporary, 'compatibility-extraction-'));
try {
  // This host has neither the rest of src/types nor another game module/adapter.
  mkdirSync(join(host, 'src/modules'), { recursive: true });
  mkdirSync(join(host, 'src/types'), { recursive: true });
  cpSync(join(web, 'src/modules/compatibility'), join(host, 'src/modules/compatibility'), { recursive: true });
  cpSync(join(web, 'src/types/compatibility'), join(host, 'src/types/compatibility'), { recursive: true });
  cpSync(join(web, 'tsconfig.compatibility.json'), join(host, 'tsconfig.json'));
  const result = spawnSync(process.execPath, [compiler, '--project', join(host, 'tsconfig.json')], {
    cwd: host, encoding: 'utf8', timeout: 30000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Isolated compatibility typecheck failed\n${result.stdout}\n${result.stderr}`);
  console.log('PASS: extracted compatibility module typechecks without DOM, adapters or unrelated ambient declarations');
} finally {
  rmSync(host, { recursive: true, force: true });
}
