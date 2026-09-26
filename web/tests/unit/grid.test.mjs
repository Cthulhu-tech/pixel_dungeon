import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_WIDTH, LEVEL_HEIGHT, LEVEL_LENGTH, NEIGHBOURS4, NEIGHBOURS8 } from '../../src/modules/grid/index.ts';
test('grid constants match pinned Level.java (not a full grid parity test)', () => {
  assert.equal(LEVEL_WIDTH, 32); assert.equal(LEVEL_HEIGHT, 32); assert.equal(LEVEL_LENGTH, 1024);
  assert.deepEqual(NEIGHBOURS4, [-32, 1, 32, -1]);
  assert.deepEqual(NEIGHBOURS8, [1, -1, 32, -32, 33, -31, 31, -33]);
});
test('shared neighbor tables are immutable', () => {
  assert.throws(() => { NEIGHBOURS8[0] = 999; }, TypeError);
});
