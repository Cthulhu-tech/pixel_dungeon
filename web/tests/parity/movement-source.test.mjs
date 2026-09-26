import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { method,tokens } from '../../../tools/port/oracle/character/source-methods.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
test('movement and door oracle methods match the executable tokens of their pinned original files',()=>{
  const reference=readFileSync(join(root,'tests/reference/movement/MovementReference.java'),'utf8');
  const sources=[
    ['actors/Char.java','65bb59224b2574caa7939cc030d65ad68e31a9fd',['public void move( int step )','public int distance( Char other )']],
    ['levels/Level.java','c92488406814f6fb270c77799213200b8a72decb',['public static int distance( int a, int b )','public static boolean adjacent( int a, int b )']],
    ['levels/features/Door.java','5afc45e71ba1f2b7722e2cd02b12e2cc18e1cd5e',['public static void enter( int pos )','public static void leave( int pos )']],
  ];
  for(const [path,sha,signatures] of sources){
    const bytes=readFileSync(join(root,'src/com/watabou/pixeldungeon',path));
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),sha);
    for(const signature of signatures)assert.deepEqual(tokens(method(reference,signature)),tokens(method(bytes.toString('utf8'),signature)),signature);
  }
});
