import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { verifySource, method, tokens } from '../../../tools/port/oracle/character/source-methods.mjs';
const root=new URL('../../../',import.meta.url);
test('character oracle uses the pinned original executable method tokens',()=>{
  assert.equal(verifySource(fileURLToPath(new URL('src/com/watabou/pixeldungeon/actors/Char.java',root)),
    fileURLToPath(new URL('tests/reference/character/CharReference.java',root))),8);
});
test('source matcher preserves literals, ignores comment braces and rejects altered executable tokens',()=>{
  const signature='public void run()';
  const a='public void run() { /* } */ System.out.print("a b }"); // {\n x++; }';
  const b='public void run() { System.out.print("a b }"); x ++ ; }';
  assert.deepEqual(tokens(method(a,signature)),tokens(method(b,signature)));
  assert.notDeepEqual(tokens(method(a,signature)),tokens(method(b.replace('a b','ab'),signature)));
  assert.notDeepEqual(tokens(method(a,signature)),tokens(method(b.replace('++','--'),signature)));
  assert.throws(()=>method('public void run() {',signature),/Unterminated/);
});
