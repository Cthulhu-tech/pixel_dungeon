import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const web = fileURLToPath(new URL('../', import.meta.url));

test('the general contract entry loads TypeScript on the supported Node 22 runtime', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  // Inspect before execution: no indirect browser, wrapper or unrelated lifecycle command.
  assert.equal(manifest.scripts['test:contracts'], 'node --experimental-strip-types --test tests/contracts/*.test.mjs');
  const args = manifest.scripts['test:contracts'].split(' ').slice(1);
  // This is an independent runner, not a recursively invoked child of node:test.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, args, {
    cwd: web, env, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /# fail 0/);
  assert.match(result.stdout, /# skipped 0/);
  // The important regression is the .ts import, not just an empty successful command.
  assert.match(result.stdout, /old callback cannot complete a later turn/);
});
