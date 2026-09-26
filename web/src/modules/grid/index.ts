// Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
// Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / levels/Level.java.
// Level's neighbor order is distinct from the order used inside GridPathFinder.
export const LEVEL_WIDTH = 32;
export const LEVEL_HEIGHT = 32;
export const LEVEL_LENGTH = LEVEL_WIDTH * LEVEL_HEIGHT;
export const NEIGHBOURS4: readonly number[] = Object.freeze([-LEVEL_WIDTH, 1, LEVEL_WIDTH, -1]);
export const NEIGHBOURS8: readonly number[] = Object.freeze([
  1, -1, LEVEL_WIDTH, -LEVEL_WIDTH,
  1 + LEVEL_WIDTH, 1 - LEVEL_WIDTH, -1 + LEVEL_WIDTH, -1 - LEVEL_WIDTH,
]);
export { GridPathFinder } from './GridPathFinder.ts';
export { GridBallistica } from './GridBallistica.ts';
