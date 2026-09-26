import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('the e2e npm entry is a fail-closed notice, not browser automation', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(packageJson.scripts['test:e2e'], 'node tools/browser-check-blocked.mjs');
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./browser-check-blocked.mjs', import.meta.url))], {
    encoding: 'utf8', timeout: 5000,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 2);
  assert.match(result.stderr, /BLOCKED \(PD-R20\)/);
  assert.match(result.stderr, /no check was run/);
});
