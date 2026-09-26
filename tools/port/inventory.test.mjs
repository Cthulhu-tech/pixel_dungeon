import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseTree, javaIndex, inspectRepository, mergeMap, encode } from './inventory.mjs';
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
const hash = 'a'.repeat(40);
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'pd-inventory-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'init', '-q'); git(root, 'config', 'user.name', 'Inventory Test'); git(root, 'config', 'user.email', 'test@example.invalid');
  const values = { 'src/Example.java': 'package demo;\nimport java.util.Set;\npublic class Example { enum State { IDLE } }\n', 'assets/binary data.bin': Buffer.from([0, 255, 10, 13, 128]), 'res/кириллица.txt': 'пример\n', 'path\twith-tab.txt': 'tab\n' };
  for (const [path, content] of Object.entries(values)) { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), content); }
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'fixture');
  return { root, values, source: { repository: 'test/fixture', commit: git(root, 'rev-parse', 'HEAD'), tree: git(root, 'rev-parse', 'HEAD^{tree}') } };
}
test('NUL tree parsing preserves tabs and unicode filenames', () => {
  const rows = parseTree(Buffer.from(`100644 blob ${hash}      5\tx\ty.txt\0`));
  assert.equal(rows[0].path, 'x\ty.txt'); assert.equal(rows[0].bytes, 5);
});
test('unsupported submodules and symlinks fail instead of disappearing', () => {
  assert.throws(() => parseTree(Buffer.from(`160000 commit ${hash} -\tx\0`)), /Unsupported/);
  assert.throws(() => parseTree(Buffer.from(`120000 blob ${hash} 1\tx\0`)), /Unsupported/);
});
test('Java lexical indexing ignores comments and quoted fake declarations', () => {
  const result = javaIndex('/* class Fake {} */\npackage a.b;\nimport static a.B.x;\n// import fake.No;\nclass Real { String s="class Fake {}"; interface Nested {} }');
  assert.equal(result.package, 'a.b');
  assert.deepEqual(result.imports, [{ name: 'a.B.x', static: true }]);
  assert.deepEqual(result.symbols.map((s) => s.name), ['Real', 'Nested']);
  assert.equal(result.symbols[0].line, 5);
});
test('audit reads pinned blobs, not dirty working-tree state', (t) => {
  const f = fixture(t); const before = inspectRepository(f.root, f.source);
  writeFileSync(join(f.root, 'src/Example.java'), 'BROKEN CHANGED WORKTREE');
  writeFileSync(join(f.root, 'untracked.txt'), 'ignore');
  assert.deepEqual(inspectRepository(f.root, f.source), before);
  assert.equal(before.length, 4);
});
test('binary bytes hashed without UTF-8 loss; generation is deterministic', (t) => {
  const f = fixture(t); const rows = inspectRepository(f.root, f.source);
  const binary = rows.find((r) => r.path === 'assets/binary data.bin');
  assert.equal(binary.sha256, createHash('sha256').update(f.values['assets/binary data.bin']).digest('hex'));
  assert.equal(encode(rows), encode(inspectRepository(f.root, f.source)));
});
test('incorrect pinned tree fails closed', (t) => {
  const f = fixture(t); assert.throws(() => inspectRepository(f.root, { ...f.source, tree: hash }), /tree mismatch/);
});
test('mapping preserves human work and initializes only new rows', (t) => {
  const f = fixture(t); const rows = inspectRepository(f.root, f.source);
  const map = mergeMap(rows.slice(0, 2), null);
  map.entries[0].status = 'IN_PROGRESS'; map.entries[0].notes = 'human note'; map.entries[0].targetFiles = ['web/src/a.ts'];
  const merged = mergeMap(rows, map);
  assert.deepEqual(merged.entries[0], map.entries[0]); assert.equal(merged.entries[2].status, 'TODO');
  assert.deepEqual(mergeMap(rows, merged), merged);
});
test('mapping refuses removed entries or changed baselines', (t) => {
  const f = fixture(t); const rows = inspectRepository(f.root, f.source); const map = mergeMap(rows, null);
  assert.throws(() => mergeMap(rows.slice(1), map), /lose a source/);
  const changed = structuredClone(rows); changed[0].source.commit = hash;
  assert.throws(() => mergeMap(changed, map), /Source changed/);
});
test('duplicate mapping and inventory ids are errors', (t) => {
  const f = fixture(t); const rows = inspectRepository(f.root, f.source); const map = mergeMap(rows, null);
  assert.throws(() => mergeMap([rows[0], rows[0]], null), /Duplicate inventory/);
  map.entries.push(map.entries[0]); assert.throws(() => mergeMap(rows, map), /Duplicate mapping/);
});
