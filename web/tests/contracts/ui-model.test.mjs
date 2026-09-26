import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
test('domain public API imports in a clean Node process without DOM or Phaser', () => {
  const output = execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', "if (typeof document !== 'undefined') throw Error('Unexpected DOM'); const m=await import('./src/modules/grid/index.ts'); console.log(m.LEVEL_LENGTH);"], { encoding: 'utf8' });
  assert.equal(output.trim(), '1024');
});
