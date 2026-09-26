import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

/** External registry verification only: never normalizes or rewrites authored game content. */
export function auditDependencyPins(manifest, query) {
  const requested = [...Object.entries(manifest.dependencies), ...Object.entries(manifest.devDependencies)];
  const results = requested.map(([name, version]) => {
    try {
      const metadata = query(name, version);
      if (metadata === null || typeof metadata !== 'object' || metadata.name !== name || metadata.version !== version) {
        throw new Error('Registry did not return the exact requested package name and version');
      }
      if (typeof metadata.dist?.tarball !== 'string' || typeof metadata.dist?.integrity !== 'string') {
        throw new Error('Registry response is missing tarball/integrity metadata');
      }
      return {
        name, requested: version, status: 'FOUND', resolved: metadata.version,
        engines: metadata.engines ?? null, tarball: metadata.dist.tarball, integrity: metadata.dist.integrity,
      };
    } catch (error) {
      return { name, requested: version, status: 'FAILED', error: error instanceof Error ? error.message : String(error) };
    }
  });
  return { scope: 'REGISTRY_PIN_EXISTENCE_NOT_RUNTIME_COMPATIBILITY', passed: results.every(row => row.status === 'FOUND'), results };
}

function queryRegistry(name, version) {
  const result = spawnSync('npm', ['view', `${name}@${version}`, '--json', '--registry=https://registry.npmjs.org',
    '--fetch-retries=0', '--fetch-timeout=20000'], {
    encoding: 'utf8', timeout: 25000, maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `npm exited ${result.status}`).trim());
  return JSON.parse(result.stdout);
}

export function runDependencyAudit() {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const report = auditDependencyPins(manifest, queryRegistry);
  const output = fileURLToPath(new URL('../../tmp/dependency-pins.json', import.meta.url));
  mkdirSync(dirname(output), { recursive: true });
  const text = JSON.stringify({ sourceCommit: process.env.GITHUB_SHA ?? null, ...report }, null, 2) + '\n';
  writeFileSync(output, text);
  console.log(text);
  if (!report.passed) process.exitCode = 1;
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) runDependencyAudit();
