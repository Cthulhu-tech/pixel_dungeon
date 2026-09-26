import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

/** Isolate explicitly listed pure owners; never copy the entire application/type tree. */
export function checkModuleExtraction(configuration, owners) {
  const web = fileURLToPath(new URL('../', import.meta.url));
  const temporary = fileURLToPath(new URL('../../tmp/', import.meta.url));
  const compiler = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
  mkdirSync(temporary, { recursive: true });
  const host = mkdtempSync(join(temporary, 'module-extraction-'));
  try {
    mkdirSync(join(host, 'src/modules'), { recursive: true });
    mkdirSync(join(host, 'src/types'), { recursive: true });
    for (const owner of owners) {
      cpSync(join(web, 'src/modules', owner), join(host, 'src/modules', owner), { recursive: true });
      cpSync(join(web, 'src/types', owner), join(host, 'src/types', owner), { recursive: true });
    }
    cpSync(join(web, configuration), join(host, 'tsconfig.json'));
    const result = spawnSync(process.execPath, [compiler, '--project', join(host, 'tsconfig.json')], {
      cwd: host, encoding: 'utf8', timeout: 30000,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Isolated typecheck failed\n${result.stdout}\n${result.stderr}`);
    console.log(`PASS: extracted ${owners.join(' + ')} with only owner declarations; no DOM/adapters/unrelated globals`);
  } finally {
    rmSync(host, { recursive: true, force: true });
  }
}
