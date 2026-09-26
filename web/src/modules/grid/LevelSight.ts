/* Pixel Dungeon Level.updateFieldOfView, pinned ce7f2415; GPL-3.0-or-later.
 * Copyright (C) 2012-2015 Oleg Dolya. Per-level FOV owner; actor and world are query ports.
 */
import { gridDistance, LEVEL_WIDTH, LEVEL_HEIGHT, LEVEL_LENGTH } from './geometry.ts';
import { readGridFlag } from './mask.ts';

export class LevelSight {
  private readonly output = new Uint8Array(LEVEL_LENGTH);
  private readonly caster: PDLevelShadowCast;

  constructor(caster: PDLevelShadowCast) { this.caster = caster; }

  /** A borrowed mask is overwritten on the next actor query, like the original static buffer. */
  update(actor: PDLevelSightActor, world: PDLevelSightWorld): PDGridPassability {
    const cx = actor.position % LEVEL_WIDTH;
    const cy = Math.trunc(actor.position / LEVEL_WIDTH) | 0;
    const sighted = !actor.hasBlindness() && !actor.hasShadows() && actor.isAlive();
    if (sighted) this.caster.castShadow(cx, cy, this.output, actor.viewDistance, world.losBlocking);
    else this.output.fill(0);

    let sense = 1;
    if (actor.isAlive()) {
      for (const distance of actor.mindVisionDistances()) sense = Math.max(distance, sense);
    }
    if ((sighted && sense > 1) || !sighted) {
      const ax = Math.max(0, (cx - sense) | 0), bx = Math.min((cx + sense) | 0, LEVEL_WIDTH - 1);
      const ay = Math.max(0, (cy - sense) | 0), by = Math.min((cy + sense) | 0, LEVEL_HEIGHT - 1);
      const length = (bx - ax + 1) | 0;
      let pos = (ax + Math.imul(ay, LEVEL_WIDTH)) | 0;
      for (let y = ay; y <= by; y++, pos = (pos + LEVEL_WIDTH) | 0) this.fillRange(pos, (pos + length) | 0);
      // The source intersects the ENTIRE mask, including shadow-cast cells, with discoverable.
      for (let i = 0; i < LEVEL_LENGTH; i++) this.output[i] = Number(readGridFlag(this.output, i)) & Number(this.discoverableAt(world, i));
    }

    if (actor.isAlive()) {
      if (actor.hasMindVision()) {
        for (const cell of world.mobPositions()) this.revealAround(cell);
      } else if (actor.isHero() && actor.isHuntress()) {
        for (const cell of world.mobPositions()) {
          if (gridDistance(actor.position, cell, LEVEL_WIDTH) === 2) this.revealAround(cell);
        }
      }
      if (actor.hasAwareness()) {
        for (const cell of world.heapPositions()) this.revealAround(cell);
      }
    }
    return this.output;
  }

  snapshot(): Uint8Array { return this.output.slice(); }

  private discoverableAt(world: PDLevelSightWorld, cell: number): boolean {
    return readGridFlag(world.discoverable, cell);
  }

  private fillRange(from: number, to: number): void {
    if (from > to) throw new RangeError('Java fill fromIndex > toIndex');
    if (from < 0 || to > this.output.length) throw new RangeError('Java fill bounds');
    this.output.fill(1, from, to);
  }

  private revealAround(cell: number): void {
    // Keep source assignment order and partial writes before out-of-bounds errors.
    for (const offset of [0, 1, -1, LEVEL_WIDTH + 1, LEVEL_WIDTH - 1, -LEVEL_WIDTH + 1, -LEVEL_WIDTH - 1, LEVEL_WIDTH, -LEVEL_WIDTH]) {
      const index = (cell + offset) | 0;
      if (index < 0 || index >= this.output.length) throw new RangeError('Java fieldOfView bounds');
      this.output[index] = 1;
    }
  }
}
