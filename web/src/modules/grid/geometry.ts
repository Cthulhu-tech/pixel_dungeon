/*
 * Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / levels/Level.java.
 * Pure grid arithmetic; flattened adjacency deliberately differs from distance <= 1.
 */
export function gridAdjacent(first: number, second: number, width: number): boolean {
  const difference = Math.abs((first - second) | 0) | 0;
  return difference === 1 || difference === width || difference === ((width + 1) | 0) || difference === ((width - 1) | 0);
}

export function gridDistance(first: number, second: number, width: number): number {
  if (width === 0) throw new RangeError('Java integer division by zero');
  const ax = first % width, bx = second % width;
  const ay = Math.trunc(first / width) | 0, by = Math.trunc(second / width) | 0;
  return Math.max(Math.abs((ax - bx) | 0) | 0, Math.abs((ay - by) | 0) | 0);
}

export function gridNeighbours8(width: number): readonly number[] {
  return [1, -1, width, -width, (1 + width) | 0, (1 - width) | 0, (width - 1) | 0, (-1 - width) | 0];
}

// Single source for Level's fixed dimensions and iteration order.
export const LEVEL_WIDTH = 32;
export const LEVEL_HEIGHT = 32;
export const LEVEL_LENGTH = LEVEL_WIDTH * LEVEL_HEIGHT;
export const NEIGHBOURS4: readonly number[] = Object.freeze([-LEVEL_WIDTH, 1, LEVEL_WIDTH, -1]);
export const NEIGHBOURS8: readonly number[] = Object.freeze(gridNeighbours8(LEVEL_WIDTH));
export const NEIGHBOURS9: readonly number[] = Object.freeze([0, ...NEIGHBOURS8]);
