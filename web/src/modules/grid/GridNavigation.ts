/*
 * Derived from Pixel Dungeon Dungeon.findPath/flee and Level.adjacent.
 * Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later; see LICENSE.txt.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 */
import { readGridFlag } from './mask.ts';
import { gridAdjacent } from './geometry.ts';

/** Source movement policy around the original pathfinder; never owns actor/world state. */
export class GridNavigation {
  private readonly width: number;
  private readonly working: Uint8Array;
  private readonly pathfinder: PDNavigationPathfinder;

  constructor(width: number, height: number, pathfinder: PDNavigationPathfinder) {
    const size = width * height;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || size > 2147483647) {
      throw new RangeError('Navigation requires positive int32 map dimensions and area');
    }
    this.width = width;
    this.working = new Uint8Array(size);
    this.pathfinder = pathfinder;
  }

  findPath(actor: PDNavigationActor, from: number, to: number, pass: PDGridPassability,
    visible: PDGridPassability, world: PDNavigationWorld): number {
    if (gridAdjacent(from, to, this.width)) {
      // Original adjacent fast path ignores flight/buffs and never consults visibility.
      return !world.hasCharacter(to) && (readGridFlag(pass, to) || readGridFlag(world.avoid, to)) ? to : -1;
    }
    this.prepareMask(pass, world.avoid, actor.flying || actor.hasAmok() || actor.hasRage());
    this.blockVisibleCharacters(visible, world);
    return this.pathfinder.getStep(from, to, this.working);
  }

  flee(actor: PDNavigationActor, current: number, threat: number, pass: PDGridPassability,
    visible: PDGridPassability, world: PDNavigationWorld): number {
    // Unlike findPath, Amok/Rage do not enable avoid cells in the source flee method.
    this.prepareMask(pass, world.avoid, actor.flying);
    this.blockVisibleCharacters(visible, world);
    this.setWorking(current, true);
    return this.pathfinder.getStepBack(current, threat, this.working);
  }

  private prepareMask(pass: PDGridPassability, avoid: PDGridPassability, includeAvoid: boolean): void {
    if (includeAvoid) {
      // BArray.or uses the FIRST array length and preserves short-circuit reads.
      for (let i = 0; i < pass.length; i++) this.setWorking(i, readGridFlag(pass, i) || readGridFlag(avoid, i));
    } else {
      // Source System.arraycopy checks its whole source/destination range before copying.
      if (pass.length < this.working.length) throw new RangeError('Java arraycopy source bounds');
      for (let i = 0; i < this.working.length; i++) this.working[i] = Number(readGridFlag(pass, i));
    }
  }

  private blockVisibleCharacters(visible: PDGridPassability, world: PDNavigationWorld): void {
    for (const position of world.characterPositions()) {
      if (readGridFlag(visible, position)) this.setWorking(position, false);
    }
  }

  private setWorking(cell: number, passable: boolean): void {
    if (cell < 0 || cell >= this.working.length) throw new RangeError('Java navigation mask bounds');
    this.working[cell] = Number(passable);
  }
}
