import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const sourceBlob = '65bb59224b2574caa7939cc030d65ad68e31a9fd';
export const signatures = [
  'public boolean attack( Char enemy )',
  'public static boolean hit( Char attacker, Char defender, boolean magic )',
  'public float speed()', 'public void damage( int dmg, Object src )',
  'public void destroy()', 'public void die( Object src )',
  'public boolean isAlive()', 'protected void spend( float time )',
];
function masked(text) {
  return text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    part => part.replace(/[^\n]/g, ' '));
}
export function method(text, signature) {
  const clean = masked(text);
  const start = clean.indexOf(signature);
  if (start < 0 || clean.indexOf(signature, start + 1) >= 0) throw new Error(`Missing/ambiguous method: ${signature}`);
  const body = clean.indexOf('{', start + signature.length);
  if (body < 0) throw new Error(`Missing body: ${signature}`);
  let depth = 1, end = body + 1;
  while (end < clean.length && depth) { if (clean[end] === '{') depth++; if (clean[end] === '}') depth--; end++; }
  if (depth) throw new Error(`Unterminated method: ${signature}`);
  return text.slice(start, end);
}
export function tokens(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    part => part.startsWith('"') || part.startsWith("'") ? part : ' ');
  return clean.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?[fFdDlL]?|[^\s]/g) ?? [];
}
export function verifySource(sourcePath, referencePath) {
  const bytes = readFileSync(sourcePath);
  const blob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  if (blob !== sourceBlob) throw new Error(`Original Char.java changed: ${blob}`);
  const source = bytes.toString('utf8'), reference = readFileSync(referencePath,'utf8');
  for (const signature of signatures) {
    const expected = tokens(method(source, signature)).join('\n');
    const actual = tokens(method(reference, signature)).join('\n');
    if (actual !== expected) throw new Error(`Reference changed executable Java tokens: ${signature}`);
  }
  return signatures.length;
}
