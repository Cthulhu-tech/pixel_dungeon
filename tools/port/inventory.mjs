/** Deterministic, read-only audit of pinned Git trees. No npm dependencies. */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const encode = (value) => JSON.stringify(value, null, 2) + '\n';
const order = (a, b) => a < b ? -1 : a > b ? 1 : 0;
function git(cwd, args, input) {
  const result = spawnSync('git', ['-C', cwd, ...args], { input, maxBuffer: 128 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.stderr.toString().trim()}`);
  return result.stdout;
}
function requireSha(value, name) {
  if (!/^[0-9a-f]{40}$/.test(value ?? '')) throw new Error(`${name} must be a full SHA-1`);
}
export function parseTree(bytes) {
  return bytes.toString('utf8').split('\0').filter(Boolean).map((record) => {
    const tab = record.indexOf('\t');
    const match = /^(\d+) (\w+) ([a-f0-9]{40})\s+(\d+|-)\s*$/.exec(record.slice(0, tab));
    if (!match || tab < 0) throw new Error('Malformed git ls-tree record');
    if (match[2] !== 'blob' || match[1] !== '100644' && match[1] !== '100755') {
      throw new Error(`Unsupported tree entry (must be audited explicitly): ${record}`);
    }
    return { path: record.slice(tab + 1), mode: match[1], gitBlob: match[3], bytes: Number(match[4]) };
  }).sort((a, b) => order(a.path, b.path));
}
/** Conservative lexical index, NOT a Java compiler or proof of semantic coverage. */
export function javaIndex(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    (part) => part.replace(/[^\n]/g, ' '));
  const packageName = /\bpackage\s+([\w.]+)\s*;/.exec(clean)?.[1] ?? null;
  const imports = [...clean.matchAll(/\bimport\s+(static\s+)?([\w.*]+)\s*;/g)]
    .map((m) => ({ name: m[2], static: Boolean(m[1]) }));
  const symbols = [...clean.matchAll(/\b(class|interface|enum)\s+(\w+)/g)]
    .map((m) => ({ kind: m[1], name: m[2], line: 1 + clean.slice(0, m.index).split('\n').length - 1 }));
  return { package: packageName, imports, symbols, analysis: 'LEXICAL_NOT_SEMANTIC' };
}
function kind(path) {
  if (path.endsWith('.java')) return 'java';
  if (path.endsWith('.png')) return 'image';
  if (/\.(mp3|ogg|wav)$/i.test(path)) return 'audio';
  if (path.startsWith('res/')) return 'android-resource';
  return 'reference';
}
function owner(path, external) {
  if (!path.endsWith('.java')) return kind(path) === 'reference' ? 'reference' : 'presentation';
  if (external) return /\/utils\//.test(path) ? 'compatibility' : 'presentation';
  const root = 'src/com/watabou/pixeldungeon/';
  const p = path.startsWith(root) ? path.slice(root.length) : path;
  if (p === 'actors/Actor.java') return 'turns';
  if (/^(actors\/(buffs|blobs)|plants|levels\/traps)\//.test(p)) return 'effects';
  if (p.startsWith('actors/mobs/npcs/')) return 'quests';
  if (p.startsWith('actors/')) return 'actors';
  if (p.startsWith('items/')) return 'items';
  if (p === 'levels/Level.java' || p.startsWith('mechanics/')) return 'grid';
  if (p.startsWith('levels/')) return 'generation';
  if (/^(scenes|windows|ui|sprites|effects|tiles)\//.test(p)) return 'presentation';
  if (/^(Badges|Rankings|Preferences|GamesInProgress)\.java$/.test(p)) return 'profile';
  return 'run';
}
function pngInfo(bytes) {
  if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('Invalid PNG header');
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bitDepth: bytes[24], colorType: bytes[25], transparencyAudit: 'TODO' };
}
export function inspectRepository(cwd, source) {
  requireSha(source.commit, 'commit'); requireSha(source.tree, 'tree');
  if (git(cwd, ['rev-parse', `${source.commit}^{tree}`]).toString().trim() !== source.tree) throw new Error('Pinned tree mismatch');
  const entries = parseTree(git(cwd, ['ls-tree', '-r', '-l', '-z', source.commit]));
  // One batch, raw bytes: never decode binary assets to UTF-8 or trust working-tree files.
  const payload = git(cwd, ['cat-file', '--batch'], entries.map((e) => e.gitBlob).join('\n') + '\n');
  let offset = 0;
  return entries.map((entry) => {
    const end = payload.indexOf(10, offset);
    const header = payload.toString('ascii', offset, end).split(' ');
    const size = Number(header[2]);
    if (header[0] !== entry.gitBlob || header[1] !== 'blob' || size !== entry.bytes) throw new Error('cat-file batch mismatch');
    const bytes = payload.subarray(end + 1, end + 1 + size);
    if (bytes.length !== size || payload[end + 1 + size] !== 10) throw new Error('Truncated blob');
    offset = end + 2 + size;
    const data = { id: `${source.repository}:${entry.path}`, source: { repository: source.repository, commit: source.commit, path: entry.path }, ...entry, sha256: sha256(bytes), kind: kind(entry.path), suggestedOwner: owner(entry.path, source.external), ownerReview: 'TODO' };
    if (data.kind === 'java') data.java = javaIndex(bytes.toString('utf8'));
    if (data.kind === 'image') data.image = pngInfo(bytes);
    return data;
  });
}
export function mergeMap(inventory, existing) {
  if (existing && (existing.schemaVersion !== 1 || !Array.isArray(existing.entries))) throw new Error('Unsupported mapping schema');
  const previous = new Map();
  for (const row of existing?.entries ?? []) {
    if (previous.has(row.id)) throw new Error(`Duplicate mapping id: ${row.id}`);
    previous.set(row.id, row);
  }
  const ids = new Set();
  const entries = inventory.map((source) => {
    if (ids.has(source.id)) throw new Error(`Duplicate inventory id: ${source.id}`);
    ids.add(source.id);
    const old = previous.get(source.id);
    if (old) {
      if (old.source.commit !== source.source.commit || old.source.path !== source.path || old.source.repository !== source.source.repository || old.gitBlob !== source.gitBlob) throw new Error(`Source changed; explicit baseline migration required: ${source.id}`);
      return old;
    }
    return { id: source.id, source: source.source, gitBlob: source.gitBlob, ownerModule: source.suggestedOwner, ownerReview: 'TODO', targetFiles: [], testFiles: [], referenceArtifacts: [], status: 'TODO', notes: 'File-level inventory only; symbol/behavior mapping still required.' };
  });
  for (const id of previous.keys()) if (!ids.has(id)) throw new Error(`Mapping would lose a source: ${id}`);
  return { schemaVersion: 1, scope: 'ALL_PINNED_FILES_NOT_COMPLETE_BEHAVIOR_COVERAGE', entries };
}
function readOptional(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function save(path, value, check) {
  const expected = encode(value);
  if (check) {
    if (readFileSync(path, 'utf8') !== expected) throw new Error(`Outdated generated artifact: ${path}`);
  } else { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, expected); }
}
export function run({ root, externalRoot, check = false }) {
  const baseline = JSON.parse(readFileSync(resolve(root, 'docs/port/source-baseline.json'), 'utf8'));
  const game = baseline.game;
  const dependency = baseline.externalDependencies.find((d) => d.repository === 'watabou/PD-classes');
  if (!dependency || !externalRoot) throw new Error('Provide --pd-classes /path/to/pinned/checkout; partial inventories are not accepted');
  const external = { repository: dependency.repository, commit: dependency.candidateCommit, tree: dependency.candidateTree, external: true };
  const files = [...inspectRepository(root, game), ...inspectRepository(externalRoot, external)].sort((a, b) => order(a.id, b.id));
  const inventory = { schemaVersion: 1, sources: [game, external].map((s) => ({ repository: s.repository, commit: s.commit, tree: s.tree })), scope: 'ALL_TRACKED_FILES', files };
  const mappingPath = resolve(root, 'docs/port/source-map.json');
  const mapping = mergeMap(files, readOptional(mappingPath));
  const summary = { schemaVersion: 1, baselineCommit: game.commit, dependencyCommit: external.commit, dependencyCompatibility: 'UNVERIFIED', semanticCoverage: 'NOT_VERIFIED', sources: inventory.sources.map((s) => {
    const rows = files.filter((f) => f.source.repository === s.repository);
    return { ...s, files: rows.length, bytes: rows.reduce((n, f) => n + f.bytes, 0), byKind: Object.fromEntries([...new Set(rows.map((f) => f.kind))].sort().map((k) => [k, rows.filter((f) => f.kind === k).length])) };
  }), mappingStatus: Object.fromEntries([...new Set(mapping.entries.map((e) => e.status))].sort().map((s) => [s, mapping.entries.filter((e) => e.status === s).length])) };
  save(resolve(root, 'docs/port/generated/inventory.json'), inventory, check);
  save(mappingPath, mapping, check);
  save(resolve(root, 'docs/port/generated/summary.json'), summary, check);
  console.log(encode(summary));
  return summary;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2); const options = { root: process.cwd(), externalRoot: null, check: false };
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--check') options.check = true;
      else if (args[i] === '--root' || args[i] === '--pd-classes') {
        const flag = args[i]; const value = args[++i];
        if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
        options[flag === '--root' ? 'root' : 'externalRoot'] = resolve(value);
      } else throw new Error(`Unknown argument: ${args[i]}`);
    }
    run(options);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
